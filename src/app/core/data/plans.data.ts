/**
 * Mock, presentation-only data for the Plans (pricing) and Subscription screens.
 *
 * The types mirror the backend contract (API_ENDPOINTS.md §6.9/§6.10) so wiring the real
 * `/api/v1/plans` and `/api/v1/subscriptions` later is a drop-in: replace these constants
 * with service calls. No payment logic here — PayPal is a redirect handled server-side.
 */

export type PlanInterval = 'DAY' | 'WEEK' | 'MONTH' | 'YEAR';

export type SubscriptionFeature =
  | 'PREMIUM_ACCOUNT'
  | 'TWO_ACCOUNTS'
  | 'FOUR_ACCOUNTS'
  | 'CANCEL_ANYTIME'
  | 'HIGH_QUALITY'
  | 'OFFLINE_MODE'
  | 'NO_ADS'
  | 'LYRICS'
  | 'EXCLUSIVE_CONTENT'
  | 'CUSTOM_PLAYLISTS';

export type SubscriptionState = 'ACTIVE' | 'CANCELED' | 'SUSPENDED' | 'EXPIRED' | 'PENDIG';

/** A subscription plan (mirrors `PlansSubscriptionResponseDTO`). */
export interface Plan {
  planId: number;
  planName: string;
  price: number;
  interval: PlanInterval;
  duration: number; // billing cycles
  description: string;
  features: SubscriptionFeature[];
  freeTrial: boolean;
  durationFreeTrial: number; // days
  isActive: boolean;
  /** UI-only: marks the recommended tier (teal-highlighted card + badge). */
  popular?: boolean;
}

/** The user's current subscription (mirrors `SubscriptionResponseDTO`). */
export interface Subscription {
  idSuscripcion: number;
  idPlan: number;
  estado: SubscriptionState;
  fechaInicio: string; // ISO date-time
  fechaRenovacion: string;
  fechaCancelacion: string | null;
}

/** Per-feature display metadata: human label + lucide icon. */
export const FEATURE_META: Record<SubscriptionFeature, { label: string; icon: string }> = {
  NO_ADS: { label: 'Sin anuncios', icon: 'ban' },
  PREMIUM_ACCOUNT: { label: 'Cuenta premium', icon: 'crown' },
  HIGH_QUALITY: { label: 'Audio de alta calidad', icon: 'gauge' },
  OFFLINE_MODE: { label: 'Escucha sin conexión', icon: 'download' },
  LYRICS: { label: 'Letras sincronizadas', icon: 'mic-2' },
  CUSTOM_PLAYLISTS: { label: 'Playlists ilimitadas', icon: 'list-music' },
  CANCEL_ANYTIME: { label: 'Cancela cuando quieras', icon: 'calendar-x' },
  EXCLUSIVE_CONTENT: { label: 'Contenido exclusivo', icon: 'sparkles' },
  TWO_ACCOUNTS: { label: 'Hasta 2 cuentas', icon: 'users' },
  FOUR_ACCOUNTS: { label: 'Hasta 4 cuentas', icon: 'users' },
};

/** Spanish label for a billing interval (singular). */
export const INTERVAL_LABEL: Record<PlanInterval, string> = {
  DAY: 'día',
  WEEK: 'semana',
  MONTH: 'mes',
  YEAR: 'año',
};

/** Display metadata for a subscription state: label + tone token. */
export const STATE_META: Record<
  SubscriptionState,
  { label: string; dot: string; text: string; bg: string }
> = {
  ACTIVE: { label: 'Activa', dot: 'bg-dot-green', text: 'text-dot-green', bg: 'bg-dot-green/10' },
  PENDIG: { label: 'Pendiente', dot: 'bg-dot-yellow', text: 'text-dot-yellow', bg: 'bg-dot-yellow/10' },
  SUSPENDED: { label: 'Suspendida', dot: 'bg-destructive', text: 'text-destructive', bg: 'bg-destructive/10' },
  CANCELED: { label: 'Cancelada', dot: 'bg-muted-foreground', text: 'text-soft', bg: 'bg-surface-3' },
  EXPIRED: { label: 'Expirada', dot: 'bg-muted-dim', text: 'text-dim', bg: 'bg-surface-3' },
};

/** Mock plans for the pricing page. */
export const PLANS: Plan[] = [
  {
    planId: 1,
    planName: 'Free',
    price: 0,
    interval: 'MONTH',
    duration: 1,
    description: 'Lo esencial para empezar a escuchar.',
    features: ['LYRICS', 'CUSTOM_PLAYLISTS'],
    freeTrial: false,
    durationFreeTrial: 0,
    isActive: true,
  },
  {
    planId: 2,
    planName: 'Premium',
    price: 19.99,
    interval: 'MONTH',
    duration: 1,
    description: 'Música sin anuncios, en alta calidad y sin conexión.',
    features: [
      'NO_ADS',
      'PREMIUM_ACCOUNT',
      'HIGH_QUALITY',
      'OFFLINE_MODE',
      'LYRICS',
      'CUSTOM_PLAYLISTS',
      'CANCEL_ANYTIME',
    ],
    freeTrial: true,
    durationFreeTrial: 7,
    isActive: true,
    popular: true,
  },
  {
    planId: 3,
    planName: 'Family',
    price: 29.99,
    interval: 'MONTH',
    duration: 1,
    description: 'Todo Premium, para hasta cuatro personas.',
    features: [
      'NO_ADS',
      'FOUR_ACCOUNTS',
      'HIGH_QUALITY',
      'OFFLINE_MODE',
      'LYRICS',
      'EXCLUSIVE_CONTENT',
      'CUSTOM_PLAYLISTS',
      'CANCEL_ANYTIME',
    ],
    freeTrial: true,
    durationFreeTrial: 7,
    isActive: true,
  },
];

/** Mock current subscription (Premium, active). Set to `null` to preview the empty state. */
export const CURRENT_SUBSCRIPTION: Subscription | null = {
  idSuscripcion: 1,
  idPlan: 2,
  estado: 'ACTIVE',
  fechaInicio: '2026-06-01T00:00:00',
  fechaRenovacion: '2026-07-01T00:00:00',
  fechaCancelacion: null,
};
