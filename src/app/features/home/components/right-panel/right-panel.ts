import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { LucideAngularModule } from 'lucide-angular';
import { AuthStore } from '@core/state/auth.store';
import { FavoritesService } from '@core/api/favorites.service';
import { toAlbumTile } from '@core/api/album.mapper';
import { AlbumTile } from '@core/models/catalog.model';

@Component({
  selector: 'app-right-panel',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, LucideAngularModule],
  templateUrl: './right-panel.html',
})
export class RightPanel {
  private readonly favoritesApi = inject(FavoritesService);
  private readonly auth = inject(AuthStore);

  protected readonly albums = signal<AlbumTile[]>([]);
  protected readonly loading = signal(true);

  constructor() {
    this.favoritesApi
      .getFavoriteAlbums(this.auth.userId())
      .pipe(takeUntilDestroyed())
      .subscribe({
        next: (list) => {
          this.albums.set(list.map(toAlbumTile));
          this.loading.set(false);
        },
        error: () => this.loading.set(false),
      });
  }
}
