import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { LucideAngularModule } from 'lucide-angular';
import { ToastService, ToastType } from './toast.service';

/**
 * Renders the global toast queue. Mount once in the root component. Toasts stack
 * at the top-right above every other layer (`z-modal`) and clear the page edges.
 */
@Component({
  selector: 'app-toast-container',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [LucideAngularModule],
  template: `
    <div
      class="pointer-events-none fixed right-4 top-4 z-modal flex w-[min(360px,calc(100vw-2rem))] flex-col gap-2"
    >
      @for (t of toasts(); track t.id) {
        <div
          class="pointer-events-auto flex items-start gap-3 rounded-lg border border-divider bg-surface-2 px-4 py-3 shadow-2xl animate-fade-in"
          [attr.role]="t.type === 'error' ? 'alert' : 'status'"
        >
          <lucide-icon
            [name]="icon(t.type)"
            class="mt-0.5 h-5 w-5 shrink-0"
            [class]="color(t.type)"
            [strokeWidth]="1.75"
          ></lucide-icon>
          <p class="min-w-0 flex-1 text-[13px] text-foreground">{{ t.message }}</p>
          <button
            type="button"
            (click)="toast.dismiss(t.id)"
            class="shrink-0 text-soft transition-base hover:text-foreground"
            aria-label="Cerrar notificación"
          >
            <lucide-icon name="x" class="h-4 w-4"></lucide-icon>
          </button>
        </div>
      }
    </div>
  `,
})
export class ToastContainer {
  protected readonly toast = inject(ToastService);
  protected readonly toasts = this.toast.toasts;

  protected icon(type: ToastType): string {
    return type === 'success' ? 'circle-check' : type === 'error' ? 'triangle-alert' : 'info';
  }

  protected color(type: ToastType): string {
    return type === 'success'
      ? 'text-dot-green'
      : type === 'error'
        ? 'text-destructive'
        : 'text-primary';
  }
}
