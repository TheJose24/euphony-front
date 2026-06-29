import * as THREE from 'three';
import { CSS3DObject, CSS3DRenderer } from 'three/examples/jsm/renderers/CSS3DRenderer.js';

/** One time-stamped lyric line (mirrors `LyricLineDTO`). */
export interface LyricLine {
  timeMs: number;
  text: string;
}

/** Half-window of rendered lines: only `2*WINDOW+1` `CSS3DObject`s exist, recycled. */
const WINDOW = 3;
const POOL = WINDOW * 2 + 1;
const LINE_SPACING = 1.5; // world units between lines
const LYRIC_X = -3.6; // a column on the LEFT, clear of the cover (centre) and shelf (right)
const LYRIC_Z = 5; // toward the camera, in front of the cloud
const BASE_SCALE = 0.02; // CSS3D maps 1px→1 world unit; scale the px text down to world size

interface LyricCard {
  object: CSS3DObject;
  el: HTMLDivElement;
  /** Line it currently shows (`-1` = free). */
  lineIndex: number;
}

/**
 * Renders synced lyrics **inside the 3D scene** via `CSS3DRenderer`: each line is a real
 * HTML `<div>` (crisp, accessible, Inter) transformed by the same camera as the WebGL pass,
 * so it gains depth/parallax when the user orbits — but stays legible (billboarded to the
 * camera) and never passes through bloom.
 *
 * A small window of lines around the active one is recycled (active ±3); the active line is
 * centred, larger and full-opacity, neighbours recede in scale/opacity/z. Motion eases toward
 * the active line; under reduced motion it snaps. State arrives via setters (no signals here).
 *
 * Reimplemented from scratch (no Mineradio code).
 */
export class LyricStage3D {
  private readonly scene = new THREE.Scene();
  private readonly renderer = new CSS3DRenderer();
  private cards: LyricCard[] = [];
  private lines: LyricLine[] = [];
  private active = -1;
  private scroll = 0;
  private dirty = false;
  private lastCenter = Number.NaN;

  /** Click on the active line → seek to its timestamp. */
  onSeek?: (line: LyricLine) => void;

  constructor(
    private readonly container: HTMLElement,
    private reducedMotion: boolean,
    private readonly fgColor: string,
    private readonly dimColor: string,
  ) {
    const dom = this.renderer.domElement;
    dom.style.position = 'absolute';
    dom.style.inset = '0';
    dom.style.pointerEvents = 'none'; // never block the camera orbit
    this.container.appendChild(dom);
    this.buildPool();
  }

  setReducedMotion(reduced: boolean): void {
    this.reducedMotion = reduced;
  }

  setSize(w: number, h: number): void {
    this.renderer.setSize(w, h);
  }

  /** Replace the lyric lines (content change → free all cards). */
  setLines(lines: LyricLine[]): void {
    this.lines = lines;
    for (const card of this.cards) this.freeCard(card);
    if (!lines.length) this.active = -1;
    this.active = Math.min(this.active, lines.length - 1);
    this.dirty = true;
  }

  setActive(index: number): void {
    this.active = index;
  }

  /** Ease toward the active line, recycle, billboard, and render. `dt` in seconds. */
  render(camera: THREE.Camera, dt: number): void {
    const target = this.active < 0 ? this.scroll : this.active;
    if (this.reducedMotion || this.active < 0) this.scroll = target;
    else this.scroll += (target - this.scroll) * Math.min(1, dt * 8);

    this.recycleIfNeeded();
    this.layout(camera);
    this.renderer.render(this.scene, camera);
  }

  dispose(): void {
    for (const card of this.cards) {
      card.el.onclick = null;
      this.scene.remove(card.object);
    }
    this.cards = [];
    this.renderer.domElement.remove();
  }

  private buildPool(): void {
    for (let i = 0; i < POOL; i++) {
      const el = document.createElement('div');
      el.style.cssText =
        'max-width:460px;white-space:normal;text-align:center;font-family:Inter,system-ui,sans-serif;' +
        'font-size:40px;line-height:1.15;text-shadow:0 2px 14px rgba(0,0,0,0.75);will-change:transform,opacity;';
      const object = new CSS3DObject(el);
      object.visible = false;
      this.scene.add(object);
      this.cards.push({ object, el, lineIndex: -1 });
    }
    this.lastCenter = Number.NaN;
  }

  private recycleIfNeeded(): void {
    const center = Math.round(this.scroll);
    if (center === this.lastCenter && !this.dirty) return;
    this.lastCenter = center;
    this.dirty = false;

    const needed = new Set<number>();
    for (let o = -WINDOW; o <= WINDOW; o++) {
      const idx = center + o;
      if (idx >= 0 && idx < this.lines.length) needed.add(idx);
    }

    const assigned = new Set<number>();
    for (const card of this.cards) {
      if (card.lineIndex >= 0 && !needed.has(card.lineIndex)) this.freeCard(card);
      if (card.lineIndex >= 0) assigned.add(card.lineIndex);
    }
    for (const idx of needed) {
      if (assigned.has(idx)) continue;
      const free = this.cards.find((c) => c.lineIndex < 0);
      if (!free) break;
      this.bindCard(free, idx);
      assigned.add(idx);
    }
  }

  private bindCard(card: LyricCard, idx: number): void {
    card.lineIndex = idx;
    const line = this.lines[idx];
    card.el.textContent = line?.text ?? '';
    card.el.onclick = () => this.onSeek?.(line);
    card.object.visible = true;
  }

  private freeCard(card: LyricCard): void {
    card.lineIndex = -1;
    card.el.textContent = '';
    card.el.onclick = null;
    card.el.style.pointerEvents = 'none';
    card.object.visible = false;
  }

  /** Position/scale/fade/billboard every bound line from its offset to the active line. */
  private layout(camera: THREE.Camera): void {
    for (const card of this.cards) {
      if (card.lineIndex < 0) continue;
      const o = card.lineIndex - this.scroll;
      const dist = Math.abs(o);
      if (dist > WINDOW + 0.5) {
        card.object.visible = false;
        continue;
      }
      card.object.visible = true;
      const isActive = dist < 0.5;
      card.object.position.set(LYRIC_X, -o * LINE_SPACING, LYRIC_Z - Math.min(dist, 3) * 0.5);
      card.object.quaternion.copy(camera.quaternion); // billboard: always face the camera
      const lift = Math.max(0, 1 - dist);
      card.object.scale.setScalar(BASE_SCALE * (1 - Math.min(dist, 3) * 0.08 + lift * 0.4));

      card.el.style.opacity = `${Math.min(1, Math.max(0.05, 1 - dist * 0.3))}`;
      card.el.style.color = isActive ? this.fgColor : this.dimColor;
      card.el.style.fontWeight = isActive ? '700' : '500';
      card.el.style.pointerEvents = isActive ? 'auto' : 'none'; // only the active line seeks
      card.el.style.cursor = isActive ? 'pointer' : 'default';
    }
  }
}
