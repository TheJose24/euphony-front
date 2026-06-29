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

  /** Scrub to the value of the range slider (keyboard, drag, or click all flow through `input`). */
  seek(event: Event): void {
    this.player.setProgress(Number((event.target as HTMLInputElement).value));
  }

  /** Set output volume from the slider (0–1). */
  setVolume(event: Event): void {
    this.player.setVolume(Number((event.target as HTMLInputElement).value));
  }

  /** Speaker icon reflecting the current level (muted / low / high). */
  volumeIcon(): string {
    if (this.player.muted() || this.player.volume() === 0) return 'volume-x';
    return this.player.volume() < 0.5 ? 'volume-1' : 'volume-2';
  }

  /** Accessible value text for the volume slider, e.g. "60%". */
  volumeLabel(): string {
    return `${Math.round(this.player.volumePct())}%`;
  }
}
