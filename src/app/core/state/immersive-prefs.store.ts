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

const STORAGE_KEY = 'euphony.immersive';

interface ImmersivePrefs {
  enabled: boolean;
  intensity: ImmersiveIntensity;
}

const DEFAULTS: ImmersivePrefs = { enabled: true, intensity: 'full' };

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
    return { enabled: typeof p.enabled === 'boolean' ? p.enabled : DEFAULTS.enabled, intensity };
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
  private readonly _enabled = signal(restore().enabled);
  private readonly _intensity = signal<ImmersiveIntensity>(restore().intensity);

  readonly enabled = this._enabled.asReadonly();
  readonly intensity = this._intensity.asReadonly();

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

  private persist(): void {
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ enabled: this._enabled(), intensity: this._intensity() }),
      );
    } catch {
      /* storage unavailable (private mode / quota) — prefs simply won't survive a reload */
    }
  }
}
