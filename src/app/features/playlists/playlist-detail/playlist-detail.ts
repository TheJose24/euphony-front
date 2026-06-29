import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  inject,
  signal,
} from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { forkJoin } from 'rxjs';
import { LucideAngularModule } from 'lucide-angular';
import { AppLayout } from '@layout/app-layout/app-layout';
import { TrackTable } from '@features/home/components/track-table/track-table';
import { LoadingState } from '@shared/ui/loading-state/loading-state';
import { EmptyState } from '@shared/ui/empty-state/empty-state';
import { ErrorState } from '@shared/ui/error-state/error-state';
import { Modal } from '@shared/ui/modal/modal';
import { ToastService } from '@shared/ui/toast/toast.service';
import { PlaylistsService } from '@core/api/playlists.service';
import { toTrack } from '@core/api/song.mapper';
import { ApiError } from '@core/api/api-error';
import { PlaylistRequestDTO, PlaylistResponseDTO } from '@core/api/dto/playlist.dto';
import { Track } from '@core/models/track.model';
import { PlayerStore } from '@core/state/player.store';
import { FavoritesStore } from '@core/state/favorites.store';
import { PlaylistsStore } from '@core/state/playlists.store';

/** Playlist detail: header + its songs, fetched by route id. Supports editing the
 * playlist and removing songs from it. */
@Component({
  selector: 'app-playlist-detail',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [AppLayout, TrackTable, LucideAngularModule, LoadingState, EmptyState, ErrorState, Modal],
  templateUrl: './playlist-detail.html',
})
export class PlaylistDetail {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly api = inject(PlaylistsService);
  private readonly toast = inject(ToastService);
  private readonly playlistsStore = inject(PlaylistsStore);
  private readonly destroyRef = inject(DestroyRef);
  protected readonly player = inject(PlayerStore);
  protected readonly favStore = inject(FavoritesStore);

  protected readonly playlist = signal<PlaylistResponseDTO | null>(null);
  protected readonly tracks = signal<Track[]>([]);
  protected readonly loading = signal(true);
  protected readonly error = signal<string | null>(null);

  // Edit dialog state.
  protected readonly editing = signal(false);
  protected readonly saving = signal(false);
  protected readonly editName = signal('');
  protected readonly editDescription = signal('');
  protected readonly editPublic = signal(false);
  protected readonly editCover = signal('');

  constructor() {
    this.route.paramMap.pipe(takeUntilDestroyed()).subscribe((params) => {
      const id = Number(params.get('id'));
      if (!Number.isInteger(id) || id <= 0) {
        this.loading.set(false);
        this.error.set('Playlist no válida');
        this.playlist.set(null);
        this.tracks.set([]);
        return;
      }
      this.load(id);
    });
  }

  /** Fetch the playlist and its songs by id. Reused by the error-state retry button. */
  load(id: number): void {
    this.loading.set(true);
    this.error.set(null);
    forkJoin({ playlist: this.api.getById(id), songs: this.api.getSongs(id) })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res) => {
          this.playlist.set(res.playlist);
          this.tracks.set(res.songs.map(toTrack));
          this.loading.set(false);
        },
        error: (err: ApiError) => {
          this.error.set(err.message);
          this.playlist.set(null);
          this.tracks.set([]);
          this.loading.set(false);
        },
      });
  }

  retry(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    if (Number.isInteger(id) && id > 0) this.load(id);
  }

  /** Play the whole playlist as the queue, starting at the first track. */
  playAll(): void {
    if (this.tracks().length === 0) return;
    this.player.setQueue(this.tracks(), 0);
    this.router.navigate(['/player']);
  }

  /** Play the clicked track, queueing the rest of the playlist after it. */
  handleSelect(id: string): void {
    const index = this.tracks().findIndex((t) => t.id === id);
    if (index < 0) return;
    if (this.tracks()[index].id === this.player.current().id) {
      this.player.togglePlay();
      return;
    }
    this.player.setQueue(this.tracks(), index);
    this.router.navigate(['/player']);
  }

  onToggleFavorite(id: string): void {
    const track = this.tracks().find((t) => t.id === id);
    if (track) this.favStore.toggle(track);
  }

  /** Remove a song from the playlist; optimistic with revert + toast on error. */
  onRemoveTrack(id: string): void {
    const pl = this.playlist();
    const songId = Number(id);
    if (!pl || !Number.isInteger(songId) || songId <= 0) return;

    const prev = this.tracks();
    this.tracks.set(prev.filter((t) => t.id !== id));
    this.api
      .removeSong(pl.playlistId, songId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.toast.info('Canción quitada de la playlist.');
          this.playlistsStore.refresh(); // keep the sidebar's song count current
        },
        error: () => {
          this.tracks.set(prev);
          this.toast.error('No se pudo quitar la canción.');
        },
      });
  }

  /** Open the edit dialog seeded with the current playlist values. */
  openEdit(): void {
    const pl = this.playlist();
    if (!pl) return;
    this.editName.set(pl.name);
    this.editDescription.set(pl.description ?? '');
    this.editPublic.set(pl.isPublic);
    this.editCover.set(pl.coverImage ?? '');
    this.editing.set(true);
  }

  closeEdit(): void {
    this.editing.set(false);
  }

  /** Save the edited playlist; updates the header and the sidebar list on success. */
  saveEdit(): void {
    const pl = this.playlist();
    if (!pl || this.saving()) return;

    const name = this.editName().trim();
    if (name.length < 3) {
      this.toast.error('El nombre debe tener al menos 3 caracteres.');
      return;
    }

    const body: PlaylistRequestDTO = {
      name,
      description: this.editDescription().trim(),
      isPublic: this.editPublic(),
      coverImage: this.editCover().trim(),
      userId: pl.userId,
    };

    this.saving.set(true);
    this.api
      .update(pl.playlistId, body)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.playlist.set({ ...pl, ...body });
          this.saving.set(false);
          this.editing.set(false);
          this.toast.success('Playlist actualizada.');
          this.playlistsStore.refresh();
        },
        error: () => {
          this.saving.set(false);
          this.toast.error('No se pudo actualizar la playlist.');
        },
      });
  }
}
