import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { Track } from '@core/models/track.model';
import { ImmersiveCameraMode, ImmersiveIntensity } from '@core/state/immersive-prefs.store';
import { AudioFrame, AudioReactive } from './audio-reactive';
import { CoverParticles } from './cover-particles';
import { Shelf3D, ShelfItem } from './shelf-3d';
import { LyricLine, LyricStage3D } from './lyric-stage-3d';

/** Default camera distance (the A1 framing); manual dolly is bounded around it. */
const DEFAULT_DISTANCE = 22;

/** Configuration the engine is built with. Most of it can change later via setters. */
export interface ImmersiveEngineOptions {
  canvas: HTMLCanvasElement;
  intensity: ImmersiveIntensity;
}

/**
 * Reads an HSL design token (`--primary` is stored as the raw `"174 100% 45%"` triple,
 * without the `hsl()` wrapper) and turns it into a `THREE.Color`. Falling back to the
 * turquoise literal only if the variable is missing keeps the 3D palette bound to the
 * same token as the rest of the UI — no hard-coded hex in the WebGL layer.
 */
function tokenColor(name: string, fallback: string): THREE.Color {
  const raw = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  if (!raw) return new THREE.Color(fallback);
  // Already an hsl()/#hex value, or a bare HSL triple we need to wrap.
  const value = raw.includes('(') || raw.startsWith('#') ? raw : `hsl(${raw.replace(/\s+/g, ', ')})`;
  try {
    return new THREE.Color(value);
  } catch {
    return new THREE.Color(fallback);
  }
}

/** Per-intensity tuning. `prefers-reduced-motion` clamps the effective level to `subtle`. */
const TUNING: Record<
  Exclude<ImmersiveIntensity, 'off'>,
  { count: number; drift: number; spin: number; bloom: number }
> = {
  subtle: { count: 1200, drift: 0.04, spin: 0.01, bloom: 0.35 },
  full: { count: 4000, drift: 0.12, spin: 0.03, bloom: 0.7 },
};

/**
 * Self-contained WebGL engine for the immersive now-playing view.
 *
 * It is deliberately **decoupled from Angular**: the view pushes state in through
 * `setTrack()` / `setPlaying()` / `setIntensity()` (driven by `effect()`s outside the
 * render loop) and the engine owns its own `requestAnimationFrame` lifecycle. This keeps
 * the door open to promoting it to a global ambient background later without a rewrite.
 *
 * Step 1 scope: a calm turquoise particle field on black, the renderer/scene/camera
 * lifecycle, resize + background-tab pausing, reduced-motion handling and `dispose()`.
 * Cover particles, beat reactivity, cinema camera and the lyric stage land in later steps.
 */
export class ImmersiveEngine {
  private readonly canvas: HTMLCanvasElement;
  private readonly renderer: THREE.WebGLRenderer;
  private readonly composer: EffectComposer;
  private readonly bloom: UnrealBloomPass;
  private readonly scene = new THREE.Scene();
  private readonly camera: THREE.PerspectiveCamera;
  private readonly controls: OrbitControls;
  private cameraMode: ImmersiveCameraMode = 'auto';
  /** Notified when a manual camera interaction ends, so the view can persist the framing. */
  onCameraEnd?: (state: number[]) => void;
  private readonly clock = new THREE.Clock();
  /** Animation time that only advances during playback (keeps the scene still on pause). */
  private animTime = 0;

  /** Turquoise base, and an accent extracted from the current cover (kept turquoise-leaning). */
  private readonly primaryColor = tokenColor('--primary', '#00E6D0');
  private accent = this.primaryColor.clone();

  private points?: THREE.Points;
  private pointsGeometry?: THREE.BufferGeometry;
  private pointsMaterial?: THREE.PointsMaterial;

  private rafId = 0;
  private running = false;
  private playing = false;
  private intensity: ImmersiveIntensity;
  private readonly reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;

  /** Spectrum reader; absent until the view hands over the analyser. */
  private audio?: AudioReactive;

  /** The cover-art particle cloud (the centrepiece) and the track feeding it. */
  private readonly cover: CoverParticles;
  private track: Track | null = null;

