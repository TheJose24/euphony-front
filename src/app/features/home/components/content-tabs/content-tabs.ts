import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

/** Underlined tab bar (Playlist / Artists / Albums / Streams / Favorites).
 *  Presentational: the parent owns the active tab and the rendered content. */
@Component({
  selector: 'app-content-tabs',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './content-tabs.html',
})
export class ContentTabs {
  readonly tabs = input.required<string[]>();
  readonly active = input.required<string>();
  readonly select = output<string>();
}
