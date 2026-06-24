import { ChangeDetectionStrategy, Component } from '@angular/core';
import { LucideAngularModule } from 'lucide-angular';
import { FavoriteItem } from '@core/models/track.model';
import { favoriteAlbums, favoriteMusic } from '@core/data/tracks.data';

@Component({
  selector: 'app-right-panel',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [LucideAngularModule],
  templateUrl: './right-panel.html',
})
export class RightPanel {
  protected readonly sections: { title: string; items: FavoriteItem[] }[] = [
    { title: 'Favorite Album', items: favoriteAlbums },
    { title: 'Favorite Music', items: favoriteMusic },
  ];
}
