import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { LucideAngularModule } from 'lucide-angular';
import { AppLayout } from '@layout/app-layout/app-layout';
import { ContentTabs } from '@features/home/components/content-tabs/content-tabs';
import { TrackTable } from '@features/home/components/track-table/track-table';
import { ArtistCard } from '@features/browse/components/artist-card/artist-card';
import { AlbumCard } from '@features/browse/components/album-card/album-card';
import { LoadingState } from '@shared/ui/loading-state/loading-state';
import { EmptyState } from '@shared/ui/empty-state/empty-state';
import { ErrorState } from '@shared/ui/error-state/error-state';
import { Track } from '@core/models/track.model';
import { ArtistTile } from '@core/models/catalog.model';
import { PlayerStore } from '@core/state/player.store';
import { FavoritesStore } from '@core/state/favorites.store';
import { AlbumFavoritesStore } from '@core/state/album-favorites.store';
import { FollowStore } from '@core/state/follow.store';
import { PlaylistsStore } from '@core/state/playlists.store';

type LibraryTab = 'Canciones' | 'Álbumes' | 'Playlists' | 'Artistas';

/**
 * "Your library" — aggregates everything the user has collected: liked songs, favorite albums,
 * playlists and followed artists. Each tab reads from the shared store that already owns that
 * collection, so it stays in sync with likes/favorites/follows made elsewhere.
 */
@Component({
  selector: 'app-library',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    AppLayout,
    ContentTabs,
    TrackTable,
    ArtistCard,
    AlbumCard,
    RouterLink,
    LucideAngularModule,
    LoadingState,
    EmptyState,
    ErrorState,
  ],
  templateUrl: './library.html',
})
export class Library {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  protected readonly player = inject(PlayerStore);
  protected readonly favStore = inject(FavoritesStore);
  protected readonly albumFav = inject(AlbumFavoritesStore);
  protected readonly followStore = inject(FollowStore);
  protected readonly playlistsStore = inject(PlaylistsStore);

  protected readonly query = signal('');
  protected readonly tabs: LibraryTab[] = ['Canciones', 'Álbumes', 'Playlists', 'Artistas'];
  protected readonly activeTab = signal<LibraryTab>('Canciones');

  /** Liked songs filtered by the top-bar search query. */
  protected readonly filteredLikes = computed(() => this.filterTracks(this.favStore.tracks()));

  protected readonly filteredAlbums = computed(() => {
    const q = this.query().trim().toLowerCase();
    const list = this.albumFav.albums();
    if (!q) return list;
    return list.filter(
      (a) => a.title.toLowerCase().includes(q) || a.artist.toLowerCase().includes(q),
    );
  });

  protected readonly filteredPlaylists = computed(() => {
    const q = this.query().trim().toLowerCase();
    const list = this.playlistsStore.playlists();
    if (!q) return list;
    return list.filter((p) => p.name.toLowerCase().includes(q));
  });

  /** Followed artists mapped to the Browse tile shape so we can reuse `app-artist-card`. */
  protected readonly followedArtists = computed<ArtistTile[]>(() => {
    const q = this.query().trim().toLowerCase();
    const list = this.followStore.following().map((f) => ({
      id: f.artistId,
      name: f.artistName,
      country: '',
      verified: false,
      initial: (f.artistName.trim().charAt(0) || '?').toUpperCase(),
      image: null,
    }));
    return q ? list.filter((a) => a.name.toLowerCase().includes(q)) : list;
  });

  constructor() {
    // Honour ?tab= so the sidebar's Likes/Playlists/Albums/Following can deep-link a tab.
    this.route.queryParamMap.pipe(takeUntilDestroyed()).subscribe((params) => {
      const tab = params.get('tab');
      if (tab && (this.tabs as string[]).includes(tab)) {
        this.activeTab.set(tab as LibraryTab);
      }
    });
  }

  /** Play a liked song, queueing the rest of the (filtered) likes after it. */
  handleSelect(id: string): void {
    const list = this.filteredLikes();
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
    const track = this.favStore.tracks().find((t) => t.id === id);
    if (track) this.favStore.toggle(track);
  }

  private filterTracks(list: Track[]): Track[] {
    const q = this.query().trim().toLowerCase();
    if (!q) return list;
    return list.filter((t) =>
      [t.title, t.artist, t.album].some((field) => field.toLowerCase().includes(q)),
    );
  }
}
