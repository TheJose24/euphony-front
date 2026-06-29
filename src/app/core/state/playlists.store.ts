import { DestroyRef, Injectable, computed, effect, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { PlaylistsService } from '@core/api/playlists.service';
import { PlaylistResponseDTO } from '@core/api/dto/playlist.dto';
import { ApiError } from '@core/api/api-error';
import { AuthStore } from '@core/state/auth.store';
import { ToastService } from '@shared/ui/toast/toast.service';

/**
 * The current user's playlists — drives the sidebar list and the "add to playlist" picker.
 * Create/delete are surfaced with toasts; `refresh()` re-reads the list (e.g. after a song is
 * added elsewhere, so `songCount` stays current). Loaded once when the shell mounts.
 */
@Injectable({ providedIn: 'root' })
export class PlaylistsStore {
  private readonly api = inject(PlaylistsService);
  private readonly auth = inject(AuthStore);
  private readonly toast = inject(ToastService);
  private readonly destroyRef = inject(DestroyRef);

  private readonly _playlists = signal<PlaylistResponseDTO[]>([]);
  private readonly _loading = signal(true);
  private readonly _error = signal<string | null>(null);

  readonly playlists = this._playlists.asReadonly();
  readonly loading = this._loading.asReadonly();
  readonly error = this._error.asReadonly();
  readonly isEmpty = computed(() => this._playlists().length === 0);

  constructor() {
    // React to auth: load the user's playlists on sign-in, clear them on sign-out.
    effect(() => (this.auth.userId() ? this.load() : this.clear()));
  }

  /** Reset to the signed-out state (no playlists, not loading). */
  private clear(): void {
    this._playlists.set([]);
    this._loading.set(false);
    this._error.set(null);
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
        next: (list) => {
          this._playlists.set(list);
          this._loading.set(false);
        },
        error: (err: ApiError) => {
          this._error.set(err.message);
          this._loading.set(false);
        },
      });
  }

  /** Re-read the list (e.g. after a song add/remove changes `songCount`). */
  refresh(): void {
    this.load();
  }

  /** Create a playlist (private by default) and reload. */
  create(name: string, description = ''): void {
    this.api
      .create({ name, description, isPublic: false, userId: this.auth.userId() })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.toast.success('Playlist creada.');
          this.load();
        },
        error: () => this.toast.error('No se pudo crear la playlist.'),
      });
  }

  /** Delete a playlist; optimistic with revert + toast on error. */
  remove(id: number): void {
    const prev = this._playlists();
    this._playlists.set(prev.filter((p) => p.playlistId !== id));
    this.api
      .delete(id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        error: () => {
          this._playlists.set(prev);
          this.toast.error('No se pudo eliminar la playlist.');
        },
      });
  }
}
