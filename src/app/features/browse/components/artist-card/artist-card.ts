import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { LucideAngularModule } from 'lucide-angular';
import { ArtistTile } from '@core/models/catalog.model';

/** A single artist tile in the Browse grid (placeholder avatar + verified badge). */
@Component({
  selector: 'app-artist-card',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, LucideAngularModule],
  templateUrl: './artist-card.html',
})
export class ArtistCard {
  readonly artist = input.required<ArtistTile>();
}
