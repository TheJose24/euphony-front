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
import { catchError, forkJoin, map, of, switchMap } from 'rxjs';
import { LucideAngularModule } from 'lucide-angular';
import { AppLayout } from '@layout/app-layout/app-layout';
import { TrackTable } from '@features/home/components/track-table/track-table';
import { AlbumCard } from '@features/browse/components/album-card/album-card';
import { LoadingState } from '@shared/ui/loading-state/loading-state';
import { EmptyState } from '@shared/ui/empty-state/empty-state';
import { ErrorState } from '@shared/ui/error-state/error-state';
import { ArtistsService } from '@core/api/artists.service';
import { AlbumsService } from '@core/api/albums.service';
import { SongsService } from '@core/api/songs.service';
import { toTrack } from '@core/api/song.mapper';
import { toAlbumTile } from '@core/api/album.mapper';
import { ApiError } from '@core/api/api-error';
import { ArtistResponseDTO } from '@core/api/dto/artist.dto';
import { AlbumResponseDTO } from '@core/api/dto/album.dto';
import { AlbumTile } from '@core/models/catalog.model';
import { Track } from '@core/models/track.model';
import { PlayerStore } from '@core/state/player.store';
import { FollowStore } from '@core/state/follow.store';

/** Artist detail: artist header + their albums + their songs, fetched by route id. */
@Component({
  selector: 'app-artist-detail',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    AppLayout,
    TrackTable,
    AlbumCard,
    LucideAngularModule,
    LoadingState,
    EmptyState,
    ErrorState,
  ],
  templateUrl: './artist-detail.html',
})
export class ArtistDetail {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly artistsApi = inject(ArtistsService);
  private readonly albumsApi = inject(AlbumsService);
  private readonly songsApi = inject(SongsService);
  private readonly destroyRef = inject(DestroyRef);
  protected readonly player = inject(PlayerStore);
  protected readonly follow = inject(FollowStore);

  protected readonly artist = signal<ArtistResponseDTO | null>(null);
  protected readonly albums = signal<AlbumTile[]>([]);
  protected readonly tracks = signal<Track[]>([]);
  protected readonly loading = signal(true);
  protected readonly error = signal<string | null>(null);

  protected readonly initial = computed(() =>
    (this.artist()?.name?.trim().charAt(0) || '?').toUpperCase(),
  );
  /** Social networks as `[network, handle]` pairs for the template. */
  protected readonly socials = computed(() => Object.entries(this.artist()?.socialNetworks ?? {}));

  constructor() {
    this.route.paramMap.pipe(takeUntilDestroyed()).subscribe((params) => {
      const id = Number(params.get('id'));
      if (!Number.isInteger(id) || id <= 0) {
        this.loading.set(false);
        this.error.set('Artista no válido');
        this.artist.set(null);
        this.albums.set([]);
        this.tracks.set([]);
        return;
      }
      this.load(id);
    });
  }

  /** Fetch the artist, their albums and songs by id. Reused by the retry button. */
  load(id: number): void {
    this.loading.set(true);
    this.error.set(null);
    this.artistsApi
      .getById(id)
      .pipe(
        switchMap((artist) => {
          if (!artist) return of({ error: 'El artista no fue encontrado' });
          // Albums are searched by name (no by-id endpoint); tolerate "none" as [].
          return forkJoin({
            albums: this.albumsApi
              .getByArtist(artist.name)
              .pipe(catchError(() => of([] as AlbumResponseDTO[]))),
            songs: this.songsApi.getByArtist(id),
          }).pipe(
            map((res) => ({
              artist,
              albums: res.albums.map(toAlbumTile),
              tracks: res.songs.map(toTrack),
            })),
          );
        }),
        catchError((err: ApiError) => of({ error: err.message })),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((result) => {
        this.loading.set(false);
        if ('error' in result) {
          this.error.set(result.error);
          this.artist.set(null);
          this.albums.set([]);
          this.tracks.set([]);
        } else {
          this.artist.set(result.artist);
          this.albums.set(result.albums);
          this.tracks.set(result.tracks);
        }
      });
  }

  retry(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    if (Number.isInteger(id) && id > 0) this.load(id);
  }

  /** Play the clicked track, queueing the rest of the artist's songs after it. */
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
