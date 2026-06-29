import * as THREE from 'three';

/** A generic shelf entry — the engine stays agnostic of `Track`/playlist shapes. */
export interface ShelfItem {
  title: string;
  cover: string | null;
}

/** Half-height of the rendered window: only `2*WINDOW+1` cards exist at once (recycled). */
const WINDOW = 4;
const POOL = WINDOW * 2 + 1;
const SPACING_Y = 2.3; // world units between adjacent cards (vertical)
const CARD = 1.5; // card side length
const LABEL_W = 2.1;
const LABEL_H = 0.4;
const RIGHT_X = 7.5; // the list lives down the right side, clear of the cover cloud
const SHELF_Z = 3; // slightly toward the camera, in front of the cloud
const PANEL_W = 512; // label canvas resolution
const PANEL_H = 96;

/** One pooled card: a textured plane + a 3D text label, reused as the window scrolls. */
interface ShelfCard {
  mesh: THREE.Mesh;
  material: THREE.MeshBasicMaterial;
  texture?: THREE.Texture;
  labelMaterial: THREE.MeshBasicMaterial;
  labelTexture?: THREE.CanvasTexture;
  /** Item it currently shows (`-1` = free/unused). */
  itemIndex: number;
  /** Guards against a late texture load landing on a recycled card. */
  loadToken: number;
}

/**
 * Vertical 3D list of cover cards down the **right** side of the scene, for browsing content
 * without leaving immersive mode. The cover cloud stays the centrepiece — the shelf is a side
 * column in front of it. Each card carries a 3D text label (its title) underneath.
 *
 * Performance (per the Mineradio shelf notes, reimplemented from scratch): it **never builds
 * the whole list**. A fixed pool of `POOL` cards is recycled as the focus scrolls, cover and
 * label textures are created for cards entering the window and disposed when they leave, so
 * memory is bounded to the pool size regardless of list length.
 *
 * State arrives via setters (no Angular signals here); navigation eases toward an integer
 * `target` focus. `onSelect`/`onFocus` notify the view (outside the render loop).
 */
export class Shelf3D {
  private readonly group = new THREE.Group();
  private readonly cardGeometry = new THREE.PlaneGeometry(CARD, CARD);
  private readonly labelGeometry = new THREE.PlaneGeometry(LABEL_W, LABEL_H);
  private readonly loader = new THREE.TextureLoader();
  private readonly raycaster = new THREE.Raycaster();

  private cards: ShelfCard[] = [];
  private items: ShelfItem[] = [];
  private target = 0;
  private scroll = 0;
  private visible = false;
  private dirty = false;
  private lastCenter = Number.NaN;

  /** Selecting the focused card (e.g. play it). */
  onSelect?: (index: number) => void;
  /** The focused card changed (drives the overlay caption). */
  onFocus?: (index: number) => void;

  constructor(
    private readonly scene: THREE.Scene,
    private reducedMotion: boolean,
    /** Label text colour (a CSS-token hex from the engine, e.g. `--foreground`). */
    private readonly labelColor: string,
  ) {
    this.loader.setCrossOrigin('anonymous');
    this.group.position.set(RIGHT_X, 0, SHELF_Z);
  }

  /** Replace the shelf contents, keeping the focus in range. */
  setItems(items: ShelfItem[]): void {
    this.items = items;
    this.target = Math.min(Math.max(this.target, 0), Math.max(0, items.length - 1));
    // Free every card so covers/labels reload — cards are keyed by index, and a mutation
    // (reorder / remove) can change the item at a stable index.
    for (const card of this.cards) this.freeCard(card);
    this.dirty = true;
  }

  /** Move the focus to an absolute index (clamped), notifying the view. */
  setFocus(index: number, emit = true): void {
    const i = Math.min(Math.max(index, 0), Math.max(0, this.items.length - 1));
    if (i === this.target) return;
    this.target = i;
    if (emit) this.onFocus?.(i);
  }

