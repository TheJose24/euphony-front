import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { LucideAngularModule } from 'lucide-angular';
import { CHILL_MIX_COVER } from '@core/data/tracks.data';

@Component({
  selector: 'app-playlist-header',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [LucideAngularModule],
  templateUrl: './playlist-header.html',
})
export class PlaylistHeader {
  readonly isPlaying = input.required<boolean>();
  readonly isFavorite = input.required<boolean>();
  readonly togglePlay = output<void>();
  readonly toggleFavorite = output<void>();

  protected readonly cover = CHILL_MIX_COVER;
}
