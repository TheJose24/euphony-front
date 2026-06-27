import {
  ChangeDetectionStrategy,
  Component,
  computed,
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
import { AlbumsService } from '@core/api/albums.service';
import { SongsService } from '@core/api/songs.service';
import { toTrack } from '@core/api/song.mapper';
import { mediaUrl } from '@core/api/media';
import { ApiError } from '@core/api/api-error';
import { AlbumResponseDTO } from '@core/api/dto/album.dto';
import { Track } from '@core/models/track.model';
import { PlayerStore } from '@core/state/player.store';
import { AlbumFavoritesStore } from '@core/state/album-favorites.store';
import { toAlbumTile } from '@core/api/album.mapper';
import { LoadingState } from '@shared/ui/loading-state/loading-state';
import { EmptyState } from '@shared/ui/empty-state/empty-state';
import { ErrorState } from '@shared/ui/error-state/error-state';

/** Album detail: album header + its songs, fetched by route id. */
@Component({
  selector: 'app-album-detail',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [AppLayout, TrackTable, LucideAngularModule, LoadingState, EmptyState, ErrorState],
  templateUrl: './album-detail.html',
})
export class AlbumDetail {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly albumsApi = inject(AlbumsService);
  private readonly songsApi = inject(SongsService);
  private readonly destroyRef = inject(DestroyRef);
  protected readonly player = inject(PlayerStore);
  protected readonly albumFav = inject(AlbumFavoritesStore);

  protected readonly album = signal<AlbumResponseDTO | null>(null);
  protected readonly tracks = signal<Track[]>([]);
  protected readonly loading = signal(true);
  protected readonly error = signal<string | null>(null);

  protected readonly coverUrl = computed(() => mediaUrl(this.album()?.portada));
  protected readonly year = computed(() => this.album()?.fechaLanzamiento?.slice(0, 4) ?? null);

  constructor() {
    this.route.paramMap.pipe(takeUntilDestroyed()).subscribe((params) => {
      const id = Number(params.get('id'));
      if (!Number.isInteger(id) || id <= 0) {
        this.loading.set(false);
        this.error.set('Álbum no válido');
        this.album.set(null);
        this.tracks.set([]);
        return;
      }
      this.load(id);
    });
  }

  /** Fetch the album and its songs by id. Reused by the error-state retry button. */
  load(id: number): void {
    this.loading.set(true);
    this.error.set(null);
    forkJoin({ album: this.albumsApi.getById(id), songs: this.songsApi.getByAlbum(id) })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res) => {
          this.album.set(res.album);
          this.tracks.set(res.songs.map(toTrack));
          this.loading.set(false);
        },
        error: (err: ApiError) => {
          this.error.set(err.message);
          this.album.set(null);
          this.tracks.set([]);
          this.loading.set(false);
        },
      });
  }

  retry(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    if (Number.isInteger(id) && id > 0) this.load(id);
  }

  /** Favorite/unfavorite the current album (shared store keeps the right-panel in sync). */
  toggleFavorite(): void {
    const a = this.album();
    if (a) this.albumFav.toggle(toAlbumTile(a));
  }

  /** Play the whole album as the queue, starting at the first track. */
  playAll(): void {
    if (this.tracks().length === 0) return;
    this.player.setQueue(this.tracks(), 0);
    this.router.navigate(['/player']);
  }

  /** Play the clicked track, queueing the rest of the album after it. */
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
}
