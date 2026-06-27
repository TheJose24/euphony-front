import { Injectable, signal } from '@angular/core';

export type ToastType = 'success' | 'error' | 'info';

export interface Toast {
  readonly id: number;
  readonly message: string;
  readonly type: ToastType;
}

/**
 * Global, signal-based toast queue. Root singleton: inject it anywhere and call
 * `success` / `error` / `info`. The `<app-toast-container>` (mounted once in the
 * root component) renders `toasts()` and auto-dismisses each after its duration.
 */
@Injectable({ providedIn: 'root' })
export class ToastService {
  private readonly _toasts = signal<readonly Toast[]>([]);
  readonly toasts = this._toasts.asReadonly();

  private seq = 0;
  private readonly timers = new Map<number, ReturnType<typeof setTimeout>>();

  /** Queue a toast. `duration <= 0` keeps it until dismissed manually. Returns its id. */
  show(message: string, type: ToastType = 'info', duration = 4000): number {
    const id = ++this.seq;
    this._toasts.update((list) => [...list, { id, message, type }]);
    if (duration > 0) {
      this.timers.set(
        id,
        setTimeout(() => this.dismiss(id), duration),
      );
    }
    return id;
  }

  success(message: string, duration?: number): number {
    return this.show(message, 'success', duration);
  }

  /** Errors linger a little longer by default so they're not missed. */
  error(message: string, duration = 6000): number {
    return this.show(message, 'error', duration);
  }

  info(message: string, duration?: number): number {
    return this.show(message, 'info', duration);
  }

  dismiss(id: number): void {
    const timer = this.timers.get(id);
    if (timer) {
      clearTimeout(timer);
      this.timers.delete(id);
    }
    this._toasts.update((list) => list.filter((t) => t.id !== id));
  }
}
