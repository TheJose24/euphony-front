import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { LucideAngularModule } from 'lucide-angular';
import { PlayerStore } from '@core/state/player.store';
import { FavoritesStore } from '@core/state/favorites.store';
import { fmtTime } from '@core/utils/format';

@Component({
  selector: 'app-player-bar',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [LucideAngularModule, RouterLink],
  templateUrl: './player-bar.html',
})
export class PlayerBar {
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
