import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

/** Underlined tab bar used by Home and Library.
 *  Presentational: the parent owns the active tab and the rendered content.
 *  Implements the WAI-ARIA tabs pattern (roving tabindex, arrow/Home/End keys). */
@Component({
  selector: 'app-content-tabs',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './content-tabs.html',
})
export class ContentTabs {
  readonly tabs = input.required<string[]>();
  readonly active = input.required<string>();
  readonly select = output<string>();

  /** Arrow/Home/End move focus and selection across the tablist (selection follows focus). */
  onKeydown(event: KeyboardEvent, index: number): void {
    const tabs = this.tabs();
    let next = index;
    switch (event.key) {
      case 'ArrowRight':
        next = (index + 1) % tabs.length;
        break;
      case 'ArrowLeft':
        next = (index - 1 + tabs.length) % tabs.length;
        break;
      case 'Home':
        next = 0;
        break;
      case 'End':
        next = tabs.length - 1;
        break;
      default:
        return;
    }
    event.preventDefault();
    this.select.emit(tabs[next]);
    const list = (event.currentTarget as HTMLElement).parentElement;
    (list?.children[next] as HTMLElement | undefined)?.focus();
  }
}