  /** The 3D browsing shelf (hidden by default), rendered in its own scene (no bloom). */
  private readonly shelfScene = new THREE.Scene();
  private readonly shelf: Shelf3D;
  private shelfVisible = false;
  /** Tracks a pointer press that landed on a card (to tell click from drag). */
  private shelfPointer: { startX: number; startY: number; itemIndex: number; moved: boolean } | null = null;
  /** Forwarded from the shelf so the view can react (select → play, focus → caption). */
  onShelfSelect?: (index: number) => void;
  onShelfFocus?: (index: number) => void;

  /** 3D lyric stage (CSS3D), created once the view hands over its DOM container. */
  private lyricStage?: LyricStage3D;
  /** Forwarded when the active lyric line is clicked (→ seek). */
  onLyricSeek?: (timeMs: number) => void;

  private readonly resizeObserver: ResizeObserver;
  private readonly onVisibility = () => this.syncRaf();

  constructor(options: ImmersiveEngineOptions) {
    this.canvas = options.canvas;
    this.intensity = options.intensity;

    this.renderer = new THREE.WebGLRenderer({ canvas: this.canvas, antialias: true });
    this.renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
    this.renderer.setClearColor(0x000000, 1); // the black background mandated by the design

    // Pulled back with a flatter FOV for a more distant, cinematic framing: the cover cloud
    // sits ~40% of the viewport height in a wider field of black (was z=14/FOV 60 → ~56%).
    this.camera = new THREE.PerspectiveCamera(50, 1, 0.1, 100);
    this.camera.position.set(0, 0, DEFAULT_DISTANCE);

    // OrbitControls power the `manual` camera mode. Disabled by default (`auto` drives the
    // drift); damping + bounded dolly keep the feel serene. Panning is off so the cloud stays
    // centred. The 'end' event lets the view persist the user's framing.
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.08;
    this.controls.enablePan = false;
    this.controls.rotateSpeed = 0.5;
    this.controls.zoomSpeed = 0.6;
    this.controls.minDistance = 12;
    this.controls.maxDistance = 40;
    this.controls.target.set(0, 0, 0);
    this.controls.enabled = false;
    this.controls.addEventListener('end', () => this.onCameraEnd?.(this.getCameraState()));

    this.buildParticles();
    // Accent extracted from the cover tints the backdrop haze (kept turquoise-leaning).
    this.cover = new CoverParticles(this.scene, this.primaryColor, (accent) => this.applyAccent(accent));

    // Browsing shelf (hidden until a source is chosen). Its callbacks bubble to the view.
    // Label text uses the foreground token (read from CSS, not a hard-coded hex).
    this.shelf = new Shelf3D(
      this.shelfScene,
      this.reducedMotion,
      '#' + tokenColor('--foreground', '#fafafa').getHexString(),
    );
    this.shelf.onSelect = (i) => this.onShelfSelect?.(i);
    this.shelf.onFocus = (i) => this.onShelfFocus?.(i);
    // Capture-phase so a press on a card is handled before OrbitControls can start orbiting.
    window.addEventListener('pointerdown', this.onShelfPointerDown, true);

    // Subtle bloom — glow sutil, no neón. High threshold so only bright pixels bloom.
    this.composer = new EffectComposer(this.renderer);
    this.composer.setPixelRatio(this.renderer.getPixelRatio());
    this.composer.addPass(new RenderPass(this.scene, this.camera));
    this.bloom = new UnrealBloomPass(new THREE.Vector2(1, 1), this.bloomStrength, 0.6, 0.55);
    this.composer.addPass(this.bloom);
    this.composer.addPass(new OutputPass());

    this.resize();

    this.resizeObserver = new ResizeObserver(() => this.resize());
    this.resizeObserver.observe(this.canvas);
    document.addEventListener('visibilitychange', this.onVisibility);
  }

  /** Bloom intensity for the current effective level (reduced motion → lightest). */
  private get bloomStrength(): number {
    if (this.intensity === 'off' || this.reducedMotion) return TUNING.subtle.bloom;
    return TUNING[this.intensity].bloom;
  }

  /** Blend the cover's dominant colour mostly toward turquoise and tint the backdrop haze. */
  private applyAccent(accent: THREE.Color): void {
    this.accent = this.primaryColor.clone().lerp(accent, 0.3);
    this.pointsMaterial?.color.copy(this.accent);
  }

