import { DestroyRef, Injectable, computed, effect, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Track } from '@core/models/track.model';
import { FavoritesService } from '@core/api/favorites.service';
import { toTrack } from '@core/api/song.mapper';
import { ApiError } from '@core/api/api-error';
import { AuthStore } from '@core/state/auth.store';
import { ToastService } from '@shared/ui/toast/toast.service';

/**
 * Single source of truth for the user's liked songs, backed by the favorites API.
 *
 * Replaces the per-page like state that used to live in `Home` and the local set
 * in `PlayerStore`: now the player bar, every track table and the "Favorites" tab
 * all read `ids()` / `tracks()` from here, so a like in one place updates everywhere
 * and persists. Mutations are optimistic and revert (with a toast) on error.
 */
@Injectable({ providedIn: 'root' })
export class FavoritesStore {
  private readonly api = inject(FavoritesService);
  private readonly auth = inject(AuthStore);
  private readonly toast = inject(ToastService);
  private readonly destroyRef = inject(DestroyRef);

  private readonly _tracks = signal<Track[]>([]);
  private readonly _loading = signal(true);
  private readonly _error = signal<string | null>(null);

  /** The user's liked songs (full track objects, for the Favorites tab). */
  readonly tracks = this._tracks.asReadonly();
  readonly loading = this._loading.asReadonly();
  readonly error = this._error.asReadonly();
  /** Liked song ids, for driving the filled hearts across the app. */
  readonly ids = computed(() => new Set(this._tracks().map((t) => t.id)));

  constructor() {
    // React to auth: load the user's likes on sign-in, clear them on sign-out.
    effect(() => (this.auth.userId() ? this.load() : this.clear()));
  }

  /** Reset to the signed-out state (no likes, not loading). */
  private clear(): void {
    this._tracks.set([]);
    this._loading.set(false);
    this._error.set(null);
  }

  load(): void {
    const userId = this.auth.userId();
    if (!userId) return;
    this._loading.set(true);
    this._error.set(null);
    this.api
      .getLikedSongs(userId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (songs) => {
          this._tracks.set(songs.map(toTrack));
          this._loading.set(false);
        },
        error: (err: ApiError) => {
          this._error.set(err.message);
          this._loading.set(false);
        },
      });
  }

  isLiked(id: string): boolean {
    return this._tracks().some((t) => t.id === id);
  }

  /** Like/unlike a song against the backend; optimistic with revert + toast on error. */
  toggle(track: Track): void {
    const songId = Number(track.id);
    if (!Number.isInteger(songId) || songId <= 0) return; // mock/default track, no backend id

    const userId = this.auth.userId();
    const prev = this._tracks();
    const liked = prev.some((t) => t.id === track.id);

    if (liked) {
      this._tracks.set(prev.filter((t) => t.id !== track.id));
      this.api
        .unlikeSong(userId, songId)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          error: () => {
            this._tracks.set(prev);
            this.toast.error('No se pudo quitar de tus favoritos.');
          },
        });
    } else {
      this._tracks.set([...prev, track]);
      this.api
        .likeSong(userId, songId)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          error: () => {
            this._tracks.set(prev);
            this.toast.error('No se pudo añadir a tus favoritos.');
          },
        });
    }
  }
}
