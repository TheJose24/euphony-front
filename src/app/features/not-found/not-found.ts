import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';

@Component({
  selector: 'app-not-found',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink],
  templateUrl: './not-found.html',
})
export class NotFound {
  constructor() {
    const router = inject(Router);
    console.error('404 Error: User attempted to access non-existent route:', router.url);
  }
}
