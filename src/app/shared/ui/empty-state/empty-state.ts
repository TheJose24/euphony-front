import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { LucideAngularModule } from 'lucide-angular';

/**
 * Neutral empty state: an icon in a soft circle plus a short message.
 * Pass a registered lucide icon name (e.g. `users`, `disc-3`, `heart`).
 */
@Component({
  selector: 'app-empty-state',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [LucideAngularModule],
  template: `
    <div class="flex flex-col items-center justify-center gap-3 py-16 text-center">
      <div class="flex h-14 w-14 items-center justify-center rounded-full bg-surface-2 text-dim">
        <lucide-icon [name]="icon()" class="h-6 w-6" [strokeWidth]="1.75"></lucide-icon>
      </div>
      <p class="max-w-[360px] text-sm text-soft">{{ message() }}</p>
    </div>
  `,
})
export class EmptyState {
  readonly message = input('No hay nada que mostrar.');
  readonly icon = input('music-2');
}
