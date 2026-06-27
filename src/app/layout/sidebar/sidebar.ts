import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { LucideAngularModule } from 'lucide-angular';
import { Logo } from '@shared/ui/logo/logo';
import { NavItem } from './nav-item/nav-item';
import { Modal } from '@shared/ui/modal/modal';
import { PlaylistsStore } from '@core/state/playlists.store';

interface NavEntry {
  icon: string;
  label: string;
  to?: string;
  queryParams?: Record<string, string>;
}

@Component({
  selector: 'app-sidebar',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Logo, NavItem, RouterLink, RouterLinkActive, LucideAngularModule, Modal],
  templateUrl: './sidebar.html',
})
export class Sidebar {
  protected readonly playlistsStore = inject(PlaylistsStore);

  protected readonly mainNav: NavEntry[] = [
    { icon: 'home', label: 'Home', to: '/home' },
    { icon: 'search', label: 'Search', to: '/search' },
    { icon: 'heart', label: 'Likes', to: '/library', queryParams: { tab: 'Canciones' } },
    { icon: 'list-music', label: 'Playlists', to: '/library', queryParams: { tab: 'Playlists' } },
    { icon: 'disc-3', label: 'Albums', to: '/library', queryParams: { tab: 'Álbumes' } },
    { icon: 'users', label: 'Following', to: '/library', queryParams: { tab: 'Artistas' } },
  ];

  protected readonly discovery: NavEntry[] = [
    { icon: 'trending-up', label: 'Trending' },
    { icon: 'flame', label: 'Popular' },
    { icon: 'mic-2', label: 'Singer' },
    { icon: 'music-2', label: 'Band' },
    { icon: 'radio', label: 'Radio' },
    { icon: 'headphones', label: 'Podcast' },
  ];

  /** Rotating accent dots for the playlist list (purely decorative). */
  private readonly dotColors = ['bg-dot-red', 'bg-dot-green', 'bg-dot-yellow', 'bg-dot-purple'];

  protected readonly creating = signal(false);
  protected readonly newName = signal('');

  dotColor(index: number): string {
    return this.dotColors[index % this.dotColors.length];
  }

  openCreate(): void {
    this.newName.set('');
    this.creating.set(true);
  }

  closeCreate(): void {
    this.creating.set(false);
  }

  submitCreate(): void {
    const name = this.newName().trim();
    if (name.length < 3) return;
    this.playlistsStore.create(name);
    this.creating.set(false);
  }

  remove(id: number, event: Event): void {
    event.preventDefault();
    event.stopPropagation();
    this.playlistsStore.remove(id);
  }
}
