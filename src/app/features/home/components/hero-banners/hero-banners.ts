import { ChangeDetectionStrategy, Component } from '@angular/core';
import { LucideAngularModule } from 'lucide-angular';
import { heroBanners } from '@core/data/home.data';

/** Horizontally-scrollable row of promotional banners at the top of Home. */
@Component({
  selector: 'app-hero-banners',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [LucideAngularModule],
  templateUrl: './hero-banners.html',
})
export class HeroBanners {
  protected readonly banners = heroBanners;
}
