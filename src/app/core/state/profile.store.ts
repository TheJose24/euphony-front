import { DestroyRef, Injectable, computed, effect, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { UserProfile } from '@core/models/user.model';
import { UserProfileService } from '@core/api/user-profile.service';
import { toUserProfile } from '@core/api/user-profile.mapper';
import { UserProfileRequestDTO } from '@core/api/dto/user-profile.dto';
import { ApiError } from '@core/api/api-error';
import { AVATAR } from '@core/data/tracks.data';
import { AuthStore } from '@core/state/auth.store';
import { ToastService } from '@shared/ui/toast/toast.service';

/** Editable subset of a profile, surfaced to the profile form. */
export type ProfileEdits = Pick<UserProfile, 'birthDate' | 'country' | 'city' | 'phone' | 'imgProfile'>;

/**
 * The signed-in user's profile. Loads on sign-in and clears on sign-out (like the other
 * per-user stores), and powers the avatar shown in the shell. A `404` means the profile
 * hasn't been created yet: we synthesise an empty one from the session so the form can
 * still be filled and saved (the PUT upserts it).
 */
@Injectable({ providedIn: 'root' })
export class ProfileStore {
  private readonly api = inject(UserProfileService);
  private readonly auth = inject(AuthStore);
  private readonly toast = inject(ToastService);
  private readonly destroyRef = inject(DestroyRef);

  private readonly _profile = signal<UserProfile | null>(null);
  private readonly _loading = signal(true);
  private readonly _saving = signal(false);
  private readonly _error = signal<string | null>(null);

  readonly profile = this._profile.asReadonly();
  readonly loading = this._loading.asReadonly();
  readonly saving = this._saving.asReadonly();
  readonly error = this._error.asReadonly();
  /** Avatar URL for the shell; falls back to the placeholder when there's no profile yet. */
  readonly avatar = computed(() => this._profile()?.avatar ?? AVATAR);

  constructor() {
    // React to auth: load the profile on sign-in, drop it on sign-out.
    effect(() => (this.auth.userId() ? this.load() : this.clear()));
  }

  private clear(): void {
    this._profile.set(null);
    this._loading.set(false);
    this._error.set(null);
  }

  /** An empty profile seeded from the session, used when none exists server-side yet. */
  private emptyProfile(): UserProfile {
    return {
      idProfile: null,
      userId: this.auth.userId(),
      username: this.auth.user(),
      email: '',
      firstName: '',
      lastName: '',
      fullName: this.auth.user(),
      birthDate: null,
      phone: null,
      country: null,
      city: null,
      imgProfile: null,
      avatar: AVATAR,
    };
  }

  load(): void {
    const userId = this.auth.userId();
    if (!userId) return;
    this._loading.set(true);
    this._error.set(null);
    this.api
      .getByUser(userId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (dto) => {
          this._profile.set(toUserProfile(dto));
          this._loading.set(false);
        },
        error: (err: ApiError) => {
          // No profile yet → start from a blank one instead of an error screen.
          if (err.status === 404) this._profile.set(this.emptyProfile());
          else this._error.set(err.message);
          this._loading.set(false);
        },
      });
  }

  /** Persist the editable fields; optimistic with revert + toast on error. */
  save(edits: ProfileEdits): void {
    const current = this._profile();
    const userId = this.auth.userId();
    if (!current || !userId) return;

    const body: UserProfileRequestDTO = {
      birthDate: edits.birthDate || null,
      country: edits.country || null,
      city: edits.city || null,
      phone: edits.phone || null,
      imgProfile: edits.imgProfile || null,
    };

    this._saving.set(true);
    this._profile.set({
      ...current,
      ...body,
      avatar: body.imgProfile ? current.avatar : AVATAR,
    });

    this.api
      .update(userId, body)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this._saving.set(false);
          this.toast.success('Perfil actualizado.');
          // Re-read so a server-resolved avatar URL / new idProfile come back.
          this.load();
        },
        error: () => {
          this._profile.set(current);
          this._saving.set(false);
          this.toast.error('No se pudo actualizar el perfil.');
        },
      });
  }
}
