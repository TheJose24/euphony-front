import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { LucideAngularModule } from 'lucide-angular';
import { AppLayout } from '@layout/app-layout/app-layout';
import { PlayerStore } from '@core/state/player.store';
import { FavoritesStore } from '@core/state/favorites.store';
import { fmtTime } from '@core/utils/format';

/** Full-screen now-playing view: current track, transport controls and the up-next queue. */
@Component({
  selector: 'app-player',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [AppLayout, LucideAngularModule],
  templateUrl: './player.html',
})
export class Player {
  protected readonly player = inject(PlayerStore);
  protected readonly fav = inject(FavoritesStore);
  protected readonly fmtTime = fmtTime;

  /** Scrub the progress bar to the clicked position. */
  seek(event: MouseEvent): void {
    const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
    const ratio = (event.clientX - rect.left) / rect.width;
    this.player.setProgress(ratio * this.player.duration());
  }
}
