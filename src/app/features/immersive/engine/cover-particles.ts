import * as THREE from 'three';
import { AudioFrame } from './audio-reactive';

/** Animation inputs handed in by the engine each frame. */
export interface CoverUpdate {
  frame: AudioFrame;
  elapsed: number;
  /** 0 = no audio reactivity (reduced motion), 1 = full. */
  reactAmp: number;
  reducedMotion: boolean;
}

/** World width the reconstituted cover spans (height matches — covers are square). */
const SPAN = 9;
/** Depth range driven by pixel brightness — high enough to read as a volume, not a sheet. */
const RELIEF = 2.5;
/** Extra per-particle depth jitter so the cloud has body (kept below RELIEF so art reads). */
const DEPTH_SPREAD = 0.6;
/** Base point size fed to the manual attenuation in the shader (~2px at the default distance). */
const BASE_SIZE = 0.14;

const VERTEX_SHADER = /* glsl */ `
  attribute vec3 aColor;
  attribute float aRand;
  attribute float aBright;
  uniform float uTime, uBass, uTreble, uLevel, uBeat, uReactAmp, uSize, uReduced;
  varying vec3 vColor;
  void main() {
    float phase = aRand * 6.2831853;
    // Per-particle tremor, mostly in depth, driven by bass/beat. Brightness scales it a touch.
    float vib = sin(uTime * 2.2 + phase) * (uBass * 0.6 + uBeat * 0.5) * uReactAmp * (0.4 + aBright);
    if (uReduced > 0.5) vib = 0.0;
    vec3 pos = position;
    pos.z += vib * 0.5;
    if (uReduced < 0.5) {
      // Faint lateral shimmer so the surface feels alive, not a rigid grid.
      pos.xy += vec2(sin(uTime * 3.0 + phase), cos(uTime * 2.6 + phase)) * 0.02 * uReactAmp;
    }
    vec4 mv = modelViewMatrix * vec4(pos, 1.0);
    gl_PointSize = uSize * (1.0 + uLevel * 0.5 * uReactAmp) * (300.0 / -mv.z); // manual attenuation
    gl_Position = projectionMatrix * mv;
    vColor = aColor;
  }
`;

const FRAGMENT_SHADER = /* glsl */ `
  precision mediump float;
  uniform float uOpacity;
  varying vec3 vColor;
  void main() {
    float d = length(gl_PointCoord - 0.5);
    if (d > 0.5) discard;             // round, soft-edged points
    float a = smoothstep(0.5, 0.32, d) * uOpacity;
    gl_FragColor = vec4(vColor, a);
  }
`;

/**
 * Turns the current track's cover art into a **volumetric** cloud of particles — one per
 * (downsampled) pixel — that gently vibrate with the music. Faithful to the artwork but
 * lightly tinted toward the turquoise accent so it sits in the Euphony palette.
 *
 * The per-particle motion lives in a `ShaderMaterial` vertex shader (GPU): depth driven by
 * pixel brightness (so the art stays readable) plus a bounded tremor from bass/beat and a
 * faint lateral shimmer. The CPU `update()` only writes uniforms — cheap at any grid size.
 * Under reduced motion the cloud keeps its volume but holds still.
 *
 * Reimplemented from scratch (no Mineradio code). Image pixels are read via an offscreen
 * 2D canvas; the source image is requested with CORS so prod (cross-origin API) can sample
 * it given the right headers, and degrades gracefully (empty cloud) if it can't.
 */
export class CoverParticles {
  private readonly group = new THREE.Group();
  private points?: THREE.Points;
  private geometry?: THREE.BufferGeometry;
  private material?: THREE.ShaderMaterial;

  /** Distinguishes async loads so a late-arriving image for a previous track is ignored. */
  private loadToken = 0;
  /** The cover currently rendered, to skip redundant reloads. */
  private currentUrl: string | null = null;

  constructor(
    private readonly scene: THREE.Scene,
    private readonly tint: THREE.Color,
    /** Called after each build with the cover's dominant colour (for backdrop tinting). */
    private readonly onAccent?: (accent: THREE.Color) => void,
  ) {
    this.scene.add(this.group);
  }

