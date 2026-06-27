import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { LucideAngularModule } from 'lucide-angular';
import { AppLayout } from '@layout/app-layout/app-layout';
import { PlayerStore } from '@core/state/player.store';
import { FavoritesStore } from '@core/state/favorites.store';
import { fmtTime } from '@core/utils/format';

/** Full-screen now-playing view: current track, transport controls and the up-next queue. */
@Component({
  selector: 'app-player',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [AppLayout, LucideAngularModule, RouterLink],
  templateUrl: './player.html',
})
export class Player {
  protected readonly player = inject(PlayerStore);
  protected readonly fav = inject(FavoritesStore);
  protected readonly fmtTime = fmtTime;

  /** Scrub to the value of the range slider (keyboard, drag, or click all flow through `input`). */
  seek(event: Event): void {
    this.player.setProgress(Number((event.target as HTMLInputElement).value));
  }
}
