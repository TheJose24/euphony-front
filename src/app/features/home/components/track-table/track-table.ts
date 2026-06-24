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
  readonly select = output<string>();

  /** Per-row "liked" hearts — local to the table, as in the original React component. */
  private readonly favorites = signal<ReadonlySet<string>>(new Set());
  private readonly openMenu = signal<string | null>(null);

  protected readonly menuOptions = ['Add to queue', 'Share', 'View details'];

  isFavorite(id: string): boolean {
    return this.favorites().has(id);
  }

  toggleFavorite(id: string): void {
    const next = new Set(this.favorites());
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    this.favorites.set(next);
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