  /** Begin the render loop (called once the canvas is in the DOM). */
  start(): void {
    if (this.running) return;
    this.running = true;
    this.clock.start();
    this.syncRaf();
  }

  /** The effective tuning, clamped to `subtle` when the user prefers reduced motion. */
  private get level(): { count: number; drift: number; spin: number } {
    if (this.intensity === 'off') return TUNING.subtle;
    return this.reducedMotion ? TUNING.subtle : TUNING[this.intensity];
  }

  setPlaying(playing: boolean): void {
    this.playing = playing;
  }

  /** Switch camera driver: `manual` enables OrbitControls, `auto` returns to the drift. */
  setCameraMode(mode: ImmersiveCameraMode): void {
    this.cameraMode = mode;
    this.controls.enabled = mode === 'manual';
  }

  /** Restore a persisted manual framing: `[posX,posY,posZ, targetX,targetY,targetZ]`. */
  applyCameraState(state: number[]): void {
    if (state.length < 6) return;
    this.camera.position.set(state[0], state[1], state[2]);
    this.controls.target.set(state[3], state[4], state[5]);
    this.controls.update();
  }

  /** Current framing as a flat array for persistence. */
  getCameraState(): number[] {
    const p = this.camera.position;
    const t = this.controls.target;
    return [p.x, p.y, p.z, t.x, t.y, t.z];
  }

  /** Return to the default distance/target (the "Reset view" action). */
  resetView(): void {
    this.camera.position.set(0, 0, DEFAULT_DISTANCE);
    this.controls.target.set(0, 0, 0);
    this.controls.update();
  }

  // --- Shelf ---------------------------------------------------------------

  setShelfItems(items: ShelfItem[]): void {
    this.shelf.setItems(items);
  }

  setShelfVisible(visible: boolean): void {
    this.shelfVisible = visible;
    this.shelf.setVisible(visible);
  }

  setShelfFocus(index: number): void {
    this.shelf.setFocus(index);
  }

  shelfNext(): void {
    this.shelf.next();
  }

  shelfPrev(): void {
    this.shelf.prev();
  }

  // --- 3D lyrics -----------------------------------------------------------

  /** Hand over the DOM container that hosts the CSS3D lyric stage (called by the view). */
  setLyricContainer(container: HTMLElement): void {
    this.lyricStage?.dispose();
    this.lyricStage = new LyricStage3D(
      container,
      this.reducedMotion,
      '#' + tokenColor('--foreground', '#fafafa').getHexString(),
      '#' + tokenColor('--soft', '#9aa0a6').getHexString(),
    );
    this.lyricStage.onSeek = (line) => this.onLyricSeek?.(line.timeMs);
    this.lyricStage.setSize(
      this.canvas.clientWidth || window.innerWidth,
      this.canvas.clientHeight || window.innerHeight,
    );
  }

  setLyrics(lines: LyricLine[]): void {
    this.lyricStage?.setLines(lines);
  }

  setActiveLine(index: number): void {
    this.lyricStage?.setActive(index);
  }

  /** NDC for a pointer event relative to the canvas. */
  private toNdc(e: PointerEvent): { x: number; y: number } {
    const rect = this.canvas.getBoundingClientRect();
    return {
      x: ((e.clientX - rect.left) / rect.width) * 2 - 1,
      y: -((e.clientY - rect.top) / rect.height) * 2 + 1,
    };
  }

  /** Press on a card: claim the gesture from OrbitControls and track click-vs-drag. */
  private readonly onShelfPointerDown = (e: PointerEvent) => {
    if (!this.shelfVisible || e.target !== this.canvas) return;
    const ndc = this.toNdc(e);
    const hit = this.shelf.raycast(ndc.x, ndc.y, this.camera);
    if (hit < 0) return; // missed the shelf → let OrbitControls orbit the background
    e.stopPropagation(); // do NOT orbit when pressing a card
    this.shelfPointer = { startX: e.clientX, startY: e.clientY, itemIndex: hit, moved: false };
    window.addEventListener('pointermove', this.onShelfPointerMove);
    window.addEventListener('pointerup', this.onShelfPointerUp, { once: true });
  };

