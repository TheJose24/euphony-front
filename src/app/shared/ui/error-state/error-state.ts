import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { LucideAngularModule } from 'lucide-angular';

/**
 * Error state with an optional retry action. Emits `retry` when the user clicks
 * the button so the parent can re-run the failed request.
 */
@Component({
  selector: 'app-error-state',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [LucideAngularModule],
  template: `
    <div class="flex flex-col items-center justify-center gap-3 py-16 text-center" role="alert">
      <div class="flex h-14 w-14 items-center justify-center rounded-full bg-destructive/10 text-destructive">
        <lucide-icon name="triangle-alert" class="h-6 w-6" [strokeWidth]="1.75"></lucide-icon>
      </div>
      <p class="max-w-[420px] text-sm text-soft">{{ message() }}</p>
      @if (showRetry()) {
        <button
          type="button"
          (click)="retry.emit()"
          class="mt-1 rounded-full border border-divider px-4 py-2 text-[13px] font-semibold text-foreground transition-base hover:border-primary"
        >
          Reintentar
        </button>
      }
    </div>
  `,
})
export class ErrorState {
  readonly message = input('Algo salió mal. Inténtalo de nuevo.');
  readonly showRetry = input(true);
  readonly retry = output<void>();
}