  next(): void {
    this.setFocus(this.target + 1);
  }

  prev(): void {
    this.setFocus(this.target - 1);
  }

  get focus(): number {
    return this.target;
  }

  /** Show/hide the shelf. Hiding fully disposes the pool (textures + meshes). */
  setVisible(visible: boolean): void {
    if (visible === this.visible) return;
    this.visible = visible;
    if (visible) {
      this.buildPool();
      this.scene.add(this.group);
      this.scroll = this.target; // snap open, no slide-in from 0
      this.dirty = true;
      this.onFocus?.(this.target);
    } else {
      this.scene.remove(this.group);
      this.disposePool();
    }
  }

  setReducedMotion(reduced: boolean): void {
    this.reducedMotion = reduced;
  }

  /** Per-frame: ease the scroll, recycle cards, lay them out. `dt` in seconds. */
  update(dt: number): void {
    if (!this.visible) return;
    if (this.reducedMotion) this.scroll = this.target;
    else this.scroll += (this.target - this.scroll) * Math.min(1, dt * 8);

    this.recycleIfNeeded();
    this.layout();
  }

  /**
   * Raycast a pointer (normalised device coords) against the visible cards.
   * Returns the hit card's item index, or `-1`.
   */
  raycast(ndcX: number, ndcY: number, camera: THREE.Camera): number {
    if (!this.visible) return -1;
    this.raycaster.setFromCamera(new THREE.Vector2(ndcX, ndcY), camera);
    const candidates = this.cards.filter((c) => c.itemIndex >= 0 && c.mesh.visible).map((c) => c.mesh);
    const hits = this.raycaster.intersectObjects(candidates, false);
    return hits.length ? (hits[0].object.userData['itemIndex'] as number) : -1;
  }

  dispose(): void {
    this.disposePool();
    this.scene.remove(this.group);
    this.cardGeometry.dispose();
    this.labelGeometry.dispose();
  }

  /** Create the fixed card pool (once per show), each with a label child. */
  private buildPool(): void {
    for (let i = 0; i < POOL; i++) {
      const material = new THREE.MeshBasicMaterial({ color: 0x141414, transparent: true, opacity: 1 });
      const mesh = new THREE.Mesh(this.cardGeometry, material);
      mesh.visible = false;

      const labelMaterial = new THREE.MeshBasicMaterial({ transparent: true, opacity: 1, depthWrite: false });
      const labelMesh = new THREE.Mesh(this.labelGeometry, labelMaterial);
      labelMesh.position.set(0, -(CARD / 2 + LABEL_H / 2 + 0.12), 0.01); // just below the card
      mesh.add(labelMesh); // follows the card's transform automatically

      this.group.add(mesh);
      this.cards.push({ mesh, material, labelMaterial, itemIndex: -1, loadToken: 0 });
    }
    this.lastCenter = Number.NaN;
  }

  private disposePool(): void {
    for (const card of this.cards) {
      card.texture?.dispose();
      card.labelTexture?.dispose();
      card.material.dispose();
      card.labelMaterial.dispose();
      this.group.remove(card.mesh);
    }
    this.cards = [];
  }

  /**
   * Assign pool cards to the item indices in the current window, freeing those that scrolled
   * out and loading textures only for newcomers. Runs only when the centre index or the item
   * list changed — so a one-step scroll triggers at most one texture load.
   */
  private recycleIfNeeded(): void {
    const center = Math.round(this.scroll);
    if (center === this.lastCenter && !this.dirty) return;
    this.lastCenter = center;
    this.dirty = false;

    const needed = new Set<number>();
    for (let o = -WINDOW; o <= WINDOW; o++) {
      const idx = center + o;
      if (idx >= 0 && idx < this.items.length) needed.add(idx);
    }

    const assigned = new Set<number>();
    for (const card of this.cards) {
      if (card.itemIndex >= 0 && !needed.has(card.itemIndex)) this.freeCard(card);
      if (card.itemIndex >= 0) assigned.add(card.itemIndex);
    }

    for (const idx of needed) {
      if (assigned.has(idx)) continue;
      const free = this.cards.find((c) => c.itemIndex < 0);
      if (!free) break;
      this.loadCard(free, idx);
      assigned.add(idx);
    }
  }

