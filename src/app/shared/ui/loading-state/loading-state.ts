import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

/**
 * Skeleton placeholder shown while async content loads. Reserves vertical space
 * to avoid layout shift and mirrors the shape of a track row (cover + two lines).
 * Respects `prefers-reduced-motion` (the pulse collapses via global CSS).
 */
@Component({
  selector: 'app-loading-state',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="space-y-3 py-4" role="status" [attr.aria-label]="label()" aria-busy="true">
      @for (row of rowsArray(); track $index) {
        <div class="flex items-center gap-3">
          <div class="h-10 w-10 shrink-0 animate-pulse rounded-md bg-surface-2"></div>
          <div class="min-w-0 flex-1 space-y-2">
            <div class="h-3 w-1/3 animate-pulse rounded bg-surface-2"></div>
            <div class="h-3 w-1/5 animate-pulse rounded bg-surface-2"></div>
          </div>
        </div>
      }
    </div>
  `,
})
export class LoadingState {
  /** Number of skeleton rows to render. */
  readonly rows = input(6);
  /** Accessible label announced to assistive tech. */
  readonly label = input('Cargando…');

  protected readonly rowsArray = computed(() => Array.from({ length: this.rows() }));
}
