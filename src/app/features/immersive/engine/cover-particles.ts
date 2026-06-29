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
/** How far bright pixels stand proud of dark ones, giving the cloud a subtle relief. */
const RELIEF = 0.9;

/**
 * Turns the current track's cover art into a cloud of one particle per (downsampled)
 * pixel, faithful to the artwork but lightly tinted toward the turquoise accent so it
 * sits in the Euphony palette. The whole cloud breathes and leans with the music — a
 * gentle beat pulse and a bass "lean-in", never a strobe.
 *
 * Reimplemented from scratch (no Mineradio code). Image pixels are read via an offscreen
 * 2D canvas; the source image is requested with CORS so prod (cross-origin API) can
 * sample it given the right headers, and degrades gracefully (empty cloud) if it can't.
 */
export class CoverParticles {
  private readonly group = new THREE.Group();
  private points?: THREE.Points;
  private geometry?: THREE.BufferGeometry;
  private material?: THREE.PointsMaterial;
  private baseSize = 0.05;

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

  /** Per-frame animation. All motion is bounded and eased for a calm register. */
  update({ frame, elapsed, reactAmp, reducedMotion }: CoverUpdate): void {
    if (!this.points || !this.material) return;

    // Oscillating yaw (not a full spin) keeps the artwork readable while revealing relief.
    this.group.rotation.y = reducedMotion ? 0 : Math.sin(elapsed * 0.15) * 0.22;

    // Breathing + beat swell on scale; heavy bass leans the cloud toward the camera.
    const breathe = reducedMotion ? 1 : 1 + Math.sin(elapsed * 0.5) * 0.01;
    const pulse = 1 + frame.beat * 0.06 * reactAmp;
    this.group.scale.setScalar(breathe * pulse);
    this.group.position.z = frame.bass * 0.6 * reactAmp;

    // Points grow slightly with overall loudness, with a low ceiling.
    this.material.size = this.baseSize * (1 + Math.min(0.5, frame.level * 0.6 * reactAmp));
  }

  /** Build the geometry from the image's pixels, replacing any previous cloud. */
  private build(img: HTMLImageElement, grid: number): void {
    const ctx = this.readPixels(img, grid);
    this.clear();

    const positions = new Float32Array(grid * grid * 3);
    const colors = new Float32Array(grid * grid * 3);
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
        positions[p * 3 + 2] = (brightness - 0.5) * RELIEF;

        // Faithful artwork colour, nudged toward the turquoise accent to stay on-palette.
        color.setRGB(r, g, b).lerp(this.tint, 0.12);
        colors[p * 3] = color.r;
        colors[p * 3 + 1] = color.g;
        colors[p * 3 + 2] = color.b;

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
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const material = new THREE.PointsMaterial({
      size: this.baseSize,
      sizeAttenuation: true,
      vertexColors: true,
      transparent: true,
      opacity: 0.95,
      depthWrite: false,
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
