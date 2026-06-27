import { ChangeDetectionStrategy, Component, computed, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import { AppLayout } from '@layout/app-layout/app-layout';
import { PlayerStore } from '@core/state/player.store';
import { FavoritesStore } from '@core/state/favorites.store';
import { SongsService } from '@core/api/songs.service';
import { GenresService } from '@core/api/genres.service';
import { toTrack } from '@core/api/song.mapper';
import { SongResponseDTO } from '@core/api/dto/song.dto';
import { ApiError } from '@core/api/api-error';
import { Track } from '@core/models/track.model';
import { ArtistsService } from '@core/api/artists.service';
import { AlbumsService } from '@core/api/albums.service';
import { toArtistTile } from '@core/api/artist.mapper';
import { toAlbumTile } from '@core/api/album.mapper';
import { ArtistTile, AlbumTile } from '@core/models/catalog.model';
import { contentTabs } from '@core/data/home.data';
import { HeroBanners } from './components/hero-banners/hero-banners';
import { CategoryChips } from './components/category-chips/category-chips';
import { ContentTabs } from './components/content-tabs/content-tabs';
import { TrackTable } from './components/track-table/track-table';
import { PopularArtists } from './components/popular-artists/popular-artists';
import { RightPanel } from './components/right-panel/right-panel';
import { ArtistCard } from '@features/browse/components/artist-card/artist-card';
import { AlbumCard } from '@features/browse/components/album-card/album-card';
import { LoadingState } from '@shared/ui/loading-state/loading-state';
import { EmptyState } from '@shared/ui/empty-state/empty-state';
import { ErrorState } from '@shared/ui/error-state/error-state';

@Component({
  selector: 'app-home',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    AppLayout,
    HeroBanners,
    CategoryChips,
    ContentTabs,
    TrackTable,
    PopularArtists,
    RightPanel,
    ArtistCard,
    AlbumCard,
    LoadingState,
    EmptyState,
    ErrorState,
  ],
  templateUrl: './home.html',
})
export class Home {
  private readonly router = inject(Router);
  private readonly songs = inject(SongsService);
  private readonly genresApi = inject(GenresService);
  private readonly artistsApi = inject(ArtistsService);
  private readonly albumsApi = inject(AlbumsService);
  private readonly destroyRef = inject(DestroyRef);
  protected readonly player = inject(PlayerStore);
  protected readonly favStore = inject(FavoritesStore);

  protected readonly query = signal('');
  /** Raw songs from the API; `tracks` is the mapped UI view, `streamed` the ranked one. */
  private readonly songsRaw = signal<SongResponseDTO[]>([]);
  protected readonly tracks = computed(() => this.songsRaw().map(toTrack));
  protected readonly loading = signal(true);
  protected readonly error = signal<string | null>(null);

  /** Discovery tabs; only "Playlist" renders real data for now. */
  protected readonly tabs = contentTabs;
  protected readonly activeTab = signal(contentTabs[0]);

  /** Genre chips. "Todos" (first, default) means no genre filter. */
  protected readonly allGenres = 'Todos';
  protected readonly genres = signal<string[]>([]);
  protected readonly selectedGenre = signal(this.allGenres);
  protected readonly chips = computed(() => [this.allGenres, ...this.genres()]);

  /** Tracks filtered live by the selected genre and the top-bar search query. */
  protected readonly filtered = computed(() => {
    const q = this.query().trim().toLowerCase();
    const genre = this.selectedGenre();
    let list = this.tracks();
    if (genre !== this.allGenres) {
      const g = genre.toLowerCase();
      list = list.filter((t) => t.genres.some((x) => x.toLowerCase() === g));
    }
    if (q) {
      list = list.filter((t) =>
        [t.title, t.artist, t.album].some((field) => field.toLowerCase().includes(q)),
      );
    }
    return list;
  });

  /** Artists tab data (loaded eagerly, like Browse). */
  protected readonly artists = signal<ArtistTile[]>([]);
  protected readonly artistsLoading = signal(true);
  protected readonly artistsError = signal<string | null>(null);

  /** Albums tab data. */
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

  /** Streams tab = songs ranked by play count (most streamed first), filtered by search. */
  protected readonly streamed = computed(() => {
    const q = this.query().trim().toLowerCase();
    const list = [...this.songsRaw()]
      .sort((a, b) => (b.numberOfPlays ?? 0) - (a.numberOfPlays ?? 0))
      .map(toTrack);
    if (!q) return list;
    return list.filter((t) =>
      [t.title, t.artist, t.album].some((field) => field.toLowerCase().includes(q)),
    );
  });

  /** Favorites tab = the user's liked songs, from the shared FavoritesStore. */
  protected readonly filteredFavorites = computed(() => {
    const q = this.query().trim().toLowerCase();
    const list = this.favStore.tracks();
    if (!q) return list;
    return list.filter((t) =>
      [t.title, t.artist, t.album].some((field) => field.toLowerCase().includes(q)),
    );
  });

  /** Ids of liked songs, passed to every track-table to drive the hearts. */
  protected readonly likedIds = this.favStore.ids;

  constructor() {
    this.loadSongs();
    this.loadArtists();
    this.loadAlbums();

    this.genresApi
      .getAll()
      .pipe(takeUntilDestroyed())
      .subscribe({
        next: (list) => this.genres.set(list.map((g) => g.name)),
        error: () => this.genres.set([]),
      });
  }

  /** Songs feed shared by the Playlist and Streams tabs. */
  loadSongs(): void {
    this.loading.set(true);
    this.error.set(null);
    this.songs
      .getAll()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (songs) => {
          this.songsRaw.set(songs);
          this.loading.set(false);
        },
        error: (err: ApiError) => {
          this.error.set(err.message);
          this.loading.set(false);
        },
      });
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

  /** Play the song the user clicked, queueing the rest of the currently shown list. */
  handleSelect(id: string): void {
    const list = this.activeList();
    const index = list.findIndex((t) => t.id === id);
    if (index < 0) return;
    if (list[index].id === this.player.current().id) {
      this.player.togglePlay();
      return;
    }
    this.player.setQueue(list, index);
    this.router.navigate(['/player']);
  }

  /** The track list shown by the active tab — drives the play queue. */
  private activeList(): Track[] {
    switch (this.activeTab()) {
      case 'Streams':
        return this.streamed();
      case 'Favorites':
        return this.filteredFavorites();
      default:
        return this.filtered();
    }
  }

  /** Like/unlike a song; the shared store handles the backend call + optimistic revert. */
  onToggleFavorite(id: string): void {
    const track =
      this.tracks().find((t) => t.id === id) ?? this.favStore.tracks().find((t) => t.id === id);
    if (track) this.favStore.toggle(track);
  }
}
