import { Injectable, computed, signal } from '@angular/core';

/**
 * Visual intensity of the immersive mode:
 * - `off`    → the engine is never mounted (zero cost).
 * - `subtle` → calm scene: fewer particles, minimal motion and bloom.
 * - `full`   → the complete reactive experience.
 *
 * `prefers-reduced-motion` is honoured by the engine itself (the CSS cascade can't
 * stop a WebGL canvas), clamping the *effective* intensity down to `subtle`.
 */
export type ImmersiveIntensity = 'off' | 'subtle' | 'full';

/**
 * How the camera is driven:
 * - `auto`   → the engine's slow cinematic drift (default; suppressed under reduced motion).
 * - `manual` → the user orbits/zooms via OrbitControls; the drift is off.
 */
export type ImmersiveCameraMode = 'auto' | 'manual';

/** What the 3D browsing shelf shows (`off` = hidden). */
export type ImmersiveShelfSource = 'off' | 'queue' | 'playlists';

const STORAGE_KEY = 'euphony.immersive';

interface ImmersivePrefs {
  enabled: boolean;
  intensity: ImmersiveIntensity;
  cameraMode: ImmersiveCameraMode;
  /** Persisted manual framing `[posX,posY,posZ, targetX,targetY,targetZ]`, or null = default. */
  cameraState: number[] | null;
  shelfSource: ImmersiveShelfSource;
}

const DEFAULTS: ImmersivePrefs = {
  enabled: true,
  intensity: 'full',
  cameraMode: 'auto',
  cameraState: null,
  shelfSource: 'off',
};

/** Read persisted prefs, tolerating absent/corrupt storage. */
function restore(): ImmersivePrefs {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULTS };
    const p = JSON.parse(raw) as Partial<ImmersivePrefs>;
    const intensity: ImmersiveIntensity =
      p.intensity === 'off' || p.intensity === 'subtle' || p.intensity === 'full'
        ? p.intensity
        : DEFAULTS.intensity;
    const cameraMode: ImmersiveCameraMode =
      p.cameraMode === 'auto' || p.cameraMode === 'manual' ? p.cameraMode : DEFAULTS.cameraMode;
    const cameraState =
      Array.isArray(p.cameraState) && p.cameraState.length === 6 && p.cameraState.every((n) => typeof n === 'number')
        ? p.cameraState
        : null;
    const shelfSource: ImmersiveShelfSource =
      p.shelfSource === 'off' || p.shelfSource === 'queue' || p.shelfSource === 'playlists'
        ? p.shelfSource
        : DEFAULTS.shelfSource;
    return {
      enabled: typeof p.enabled === 'boolean' ? p.enabled : DEFAULTS.enabled,
      intensity,
      cameraMode,
      cameraState,
      shelfSource,
    };
  } catch {
    return { ...DEFAULTS };
  }
}

/**
 * User preferences for the immersive now-playing mode, persisted to `localStorage`
 * (there is no user-settings endpoint yet). The engine reads `intensity()` to size
 * the scene; the view reads `enabled()` to decide whether to mount the engine at all.
 */
@Injectable({ providedIn: 'root' })
export class ImmersivePrefsStore {
  private readonly _restored = restore();
  private readonly _enabled = signal(this._restored.enabled);
  private readonly _intensity = signal<ImmersiveIntensity>(this._restored.intensity);
  private readonly _cameraMode = signal<ImmersiveCameraMode>(this._restored.cameraMode);
  private readonly _cameraState = signal<number[] | null>(this._restored.cameraState);
  private readonly _shelfSource = signal<ImmersiveShelfSource>(this._restored.shelfSource);

  readonly enabled = this._enabled.asReadonly();
  readonly intensity = this._intensity.asReadonly();
  readonly cameraMode = this._cameraMode.asReadonly();
  readonly cameraState = this._cameraState.asReadonly();
  readonly shelfSource = this._shelfSource.asReadonly();

  /** The engine is only worth mounting when enabled and not set to `off`. */
  readonly active = computed(() => this._enabled() && this._intensity() !== 'off');

  setEnabled(enabled: boolean): void {
    this._enabled.set(enabled);
    this.persist();
  }

  toggleEnabled(): void {
    this.setEnabled(!this._enabled());
  }

  setIntensity(intensity: ImmersiveIntensity): void {
    this._intensity.set(intensity);
    this.persist();
  }

  setCameraMode(mode: ImmersiveCameraMode): void {
    this._cameraMode.set(mode);
    this.persist();
  }

  /** Persist the manual framing (or `null` to fall back to the default on next entry). */
  setCameraState(state: number[] | null): void {
    this._cameraState.set(state);
    this.persist();
  }

  setShelfSource(source: ImmersiveShelfSource): void {
    this._shelfSource.set(source);
    this.persist();
  }

  private persist(): void {
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          enabled: this._enabled(),
          intensity: this._intensity(),
          cameraMode: this._cameraMode(),
          cameraState: this._cameraState(),
          shelfSource: this._shelfSource(),
        }),
      );
    } catch {
      /* storage unavailable (private mode / quota) — prefs simply won't survive a reload */
    }
  }
}
