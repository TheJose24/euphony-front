import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { catchError, forkJoin, map, of, switchMap } from 'rxjs';
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

/** Album detail: album header + its songs, fetched by route id. */
@Component({
  selector: 'app-album-detail',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [AppLayout, TrackTable, LucideAngularModule],
  templateUrl: './album-detail.html',
})
export class AlbumDetail {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly albumsApi = inject(AlbumsService);
  private readonly songsApi = inject(SongsService);
  protected readonly player = inject(PlayerStore);

  protected readonly album = signal<AlbumResponseDTO | null>(null);
  protected readonly tracks = signal<Track[]>([]);
  protected readonly loading = signal(true);
  protected readonly error = signal<string | null>(null);

  protected readonly coverUrl = computed(() => mediaUrl(this.album()?.portada));
  protected readonly year = computed(() => this.album()?.fechaLanzamiento?.slice(0, 4) ?? null);

  constructor() {
    this.route.paramMap
      .pipe(
        switchMap((params) => {
          const id = Number(params.get('id'));
          this.loading.set(true);
          this.error.set(null);
          if (!Number.isInteger(id) || id <= 0) {
            return of({ error: 'Álbum no válido' });
          }
          return forkJoin({
            album: this.albumsApi.getById(id),
            songs: this.songsApi.getByAlbum(id),
          }).pipe(
            map((res) => ({ album: res.album, tracks: res.songs.map(toTrack) })),
            catchError((err: ApiError) => of({ error: err.message })),
          );
        }),
        takeUntilDestroyed(),
      )
      .subscribe((result) => {
        this.loading.set(false);
        if ('error' in result) {
          this.error.set(result.error);
          this.album.set(null);
          this.tracks.set([]);
        } else {
          this.album.set(result.album);
          this.tracks.set(result.tracks);
        }
      });
  }

  /** Play the album from its first track. */
  playAll(): void {
    const first = this.tracks()[0];
    if (!first) return;
    this.player.setTrack(first);
    this.router.navigate(['/player']);
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