  /** Vertical drag scrolls the focus (drag up → later items); ~90px per card. */
  private readonly onShelfPointerMove = (e: PointerEvent) => {
    const p = this.shelfPointer;
    if (!p) return;
    const dy = e.clientY - p.startY;
    if (Math.abs(dy) > 6 || Math.abs(e.clientX - p.startX) > 6) p.moved = true;
    this.shelf.setFocus(p.itemIndex - Math.round(dy / 90));
  };

  /** Release: a no-move press is a click (focus, or select if already centred). */
  private readonly onShelfPointerUp = () => {
    const p = this.shelfPointer;
    window.removeEventListener('pointermove', this.onShelfPointerMove);
    this.shelfPointer = null;
    if (!p || p.moved) return;
    if (p.itemIndex === this.shelf.focus) this.onShelfSelect?.(p.itemIndex);
    else this.shelf.setFocus(p.itemIndex);
  };

  /**
   * Hand the engine the playback analyser (from `PlayerStore.getAnalyser()`). The view
   * obtains it on entry — inside a user gesture — so the AudioContext can resume.
   */
  setAnalyser(analyser: AnalyserNode): void {
    this.audio = new AudioReactive(analyser);
  }

  /** Amplitude of audio reactivity: muted under reduced motion, softened on `subtle`. */
  private get reactAmp(): number {
    if (this.reducedMotion) return 0;
    return this.intensity === 'full' ? 1 : 0.45;
  }

  /** Feed the cover-art cloud. `current()` is always a Track, but the cover url may be null. */
  setTrack(track: Track | null): void {
    this.track = track;
    this.cover.load(track?.cover ?? null, this.coverGrid);
  }

  setIntensity(intensity: ImmersiveIntensity): void {
    if (intensity === this.intensity) return;
    this.intensity = intensity;
    // Rebuild the ambient field and the cover cloud at the new density; retune bloom.
    this.disposeParticles();
    this.buildParticles();
    this.cover.load(this.track?.cover ?? null, this.coverGrid);
    this.bloom.strength = this.bloomStrength;
    this.resize();
  }

  /** Cover resolution per effective intensity (reduced motion forces the lighter grid). */
  private get coverGrid(): number {
    return this.reducedMotion || this.intensity !== 'full' ? 72 : 110;
  }

