import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { LucideAngularModule } from 'lucide-angular';
import { AlbumFavoritesStore } from '@core/state/album-favorites.store';

/** Right rail: the user's favorite albums (from the shared store) + a premium promo. */
@Component({
  selector: 'app-right-panel',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, LucideAngularModule],
  templateUrl: './right-panel.html',
})
export class RightPanel {
  protected readonly albumFav = inject(AlbumFavoritesStore);
}
