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
import { PlaylistsService } from '@core/api/playlists.service';
import { toTrack } from '@core/api/song.mapper';
import { ApiError } from '@core/api/api-error';
import { PlaylistResponseDTO } from '@core/api/dto/playlist.dto';
import { Track } from '@core/models/track.model';
import { PlayerStore } from '@core/state/player.store';
import { FavoritesStore } from '@core/state/favorites.store';

/** Playlist detail: header + its songs, fetched by route id. */
@Component({
  selector: 'app-playlist-detail',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [AppLayout, TrackTable, LucideAngularModule, LoadingState, EmptyState, ErrorState],
  templateUrl: './playlist-detail.html',
})
export class PlaylistDetail {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly api = inject(PlaylistsService);
  private readonly destroyRef = inject(DestroyRef);
  protected readonly player = inject(PlayerStore);
  protected readonly favStore = inject(FavoritesStore);

  protected readonly playlist = signal<PlaylistResponseDTO | null>(null);
  protected readonly tracks = signal<Track[]>([]);
  protected readonly loading = signal(true);
  protected readonly error = signal<string | null>(null);

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
}
