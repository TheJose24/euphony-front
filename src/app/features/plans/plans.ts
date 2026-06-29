import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { LucideAngularModule } from 'lucide-angular';
import { AppLayout } from '@layout/app-layout/app-layout';
import { ToastService } from '@shared/ui/toast/toast.service';
import {
  CURRENT_SUBSCRIPTION,
  FEATURE_META,
  INTERVAL_LABEL,
  Plan,
  PLANS,
} from '@core/data/plans.data';

/**
 * Pricing screen (`/plans`): the available subscription tiers as cards, the recommended
 * one highlighted. UI-only for now — "Suscribirse" stands in for the PayPal redirect
 * (`POST /api/v1/subscriptions/create` → approval URL) that the backend will drive later.
 */
@Component({
  selector: 'app-plans',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [AppLayout, LucideAngularModule],
  templateUrl: './plans.html',
})
export class Plans {
  private readonly toast = inject(ToastService);

  protected readonly query = signal('');
  protected readonly plans = PLANS;
  private readonly current = CURRENT_SUBSCRIPTION;

  featureMeta(feature: Plan['features'][number]) {
    return FEATURE_META[feature];
  }

  intervalLabel(interval: Plan['interval']): string {
    return INTERVAL_LABEL[interval];
  }

  /** Whether this plan is the user's active subscription. */
  isCurrent(plan: Plan): boolean {
    return this.current?.idPlan === plan.planId && this.current?.estado === 'ACTIVE';
  }

  ctaLabel(plan: Plan): string {
    if (this.isCurrent(plan)) return 'Plan actual';
    if (plan.price === 0) return 'Empezar gratis';
    return plan.freeTrial ? 'Probar gratis' : 'Suscribirse';
  }

  /** Mock subscribe: the real flow redirects to PayPal and is wired server-side. */
  subscribe(plan: Plan): void {
    if (this.isCurrent(plan)) return;
    if (plan.price === 0) {
      this.toast.info('El plan Free ya está activo en tu cuenta.');
      return;
    }
    this.toast.info(`Te redirigiremos a PayPal para activar ${plan.planName} (integración pendiente).`);
  }
}