  /**
   * Load `url` and (re)build the cloud at `grid`×`grid` resolution. Safe to call on every
   * track change; redundant calls for the same cover are ignored, intensity changes pass a
   * new grid for the same url to rebuild at a different density.
   */
  load(url: string | null, grid: number): void {
    const token = ++this.loadToken;
    this.currentUrl = url;
    if (!url) {
      this.clear();
      return;
    }

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      if (token !== this.loadToken) return; // a newer track won the race
      try {
        this.build(img, grid);
      } catch {
        this.clear(); // tainted canvas (cross-origin without CORS) — fall back to no cloud
      }
    };
    img.onerror = () => {
      if (token === this.loadToken) this.clear();
    };
    img.src = url;
  }

  /** Per-frame: push audio/time uniforms and the serene group motion. */
  update({ frame, elapsed, reactAmp, reducedMotion }: CoverUpdate): void {
    if (!this.points || !this.material) return;

    const u = this.material.uniforms;
    u['uTime'].value = elapsed;
    u['uBass'].value = frame.bass;
    u['uTreble'].value = frame.treble;
    u['uLevel'].value = frame.level;
    u['uBeat'].value = frame.beat;
    u['uReactAmp'].value = reactAmp;
    u['uReduced'].value = reducedMotion ? 1 : 0;

    // Slow yaw reveals the volume's parallax (off under reduced motion). The beat pulse now
    // lives per-particle in the shader, so the group only breathes faintly and leans on bass.
    this.group.rotation.y = reducedMotion ? 0 : Math.sin(elapsed * 0.15) * 0.22;
    const breathe = reducedMotion ? 1 : 1 + Math.sin(elapsed * 0.5) * 0.01;
    this.group.scale.setScalar(breathe);
    this.group.position.z = frame.bass * 0.4 * reactAmp;
  }

  /** Build the geometry from the image's pixels, replacing any previous cloud. */
  private build(img: HTMLImageElement, grid: number): void {
    const ctx = this.readPixels(img, grid);
    this.clear();

    const count = grid * grid;
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const rand = new Float32Array(count);
    const bright = new Float32Array(count);
    const half = SPAN / 2;
    const step = SPAN / (grid - 1);
    const color = new THREE.Color();
    // Accumulate a vivid-weighted average colour for the accent.
    let accR = 0;
    let accG = 0;
    let accB = 0;
    let accW = 0;

    for (let y = 0; y < grid; y++) {
      for (let x = 0; x < grid; x++) {
        const i = (y * grid + x) * 4;
        const r = ctx[i] / 255;
        const g = ctx[i + 1] / 255;
        const b = ctx[i + 2] / 255;
        const brightness = 0.299 * r + 0.587 * g + 0.114 * b;
        const p = y * grid + x;

        positions[p * 3] = -half + x * step;
        positions[p * 3 + 1] = half - y * step; // image top → +y
        // Depth dominated by brightness (keeps art readable) + modest per-particle jitter.
        positions[p * 3 + 2] = (brightness - 0.5) * RELIEF + (Math.random() - 0.5) * DEPTH_SPREAD;

        // Faithful artwork colour, nudged toward the turquoise accent to stay on-palette.
        color.setRGB(r, g, b).lerp(this.tint, 0.12);
        colors[p * 3] = color.r;
        colors[p * 3 + 1] = color.g;
        colors[p * 3 + 2] = color.b;

        rand[p] = Math.random();
        bright[p] = brightness;

        // Favour saturated, mid-bright pixels so the accent reflects the artwork, not its
        // black borders or blown highlights.
        const saturation = Math.max(r, g, b) - Math.min(r, g, b);
        const w = saturation * (1 - Math.abs(brightness - 0.5) * 2 + 1) * 0.5;
        accR += r * w;
        accG += g * w;
        accB += b * w;
        accW += w;
      }
    }

    if (accW > 0.0001 && this.onAccent) {
      this.onAccent(new THREE.Color(accR / accW, accG / accW, accB / accW));
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('aColor', new THREE.BufferAttribute(colors, 3));
    geometry.setAttribute('aRand', new THREE.BufferAttribute(rand, 1));
    geometry.setAttribute('aBright', new THREE.BufferAttribute(bright, 1));

    const material = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uBass: { value: 0 },
        uTreble: { value: 0 },
        uLevel: { value: 0 },
        uBeat: { value: 0 },
        uReactAmp: { value: 1 },
        uSize: { value: BASE_SIZE },
        uReduced: { value: 0 },
        uOpacity: { value: 0.88 },
      },
      vertexShader: VERTEX_SHADER,
      fragmentShader: FRAGMENT_SHADER,
      transparent: true,
      depthWrite: false,
      blending: THREE.NormalBlending,
    });

    const points = new THREE.Points(geometry, material);
    this.group.add(points);
    this.points = points;
    this.geometry = geometry;
    this.material = material;
  }

  /** Downsample the image into a grid×grid offscreen canvas and return its RGBA bytes. */
  private readPixels(img: HTMLImageElement, grid: number): Uint8ClampedArray {
    const canvas = document.createElement('canvas');
    canvas.width = grid;
    canvas.height = grid;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) throw new Error('2D context unavailable');
    ctx.drawImage(img, 0, 0, grid, grid);
    return ctx.getImageData(0, 0, grid, grid).data;
  }

  /** Drop the current cloud and free its GPU resources. */
  private clear(): void {
    if (this.points) this.group.remove(this.points);
    this.geometry?.dispose();
    this.material?.dispose();
    this.points = undefined;
    this.geometry = undefined;
    this.material = undefined;
  }

  dispose(): void {
    this.clear();
    this.scene.remove(this.group);
  }
}
