import { ChangeDetectionStrategy, Component, HostListener, inject, model } from '@angular/core';
import { LucideAngularModule } from 'lucide-angular';
import { Sidebar } from '../sidebar/sidebar';
import { SearchBar } from '../search-bar/search-bar';
import { UserAvatar } from '../user-avatar/user-avatar';
import { PlayerBar } from '../player-bar/player-bar';
import { BottomNav } from '../bottom-nav/bottom-nav';
import { PlayerStore } from '@core/state/player.store';

/** Seconds the ←/→ keys scrub by. */
const SEEK_STEP = 5;

/**
 * Application shell: sidebar + top bar (search & avatar) + projected content +
 * an optional right panel slot (project with the `appRight` attribute) + the
 * persistent player bar.
 *
 * Hosts the **app-wide playback shortcuts** (the player bar is always present): Space/K
 * play-pause, ←/→ scrub ±5s, Shift+←/→ prev/next. They yield to form fields (search, the
 * seek slider) and to focused buttons/links so nothing is hijacked.
 */
@Component({
  selector: 'app-layout',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [LucideAngularModule, Sidebar, SearchBar, UserAvatar, PlayerBar, BottomNav],
  templateUrl: './app-layout.html',
})
export class AppLayout {
  private readonly player = inject(PlayerStore);

  /** Two-way bound search query, surfaced so pages can filter content. */
  readonly query = model<string>('');

  @HostListener('document:keydown', ['$event'])
  onKeydown(event: KeyboardEvent): void {
    if (event.metaKey || event.ctrlKey || event.altKey) return;
    const el = event.target as HTMLElement | null;
    const tag = el?.tagName;
    if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || el?.isContentEditable) return;

    switch (event.key) {
      case ' ':
      case 'k':
        // Let a focused button/link handle its own activation instead of double-firing.
        if (tag === 'BUTTON' || tag === 'A') return;
        event.preventDefault();
        this.player.togglePlay();
        break;
      case 'ArrowRight':
        event.preventDefault();
        if (event.shiftKey) this.player.next();
        else this.player.setProgress(Math.min(this.player.progress() + SEEK_STEP, this.player.duration()));
        break;
      case 'ArrowLeft':
        event.preventDefault();
        if (event.shiftKey) this.player.previous();
        else this.player.setProgress(Math.max(this.player.progress() - SEEK_STEP, 0));
        break;
    }
  }
}
