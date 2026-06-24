import { ChangeDetectionStrategy, Component, model } from '@angular/core';
import { LucideAngularModule } from 'lucide-angular';

@Component({
  selector: 'app-search-bar',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [LucideAngularModule],
  templateUrl: './search-bar.html',
})
export class SearchBar {
  /** Two-way bound search query. */
  readonly value = model<string>('');

  onInput(event: Event): void {
    this.value.set((event.target as HTMLInputElement).value);
  }
}
