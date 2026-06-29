import { DestroyRef, Injectable, computed, effect, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FollowersService } from '@core/api/followers.service';
import { FollowersArtistResponseDTO } from '@core/api/dto/follower.dto';
import { ApiError } from '@core/api/api-error';
import { AuthStore } from '@core/state/auth.store';
import { ToastService } from '@shared/ui/toast/toast.service';

/**
 * Single source of truth for the artists the user follows. The artist-detail follow
 * button reads `isFollowing()` and calls `toggle()`; mutations are optimistic and
 * revert (with a toast) on error.
 */
@Injectable({ providedIn: 'root' })
export class FollowStore {
  private readonly api = inject(FollowersService);
  private readonly auth = inject(AuthStore);
  private readonly toast = inject(ToastService);
  private readonly destroyRef = inject(DestroyRef);

  private readonly _following = signal<FollowersArtistResponseDTO[]>([]);
  private readonly _loading = signal(true);

  readonly following = this._following.asReadonly();
  readonly loading = this._loading.asReadonly();
  /** Ids of followed artists, for driving the follow button state. */
  readonly ids = computed(() => new Set(this._following().map((f) => f.artistId)));

  constructor() {
    // React to auth: load followed artists on sign-in, clear them on sign-out.
    effect(() => (this.auth.userId() ? this.load() : this.clear()));
  }

  /** Reset to the signed-out state (no follows, not loading). */
  private clear(): void {
    this._following.set([]);
    this._loading.set(false);
  }

  load(): void {
    const userId = this.auth.userId();
    if (!userId) return;
    this._loading.set(true);
    this.api
      .getByUser(userId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (list) => {
          this._following.set(list);
          this._loading.set(false);
        },
        error: () => this._loading.set(false),
      });
  }

  isFollowing(artistId: number): boolean {
    return this._following().some((f) => f.artistId === artistId);
  }

  /** Follow/unfollow an artist; optimistic with revert + toast on error. */
  toggle(artistId: number, artistName: string): void {
    const userId = this.auth.userId();
    const prev = this._following();
    const followed = prev.some((f) => f.artistId === artistId);

    if (followed) {
      this._following.set(prev.filter((f) => f.artistId !== artistId));
      this.api
        .unfollow(userId, artistId)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          error: () => {
            this._following.set(prev);
            this.toast.error('No se pudo dejar de seguir al artista.');
          },
        });
    } else {
      const entry: FollowersArtistResponseDTO = {
        userId,
        userName: this.auth.user(),
        artistId,
        artistName,
        followDate: '',
      };
      this._following.set([...prev, entry]);
      this.api
        .follow(userId, artistId)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          error: () => {
            this._following.set(prev);
            this.toast.error('No se pudo seguir al artista.');
          },
        });
    }
  }
}
