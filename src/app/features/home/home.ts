import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { AppLayout } from '@layout/app-layout/app-layout';
import { PlayerStore } from '@core/state/player.store';
import { tracks } from '@core/data/tracks.data';
import { PlaylistHeader } from './components/playlist-header/playlist-header';
import { TrackTable } from './components/track-table/track-table';
import { RightPanel } from './components/right-panel/right-panel';

@Component({
  selector: 'app-home',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [AppLayout, PlaylistHeader, TrackTable, RightPanel],
  templateUrl: './home.html',
})
export class Home {
  private readonly router = inject(Router);
  protected readonly player = inject(PlayerStore);

  protected readonly query = signal('');

  /** Tracks filtered live by the top-bar search query. */
  protected readonly filtered = computed(() => {
    const q = this.query().trim().toLowerCase();
    if (!q) return tracks;
    return tracks.filter((t) =>
      [t.title, t.artist, t.album].some((field) => field.toLowerCase().includes(q)),
    );
  });

  handleSelect(id: string): void {
    const track = tracks.find((x) => x.id === id);
    if (!track) return;
    if (track.id === this.player.current().id) {
      this.player.togglePlay();
    } else {
      this.player.setTrack(track);
      this.router.navigate(['/player']);
    }
  }
}
