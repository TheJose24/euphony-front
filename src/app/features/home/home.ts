import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import { AppLayout } from '@layout/app-layout/app-layout';
import { PlayerStore } from '@core/state/player.store';
import { SongsService } from '@core/api/songs.service';
import { toTrack } from '@core/api/song.mapper';
import { ApiError } from '@core/api/api-error';
import { Track } from '@core/models/track.model';
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
  private readonly songs = inject(SongsService);
  protected readonly player = inject(PlayerStore);

  protected readonly query = signal('');
  protected readonly tracks = signal<Track[]>([]);
  protected readonly loading = signal(true);
  protected readonly error = signal<string | null>(null);

  /** Tracks filtered live by the top-bar search query. */
  protected readonly filtered = computed(() => {
    const q = this.query().trim().toLowerCase();
    const list = this.tracks();
    if (!q) return list;
    return list.filter((t) =>
      [t.title, t.artist, t.album].some((field) => field.toLowerCase().includes(q)),
    );
  });

  constructor() {
    this.songs
      .getAll()
      .pipe(takeUntilDestroyed())
      .subscribe({
        next: (songs) => {
          this.tracks.set(songs.map(toTrack));
          this.loading.set(false);
        },
        error: (err: ApiError) => {
          this.error.set(err.message);
          this.loading.set(false);
        },
      });
  }

  handleSelect(id: string): void {
    const track = this.tracks().find((x) => x.id === id);
    if (!track) return;
    if (track.id === this.player.current().id) {
      this.player.togglePlay();
    } else {
      this.player.setTrack(track);
      this.router.navigate(['/player']);
    }
  }
}
