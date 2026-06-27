import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AppLayout } from '@layout/app-layout/app-layout';
import { ArtistsService } from '@core/api/artists.service';
import { AlbumsService } from '@core/api/albums.service';
import { toArtistTile } from '@core/api/artist.mapper';
import { toAlbumTile } from '@core/api/album.mapper';
import { ApiError } from '@core/api/api-error';
import { ArtistTile, AlbumTile } from '@core/models/catalog.model';
import { ArtistCard } from './components/artist-card/artist-card';
import { AlbumCard } from './components/album-card/album-card';
import { LoadingState } from '@shared/ui/loading-state/loading-state';
import { EmptyState } from '@shared/ui/empty-state/empty-state';
import { ErrorState } from '@shared/ui/error-state/error-state';

/** Catalog page: browse artists and albums pulled from the backend. */
@Component({
  selector: 'app-browse',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [AppLayout, ArtistCard, AlbumCard, LoadingState, EmptyState, ErrorState],
  templateUrl: './browse.html',
})
export class Browse {
  private readonly artistsApi = inject(ArtistsService);
  private readonly albumsApi = inject(AlbumsService);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly query = signal('');

  protected readonly artists = signal<ArtistTile[]>([]);
  protected readonly artistsLoading = signal(true);
  protected readonly artistsError = signal<string | null>(null);

  protected readonly albums = signal<AlbumTile[]>([]);
  protected readonly albumsLoading = signal(true);
  protected readonly albumsError = signal<string | null>(null);

  /** Artists filtered live by the top-bar search query (name or country). */
  protected readonly filteredArtists = computed(() => {
    const q = this.query().trim().toLowerCase();
    const list = this.artists();
    if (!q) return list;
    return list.filter(
      (a) => a.name.toLowerCase().includes(q) || a.country.toLowerCase().includes(q),
    );
  });

  /** Albums filtered live by the top-bar search query (title or artist). */
  protected readonly filteredAlbums = computed(() => {
    const q = this.query().trim().toLowerCase();
    const list = this.albums();
    if (!q) return list;
    return list.filter(
      (a) => a.title.toLowerCase().includes(q) || a.artist.toLowerCase().includes(q),
    );
  });

  constructor() {
    this.loadArtists();
    this.loadAlbums();
  }

  loadArtists(): void {
    this.artistsLoading.set(true);
    this.artistsError.set(null);
    this.artistsApi
      .getAll()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (list) => {
          this.artists.set(list.map(toArtistTile));
          this.artistsLoading.set(false);
        },
        error: (err: ApiError) => {
          this.artistsError.set(err.message);
          this.artistsLoading.set(false);
        },
      });
  }

  loadAlbums(): void {
    this.albumsLoading.set(true);
    this.albumsError.set(null);
    this.albumsApi
      .getAll()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (list) => {
          this.albums.set(list.map(toAlbumTile));
          this.albumsLoading.set(false);
        },
        error: (err: ApiError) => {
          this.albumsError.set(err.message);
          this.albumsLoading.set(false);
        },
      });
  }
}