  /** Build the ambient particle cloud sized to the current intensity. */
  private buildParticles(): void {
    const { count } = this.level;
    const positions = new Float32Array(count * 3);
    // Hollow shell: the centre is left clear for the cover cloud, this is the backdrop.
    // Sized so the pulled-back camera (z=22) sits comfortably mid-shell, haze all around.
    const inner = 14;
    const outer = 30;
    for (let i = 0; i < count; i++) {
      const r = inner + (outer - inner) * Math.cbrt(this.rng(i));
      const theta = this.rng(i + 1) * Math.PI * 2;
      const phi = Math.acos(2 * this.rng(i + 2) - 1);
      positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      positions[i * 3 + 2] = r * Math.cos(phi);
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    const material = new THREE.PointsMaterial({
      color: this.accent, // turquoise base, tinted by the current cover's accent
      size: 0.05,
      sizeAttenuation: true,
      transparent: true,
      opacity: 0.4, // a soft turquoise haze, not competing with the cover
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });

    const points = new THREE.Points(geometry, material);
    this.scene.add(points);
    this.points = points;
    this.pointsGeometry = geometry;
    this.pointsMaterial = material;
  }

  /** Deterministic pseudo-random in [0,1) so the cloud is stable across rebuilds. */
  private rng(seed: number): number {
    const x = Math.sin(seed * 12.9898 + 78.233) * 43758.5453;
    return x - Math.floor(x);
  }

  /** Start the RAF loop only when visible (background tabs idle to save GPU). */
  private syncRaf(): void {
    const shouldRun = this.running && !document.hidden;
    if (shouldRun && !this.rafId) {
      this.rafId = requestAnimationFrame(this.tick);
    } else if (!shouldRun && this.rafId) {
      cancelAnimationFrame(this.rafId);
      this.rafId = 0;
    }
  }

  private readonly tick = () => {
    this.rafId = 0;
    this.render();
    this.syncRaf();
  };

  /** One frame. No Angular signals are read here — all state arrives via setters. */
  private render(): void {
    // Advance the animation clock only while playing, so the scene is fully static on pause.
    const delta = this.clock.getDelta();
    if (this.playing) this.animTime += delta;
    const elapsed = this.animTime;
    const { drift, spin } = this.level;

    // Sample the spectrum only while really playing; otherwise hold a silent (frozen) frame.
    const frame: AudioFrame =
      this.playing && this.audio ? this.audio.sample() : AudioReactive.silent();

    if (this.points && this.pointsMaterial) {
      // Rotation accelerates subtly with overall loudness; paused playback freezes motion.
      if (this.playing && !this.reducedMotion) {
        this.points.rotation.y += spin * 0.016 * (1 + frame.level * 2 * this.reactAmp);
      }

      // Beat pulse: a gentle, bounded scale swell on each onset (treble adds a touch of shimmer).
      const pulse = 1 + (frame.beat * 0.12 + frame.treble * 0.03) * this.reactAmp;
      this.points.scale.setScalar(pulse);

      // Backdrop haze breathes with energy, with a low ceiling (glow sutil, no neón).
      this.pointsMaterial.opacity = 0.35 + Math.min(0.2, frame.level * 0.35 * this.reactAmp);
    }

    // Camera: manual orbit (OrbitControls + damping) vs engine-driven cinematic drift.
    // Drift is suppressed under reduced motion; manual interaction is always allowed.
    if (this.cameraMode === 'manual') {
      this.controls.update();
    } else if (!this.reducedMotion) {
      this.camera.position.x = Math.sin(elapsed * 0.1) * drift * 8;
      this.camera.position.y = Math.cos(elapsed * 0.07) * drift * 5;
      this.camera.lookAt(0, 0, 0);
    }

    // The cover cloud is the centrepiece — it breathes/pulses even past the ambient field.
    this.cover.update({ frame, elapsed, reactAmp: this.reactAmp, reducedMotion: this.reducedMotion });

    // Shelf navigation eases regardless of playback (it's UI, not audio-reactive).
    this.shelf.update(delta);

    // Bloom swells a touch on beats, with a low ceiling (serene, not a flash).
    this.bloom.strength = this.bloomStrength * (1 + frame.beat * 0.4 * this.reactAmp);

    this.composer.render();

    // Shelf renders after — and outside — bloom, so cover art stays crisp, not blown out.
    if (this.shelfVisible) {
      this.renderer.autoClear = false;
      this.renderer.clearDepth();
      this.renderer.render(this.shelfScene, this.camera);
      this.renderer.autoClear = true;
    }

    // Lyrics: separate CSS3D layer (crisp DOM text, no bloom), same camera for parallax.
    this.lyricStage?.render(this.camera, delta);
  }

  private resize(): void {
    const w = this.canvas.clientWidth || window.innerWidth;
    const h = this.canvas.clientHeight || window.innerHeight;
    this.renderer.setSize(w, h, false);
    this.composer.setSize(w, h);
    this.bloom.setSize(w, h);
    this.lyricStage?.setSize(w, h);
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
  }

  private disposeParticles(): void {
    if (this.points) this.scene.remove(this.points);
    this.pointsGeometry?.dispose();
    this.pointsMaterial?.dispose();
    this.points = undefined;
    this.pointsGeometry = undefined;
    this.pointsMaterial = undefined;
  }

  /** Tear everything down: RAF, listeners, GPU resources. Must leave no leaks. */
  dispose(): void {
    this.running = false;
    if (this.rafId) cancelAnimationFrame(this.rafId);
    this.rafId = 0;
    this.resizeObserver.disconnect();
    document.removeEventListener('visibilitychange', this.onVisibility);
    window.removeEventListener('pointerdown', this.onShelfPointerDown, true);
    window.removeEventListener('pointermove', this.onShelfPointerMove);
    this.controls.dispose();
    this.shelf.dispose();
    this.lyricStage?.dispose();
    this.cover.dispose();
    this.disposeParticles();
    this.bloom.dispose();
    this.composer.dispose();
    this.renderer.dispose();
  }
}
