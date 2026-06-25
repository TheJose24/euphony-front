import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { catchError, forkJoin, map, of, switchMap } from 'rxjs';
import { LucideAngularModule } from 'lucide-angular';
import { AppLayout } from '@layout/app-layout/app-layout';
import { TrackTable } from '@features/home/components/track-table/track-table';
import { AlbumCard } from '@features/browse/components/album-card/album-card';
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

/** Artist detail: artist header + their albums + their songs, fetched by route id. */
@Component({
  selector: 'app-artist-detail',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [AppLayout, TrackTable, AlbumCard, LucideAngularModule],
  templateUrl: './artist-detail.html',
})
export class ArtistDetail {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly artistsApi = inject(ArtistsService);
  private readonly albumsApi = inject(AlbumsService);
  private readonly songsApi = inject(SongsService);
  protected readonly player = inject(PlayerStore);

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
    this.route.paramMap
      .pipe(
        switchMap((params) => {
          const id = Number(params.get('id'));
          this.loading.set(true);
          this.error.set(null);
          if (!Number.isInteger(id) || id <= 0) {
            return of({ error: 'Artista no válido' });
          }
          return this.artistsApi.getById(id).pipe(
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
          );
        }),
        takeUntilDestroyed(),
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

  handleSelect(id: string): void {
    const track = this.tracks().find((t) => t.id === id);
    if (!track) return;
    if (track.id === this.player.current().id) {
      this.player.togglePlay();
    } else {
      this.player.setTrack(track);
      this.router.navigate(['/player']);
    }
  }
}
