import { ChangeDetectionStrategy, Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { forkJoin } from 'rxjs';
import { LucideAngularModule } from 'lucide-angular';
import { AppLayout } from '@layout/app-layout/app-layout';
import { TrackTable } from '@features/home/components/track-table/track-table';
import { ArtistCard } from '@features/browse/components/artist-card/artist-card';
import { AlbumCard } from '@features/browse/components/album-card/album-card';
import { LoadingState } from '@shared/ui/loading-state/loading-state';
import { ErrorState } from '@shared/ui/error-state/error-state';
import { EmptyState } from '@shared/ui/empty-state/empty-state';
import { SongsService } from '@core/api/songs.service';
import { ArtistsService } from '@core/api/artists.service';
import { AlbumsService } from '@core/api/albums.service';
import { toTrack } from '@core/api/song.mapper';
import { toArtistTile } from '@core/api/artist.mapper';
import { toAlbumTile } from '@core/api/album.mapper';
import { ApiError } from '@core/api/api-error';
import { SongResponseDTO } from '@core/api/dto/song.dto';
import { ArtistTile, AlbumTile } from '@core/models/catalog.model';
import { PlayerStore } from '@core/state/player.store';
import { FavoritesStore } from '@core/state/favorites.store';

/**
 * Dedicated search: mixed results across songs, artists and albums in one view.
 *
 * The backend only searches by exact name (single result), so this filters the full catalog
 * client-side — more capable for the current data sizes. Loads songs/artists/albums once.
 */
@Component({
  selector: 'app-search',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    AppLayout,
    TrackTable,
    ArtistCard,
    AlbumCard,
    RouterLink,
    LucideAngularModule,
    LoadingState,
    ErrorState,
    EmptyState,
  ],
  templateUrl: './search.html',
})
export class Search {
  private readonly songsSvc = inject(SongsService);
  private readonly artistsSvc = inject(ArtistsService);
  private readonly albumsSvc = inject(AlbumsService);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  protected readonly player = inject(PlayerStore);
  protected readonly favStore = inject(FavoritesStore);

  protected readonly query = signal('');
  private readonly songsRaw = signal<SongResponseDTO[]>([]);
  private readonly artistsAll = signal<ArtistTile[]>([]);
  private readonly albumsAll = signal<AlbumTile[]>([]);
  protected readonly loading = signal(true);
  protected readonly error = signal<string | null>(null);

  private readonly q = computed(() => this.query().trim().toLowerCase());
  protected readonly hasQuery = computed(() => this.q().length > 0);

  protected readonly songs = computed(() => {
    const q = this.q();
    if (!q) return [];
    return this.songsRaw()
      .map(toTrack)
      .filter((t) => [t.title, t.artist, t.album].some((f) => f.toLowerCase().includes(q)));
  });

  protected readonly artists = computed(() => {
    const q = this.q();
    if (!q) return [];
    return this.artistsAll().filter(
      (a) => a.name.toLowerCase().includes(q) || a.country.toLowerCase().includes(q),
    );
  });

  protected readonly albums = computed(() => {
    const q = this.q();
    if (!q) return [];
    return this.albumsAll().filter(
      (a) => a.title.toLowerCase().includes(q) || a.artist.toLowerCase().includes(q),
    );
  });

  protected readonly total = computed(
    () => this.songs().length + this.artists().length + this.albums().length,
  );

  constructor() {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.error.set(null);
    forkJoin({
      songs: this.songsSvc.getAll(),
      artists: this.artistsSvc.getAll(),
      albums: this.albumsSvc.getAll(),
    })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: ({ songs, artists, albums }) => {
          this.songsRaw.set(songs);
          this.artistsAll.set(artists.map(toArtistTile));
          this.albumsAll.set(albums.map(toAlbumTile));
          this.loading.set(false);
        },
        error: (err: ApiError) => {
          this.error.set(err.message);
          this.loading.set(false);
        },
      });
  }

  /** Play a result song, queueing the rest of the matched songs after it. */
  handleSelect(id: string): void {
    const list = this.songs();
    const index = list.findIndex((t) => t.id === id);
    if (index < 0) return;
    if (list[index].id === this.player.current().id) {
      this.player.togglePlay();
      return;
    }
    this.player.setQueue(list, index);
    this.router.navigate(['/player']);
  }

  onToggleFavorite(id: string): void {
    const track = this.songs().find((t) => t.id === id);
    if (track) this.favStore.toggle(track);
  }
}
