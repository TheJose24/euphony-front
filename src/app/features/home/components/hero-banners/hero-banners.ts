import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { LucideAngularModule } from 'lucide-angular';
import { HeroFeature } from '@core/data/home.data';

/** Horizontally-scrollable row of featured cards at the top of Home.
 *  Presentational: the parent builds `features` from real catalog data. */
@Component({
  selector: 'app-hero-banners',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, LucideAngularModule],
  templateUrl: './hero-banners.html',
})
export class HeroBanners {
  readonly features = input.required<HeroFeature[]>();
}
