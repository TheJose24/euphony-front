import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { LucideAngularModule } from 'lucide-angular';

/**
 * Reusable centered modal. Controlled by the parent via `[open]`; emits `close` on the
 * close button, backdrop click or Escape. Content is projected. Fixed-position overlay
 * (`z-modal`) so it escapes any clipping ancestor.
 */
@Component({
  selector: 'app-modal',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [LucideAngularModule],
  host: { '(document:keydown.escape)': 'onEscape()' },
  template: `
    @if (open()) {
      <div
        class="fixed inset-0 z-modal flex items-center justify-center p-4"
        role="dialog"
        aria-modal="true"
        [attr.aria-label]="title()"
      >
        <div class="absolute inset-0 bg-black/60" (click)="close.emit()"></div>
        <div
          class="relative w-full max-w-md rounded-2xl border border-divider bg-surface-2 p-6 shadow-2xl animate-fade-in"
        >
          <div class="flex items-center justify-between gap-4">
            <h2 class="text-[16px] font-bold text-foreground">{{ title() }}</h2>
            <button
              type="button"
              (click)="close.emit()"
              class="shrink-0 text-soft transition-base hover:text-foreground"
              aria-label="Cerrar"
            >
              <lucide-icon name="x" class="h-5 w-5"></lucide-icon>
            </button>
          </div>
          <div class="mt-4">
            <ng-content />
          </div>
        </div>
      </div>
    }
  `,
})
export class Modal {
  readonly open = input(false);
  readonly title = input('');
  readonly close = output<void>();

  onEscape(): void {
    if (this.open()) this.close.emit();
  }
}
