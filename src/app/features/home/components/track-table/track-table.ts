import { ChangeDetectionStrategy, Component, computed, inject, input, output, signal } from '@angular/core';
import { LucideAngularModule } from 'lucide-angular';
import { Track } from '@core/models/track.model';
import { PlayerStore } from '@core/state/player.store';
import { PlaylistPickerService } from '@shared/ui/playlist-picker/playlist-picker.service';
import { ToastService } from '@shared/ui/toast/toast.service';

@Component({
  selector: 'app-track-table',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [LucideAngularModule],
  templateUrl: './track-table.html',
})
export class TrackTable {
  private readonly player = inject(PlayerStore);
  private readonly picker = inject(PlaylistPickerService);
  private readonly toast = inject(ToastService);

  readonly tracks = input.required<Track[]>();
  readonly activeId = input<string | null>(null);
  readonly isPlaying = input.required<boolean>();
  /** Hide the column header when embedding the table under the Home tabs. */
  readonly showHeader = input(true);
  /** Ids of the user's liked songs; drives the filled hearts. */
  readonly likedIds = input<ReadonlySet<string>>(new Set());
  /** When true, the row menu offers a "remove from playlist" action. */
  readonly removable = input(false);
  readonly select = output<string>();
  /** Emitted when a heart is clicked; the parent performs the like/unlike. */
  readonly favoriteToggle = output<string>();
  /** Emitted from the row menu when `removable`; the parent removes the song. */
  readonly remove = output<string>();

  private readonly openMenu = signal<string | null>(null);
  private readonly byId = computed(() => new Map(this.tracks().map((t) => [t.id, t])));

  isFavorite(id: string): boolean {
    return this.likedIds().has(id);
  }

  toggleFavorite(id: string): void {
    this.favoriteToggle.emit(id);
  }

  /** Row menu: queue the track after the current one. */
  addToQueue(id: string): void {
    const track = this.byId().get(id);
    if (track) {
      this.player.enqueue(track);
      this.toast.info('Añadida a la cola.');
    }
    this.closeMenu();
  }

  /** Row menu: open the global "add to playlist" picker for this track. */
  addToPlaylist(id: string): void {
    const track = this.byId().get(id);
    if (track) this.picker.open(track);
    this.closeMenu();
  }

  /** Row menu: ask the parent to remove this track from the current playlist. */
  removeFromPlaylist(id: string): void {
    this.remove.emit(id);
    this.closeMenu();
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
