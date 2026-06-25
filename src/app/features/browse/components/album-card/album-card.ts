import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { LucideAngularModule } from 'lucide-angular';
import { AlbumTile } from '@core/models/catalog.model';

/** A single album tile in the Browse grid (cover + title + artist). */
@Component({
  selector: 'app-album-card',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, LucideAngularModule],
  templateUrl: './album-card.html',
})
export class AlbumCard {
  readonly album = input.required<AlbumTile>();
}
