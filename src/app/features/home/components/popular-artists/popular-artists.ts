import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { LucideAngularModule } from 'lucide-angular';
import { ArtistTile } from '@core/models/catalog.model';

/** "Artistas populares" row — horizontally-scrollable cards linking to each artist.
 *  Presentational: the parent ranks and passes the `artists`. */
@Component({
  selector: 'app-popular-artists',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, LucideAngularModule],
  templateUrl: './popular-artists.html',
})
export class PopularArtists {
  readonly artists = input.required<ArtistTile[]>();
}
