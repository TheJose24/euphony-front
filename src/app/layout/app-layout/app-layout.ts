import { ChangeDetectionStrategy, Component, model } from '@angular/core';
import { LucideAngularModule } from 'lucide-angular';
import { Sidebar } from '../sidebar/sidebar';
import { SearchBar } from '../search-bar/search-bar';
import { UserAvatar } from '../user-avatar/user-avatar';
import { PlayerBar } from '../player-bar/player-bar';

/**
 * Application shell: sidebar + top bar (search & avatar) + projected content +
 * an optional right panel slot (project with the `appRight` attribute) + the
 * persistent player bar.
 */
@Component({
  selector: 'app-layout',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [LucideAngularModule, Sidebar, SearchBar, UserAvatar, PlayerBar],
  templateUrl: './app-layout.html',
})
export class AppLayout {
  /** Two-way bound search query, surfaced so pages can filter content. */
  readonly query = model<string>('');
}
