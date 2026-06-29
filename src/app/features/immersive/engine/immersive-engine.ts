import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';
import { Track } from '@core/models/track.model';
import { ImmersiveIntensity } from '@core/state/immersive-prefs.store';
import { AudioFrame, AudioReactive } from './audio-reactive';
import { CoverParticles } from './cover-particles';

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

  private readonly resizeObserver: ResizeObserver;
  private readonly onVisibility = () => this.syncRaf();

  constructor(options: ImmersiveEngineOptions) {
    this.canvas = options.canvas;
    this.intensity = options.intensity;

    this.renderer = new THREE.WebGLRenderer({ canvas: this.canvas, antialias: true });
    this.renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
    this.renderer.setClearColor(0x000000, 1); // the black background mandated by the design

    this.camera = new THREE.PerspectiveCamera(60, 1, 0.1, 100);
    this.camera.position.set(0, 0, 14);

    this.buildParticles();
    // Accent extracted from the cover tints the backdrop haze (kept turquoise-leaning).
    this.cover = new CoverParticles(this.scene, this.primaryColor, (accent) => this.applyAccent(accent));

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
    const inner = 11;
    const outer = 24;
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

      // Gentle cinematic camera drift (disabled under reduced motion).
      if (!this.reducedMotion) {
        this.camera.position.x = Math.sin(elapsed * 0.1) * drift * 8;
        this.camera.position.y = Math.cos(elapsed * 0.07) * drift * 5;
        this.camera.lookAt(0, 0, 0);
      }
    }

    // The cover cloud is the centrepiece — it breathes/pulses even past the ambient field.
    this.cover.update({ frame, elapsed, reactAmp: this.reactAmp, reducedMotion: this.reducedMotion });

    // Bloom swells a touch on beats, with a low ceiling (serene, not a flash).
    this.bloom.strength = this.bloomStrength * (1 + frame.beat * 0.4 * this.reactAmp);

    this.composer.render();
  }

  private resize(): void {
    const w = this.canvas.clientWidth || window.innerWidth;
    const h = this.canvas.clientHeight || window.innerHeight;
    this.renderer.setSize(w, h, false);
    this.composer.setSize(w, h);
    this.bloom.setSize(w, h);
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
    this.cover.dispose();
    this.disposeParticles();
    this.bloom.dispose();
    this.composer.dispose();
    this.renderer.dispose();
  }
}
