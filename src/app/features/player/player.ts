import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { LucideAngularModule } from 'lucide-angular';
import { AppLayout } from '@layout/app-layout/app-layout';
import { PlayerStore } from '@core/state/player.store';
import { PLAY_IT_SAFE_COVER } from '@core/data/tracks.data';

@Component({
  selector: 'app-player',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [AppLayout, LucideAngularModule],
  templateUrl: './player.html',
})
export class Player {
  protected readonly player = inject(PlayerStore);
  protected readonly playItSafe = PLAY_IT_SAFE_COVER;
}