  private freeCard(card: ShelfCard): void {
    card.loadToken++;
    card.texture?.dispose();
    card.texture = undefined;
    card.labelTexture?.dispose();
    card.labelTexture = undefined;
    card.material.map = null;
    card.labelMaterial.map = null;
    card.itemIndex = -1;
    card.mesh.visible = false;
  }

  /** Point a free card at item `idx`, lazy-loading its cover and rendering its label. */
  private loadCard(card: ShelfCard, idx: number): void {
    card.itemIndex = idx;
    card.mesh.userData['itemIndex'] = idx;
    const item = this.items[idx];

    // Label (rendered immediately from the title).
    card.labelTexture?.dispose();
    card.labelTexture = this.makeLabelTexture(item?.title ?? '');
    card.labelMaterial.map = card.labelTexture;
    card.labelMaterial.needsUpdate = true;

    // Cover (lazy).
    card.texture?.dispose();
    card.texture = undefined;
    card.material.map = null;
    card.material.color.set(0x141414); // placeholder until the texture arrives

    if (!item?.cover) {
      card.material.needsUpdate = true;
      return;
    }
    const token = ++card.loadToken;
    this.loader.load(
      item.cover,
      (tex) => {
        if (token !== card.loadToken) {
          tex.dispose(); // a newer item already claimed this card
          return;
        }
        tex.colorSpace = THREE.SRGBColorSpace;
        card.texture = tex;
        card.material.map = tex;
        card.material.color.set(0xffffff);
        card.material.needsUpdate = true;
      },
      undefined,
      () => {
        /* load failed — keep the placeholder colour */
      },
    );
  }

  /** Render a title onto a transparent canvas texture, truncating with an ellipsis. */
  private makeLabelTexture(title: string): THREE.CanvasTexture {
    const canvas = document.createElement('canvas');
    canvas.width = PANEL_W;
    canvas.height = PANEL_H;
    const ctx = canvas.getContext('2d')!;
    ctx.clearRect(0, 0, PANEL_W, PANEL_H);
    ctx.font = '600 40px Inter, system-ui, sans-serif';
    ctx.fillStyle = this.labelColor;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    let text = title;
    const maxW = PANEL_W - 28;
    if (ctx.measureText(text).width > maxW) {
      while (text.length > 1 && ctx.measureText(text + '…').width > maxW) text = text.slice(0, -1);
      text += '…';
    }
    ctx.fillText(text, PANEL_W / 2, PANEL_H / 2);

    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    return tex;
  }

  /** Position/scale/fade every card from its continuous vertical offset to the focus. */
  private layout(): void {
    for (const card of this.cards) {
      if (card.itemIndex < 0) {
        card.mesh.visible = false;
        continue;
      }
      const o = card.itemIndex - this.scroll; // continuous offset from centre
      const dist = Math.abs(o);
      if (dist > WINDOW + 0.5) {
        card.mesh.visible = false;
        continue;
      }
      card.mesh.visible = true;
      const lift = Math.max(0, 1 - dist); // 1 at centre, 0 by one step away
      // Focused card pops toward the camera and shifts left (toward the cloud); others recede.
      card.mesh.position.set(-lift * 0.8, -o * SPACING_Y, lift * 1.0 - Math.min(dist, 3) * 0.4);
      const scale = 1 - Math.min(dist, 3) * 0.1 + lift * 0.12;
      card.mesh.scale.setScalar(scale);
      const opacity = Math.min(1, Math.max(0, 1 - (dist - 2) / 2.2));
      card.material.opacity = opacity;
      card.labelMaterial.opacity = opacity;
    }
  }
}
