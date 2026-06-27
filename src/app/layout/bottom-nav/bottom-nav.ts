import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { LucideAngularModule } from 'lucide-angular';

interface BottomNavItem {
  readonly icon: string;
  readonly label: string;
  readonly to: string;
}

/**
 * Bottom tab bar for small screens (`<lg`), where the sidebar is hidden. Mirrors the
 * primary destinations so the app is navigable on mobile.
 */
@Component({
  selector: 'app-bottom-nav',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, RouterLinkActive, LucideAngularModule],
  templateUrl: './bottom-nav.html',
})
export class BottomNav {
  protected readonly items: readonly BottomNavItem[] = [
    { icon: 'home', label: 'Inicio', to: '/home' },
    { icon: 'search', label: 'Buscar', to: '/search' },
    { icon: 'library', label: 'Biblioteca', to: '/library' },
    { icon: 'headphones', label: 'Reproductor', to: '/player' },
  ];
}
