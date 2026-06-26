import { ChangeDetectionStrategy, Component, input, output, signal } from '@angular/core';
import { LucideAngularModule } from 'lucide-angular';
import { Track } from '@core/models/track.model';

@Component({
  selector: 'app-track-table',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [LucideAngularModule],
  templateUrl: './track-table.html',
})
export class TrackTable {
  readonly tracks = input.required<Track[]>();
  readonly activeId = input<string | null>(null);
  readonly isPlaying = input.required<boolean>();
  /** Hide the column header when embedding the table under the Home tabs. */
  readonly showHeader = input(true);
  /** Ids of the user's liked songs; drives the filled hearts. */
  readonly likedIds = input<ReadonlySet<string>>(new Set());
  readonly select = output<string>();
  /** Emitted when a heart is clicked; the parent performs the like/unlike. */
  readonly favoriteToggle = output<string>();

  private readonly openMenu = signal<string | null>(null);

  protected readonly menuOptions = ['Add to queue', 'Share', 'View details'];

  isFavorite(id: string): boolean {
    return this.likedIds().has(id);
  }

  toggleFavorite(id: string): void {
    this.favoriteToggle.emit(id);
  }

  isMenuOpen(id: string): boolean {
    return this.openMenu() === id;
  }

  toggleMenu(id: string): void {
    this.openMenu.update((current) => (current === id ? null : id));
  }

  closeMenu(): void {
    this.openMenu.set(null);
  }
}
