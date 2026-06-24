import { ChangeDetectionStrategy, Component } from '@angular/core';
import { Logo } from '@shared/ui/logo/logo';
import { NavItem } from './nav-item/nav-item';

interface NavEntry {
  icon: string;
  label: string;
  to?: string;
}

interface PlaylistEntry {
  label: string;
  color: string;
}

@Component({
  selector: 'app-sidebar',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Logo, NavItem],
  templateUrl: './sidebar.html',
})
export class Sidebar {
  protected readonly mainNav: NavEntry[] = [
    { icon: 'home', label: 'Home', to: '/home' },
    { icon: 'list-music', label: 'Playlist', to: '/player' },
    { icon: 'disc-3', label: 'Album' },
  ];

  protected readonly discovery: NavEntry[] = [
    { icon: 'trending-up', label: 'Trending' },
    { icon: 'flame', label: 'Popular' },
    { icon: 'mic-2', label: 'Singer' },
    { icon: 'music-2', label: 'Band' },
    { icon: 'radio', label: 'Radio' },
    { icon: 'headphones', label: 'Podcast' },
  ];

  protected readonly playlists: PlaylistEntry[] = [
    { label: 'Love', color: 'bg-dot-red' },
    { label: 'Electro', color: 'bg-dot-green' },
    { label: 'Funk', color: 'bg-dot-yellow' },
    { label: 'EDM', color: 'bg-dot-purple' },
  ];
}
