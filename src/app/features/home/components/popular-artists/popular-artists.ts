import { ChangeDetectionStrategy, Component } from '@angular/core';
import { LucideAngularModule } from 'lucide-angular';
import { popularArtists } from '@core/data/home.data';

/** "Popular Artist" row — horizontally-scrollable photo cards. */
@Component({
  selector: 'app-popular-artists',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [LucideAngularModule],
  templateUrl: './popular-artists.html',
})
export class PopularArtists {
  protected readonly artists = popularArtists;
}
