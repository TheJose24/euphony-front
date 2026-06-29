import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { LucideAngularModule } from 'lucide-angular';
import { AppLayout } from '@layout/app-layout/app-layout';
import { EmptyState } from '@shared/ui/empty-state/empty-state';
import { Modal } from '@shared/ui/modal/modal';
import { ToastService } from '@shared/ui/toast/toast.service';
import {
  CURRENT_SUBSCRIPTION,
  FEATURE_META,
  INTERVAL_LABEL,
  Plan,
  PLANS,
  STATE_META,
  SubscriptionState,
} from '@core/data/plans.data';

/**
 * Account subscription screen (`/subscription`): the user's current plan, status and billing
 * dates, with "change plan" and "cancel" actions. UI-only — the real data comes from
 * `GET /api/v1/subscriptions` and cancellation is server-driven; here both are mocked.
 */
@Component({
  selector: 'app-subscription',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [AppLayout, LucideAngularModule, EmptyState, Modal],
  templateUrl: './subscription.html',
})
export class Subscription {
  private readonly router = inject(Router);
  private readonly toast = inject(ToastService);

  protected readonly query = signal('');
  protected readonly subscription = CURRENT_SUBSCRIPTION;
  protected readonly plan: Plan | null =
    PLANS.find((p) => p.planId === CURRENT_SUBSCRIPTION?.idPlan) ?? null;

  protected readonly confirmingCancel = signal(false);

  stateMeta(state: SubscriptionState) {
    return STATE_META[state];
  }

  featureMeta(feature: Plan['features'][number]) {
    return FEATURE_META[feature];
  }

  intervalLabel(interval: Plan['interval']): string {
    return INTERVAL_LABEL[interval];
  }

  /** "1 de julio de 2026" from an ISO date-time. */
  formatDate(iso: string): string {
    return new Intl.DateTimeFormat('es-ES', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }).format(new Date(iso));
  }

  changePlan(): void {
    this.router.navigate(['/plans']);
  }

  /** Mock cancel: the real flow updates the subscription state server-side. */
  confirmCancel(): void {
    this.confirmingCancel.set(false);
    this.toast.info('La cancelación se integrará con el backend próximamente.');
  }
}
