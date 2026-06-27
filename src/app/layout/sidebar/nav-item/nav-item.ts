import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { LucideAngularModule } from 'lucide-angular';

/**
 * A single sidebar navigation entry. When `to` is set it renders a router link
 * that highlights itself while active; otherwise it is an inert button.
 */
@Component({
  selector: 'app-nav-item',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, RouterLinkActive, LucideAngularModule],
  templateUrl: './nav-item.html',
})
export class NavItem {
  readonly icon = input.required<string>();
  readonly label = input.required<string>();
  readonly to = input<string>();
  /** Optional query params for the router link (e.g. preselecting a library tab). */
  readonly queryParams = input<Record<string, string>>();
}
