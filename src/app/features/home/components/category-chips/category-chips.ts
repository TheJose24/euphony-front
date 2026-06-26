import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

/** Selectable genre chips under the "Category" heading.
 *  Presentational: the parent owns the genre list and the active selection. */
@Component({
  selector: 'app-category-chips',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './category-chips.html',
})
export class CategoryChips {
  readonly genres = input.required<string[]>();
  readonly selected = input.required<string>();
  readonly select = output<string>();
}
