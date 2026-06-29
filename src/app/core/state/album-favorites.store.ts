import { DestroyRef, Injectable, computed, effect, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AlbumTile } from '@core/models/catalog.model';
import { FavoritesService } from '@core/api/favorites.service';
import { toAlbumTile } from '@core/api/album.mapper';
import { ApiError } from '@core/api/api-error';
import { AuthStore } from '@core/state/auth.store';
import { ToastService } from '@shared/ui/toast/toast.service';

/**
 * Single source of truth for the user's favorite **albums** (the song-likes sibling of
 * `FavoritesStore`). The album cards, the album-detail header and the right-panel
 * "Favorite Album" list all read `ids()` / `albums()` from here, so favoriting an album
 * anywhere updates everywhere. Mutations are optimistic and revert (with a toast) on error.
 */
@Injectable({ providedIn: 'root' })
export class AlbumFavoritesStore {
  private readonly api = inject(FavoritesService);
  private readonly auth = inject(AuthStore);
  private readonly toast = inject(ToastService);
  private readonly destroyRef = inject(DestroyRef);

  private readonly _albums = signal<AlbumTile[]>([]);
  private readonly _loading = signal(true);
  private readonly _error = signal<string | null>(null);

  readonly albums = this._albums.asReadonly();
  readonly loading = this._loading.asReadonly();
  readonly error = this._error.asReadonly();
  /** Favorite album ids, for driving the filled hearts. */
  readonly ids = computed(() => new Set(this._albums().map((a) => a.id)));

  constructor() {
    // React to auth: load the user's favorite albums on sign-in, clear them on sign-out.
    effect(() => (this.auth.userId() ? this.load() : this.clear()));
  }

  /** Reset to the signed-out state (no favorites, not loading). */
  private clear(): void {
    this._albums.set([]);
    this._loading.set(false);
    this._error.set(null);
  }

  load(): void {
    const userId = this.auth.userId();
    if (!userId) return;
    this._loading.set(true);
    this._error.set(null);
    this.api
      .getFavoriteAlbums(userId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (list) => {
          this._albums.set(list.map(toAlbumTile));
          this._loading.set(false);
        },
        error: (err: ApiError) => {
          this._error.set(err.message);
          this._loading.set(false);
        },
      });
  }

  isFavorite(id: number): boolean {
    return this._albums().some((a) => a.id === id);
  }

  /** Favorite/unfavorite an album; optimistic with revert + toast on error. */
  toggle(album: AlbumTile): void {
    const userId = this.auth.userId();
    const prev = this._albums();
    const isFav = prev.some((a) => a.id === album.id);

    if (isFav) {
      this._albums.set(prev.filter((a) => a.id !== album.id));
      this.api
        .unfavoriteAlbum(userId, album.id)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          error: () => {
            this._albums.set(prev);
            this.toast.error('No se pudo quitar el álbum de favoritos.');
          },
        });
    } else {
      this._albums.set([...prev, album]);
      this.api
        .favoriteAlbum(userId, album.id)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          error: () => {
            this._albums.set(prev);
            this.toast.error('No se pudo añadir el álbum a favoritos.');
          },
        });
    }
  }
}
