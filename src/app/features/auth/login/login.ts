import { ChangeDetectionStrategy, Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import { LucideAngularModule } from 'lucide-angular';
import { AuthStore } from '@core/state/auth.store';
import { ApiError } from '@core/api/api-error';

type Mode = 'login' | 'register';

/**
 * Authentication screen — real backend auth (`/api/auth`). Toggles between **sign in**
 * (username/email + password) and **register** (the full profile), sharing one styled card.
 * Submits through `AuthStore`, surfaces field/business errors and navigates home on success.
 */
@Component({
  selector: 'app-login',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [LucideAngularModule],
  templateUrl: './login.html',
})
export class Login {
  private readonly auth = inject(AuthStore);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly mode = signal<Mode>('login');
  protected readonly isRegister = computed(() => this.mode() === 'register');

  // Form fields (signals so the zoneless view stays in sync).
  protected readonly usernameOrEmail = signal('');
  protected readonly password = signal('');
  protected readonly username = signal('');
  protected readonly email = signal('');
  protected readonly firstName = signal('');
  protected readonly lastName = signal('');

  protected readonly submitting = signal(false);
  /** Top-level error message (business/network), shown above the form. */
  protected readonly error = signal<string | null>(null);
  /** Per-field validation messages from a 400 response. */
  protected readonly fieldErrors = signal<Record<string, string>>({});

  fieldError(field: string): string | undefined {
    return this.fieldErrors()[field];
  }

  /** Switch between sign-in and register, clearing any prior errors. */
  setMode(mode: Mode): void {
    this.mode.set(mode);
    this.error.set(null);
    this.fieldErrors.set({});
  }

  onSubmit(event: Event): void {
    event.preventDefault();
    if (this.submitting()) return;
    this.error.set(null);
    this.fieldErrors.set({});
    this.submitting.set(true);

    const request$ = this.isRegister()
      ? this.auth.register({
          username: this.username().trim(),
          email: this.email().trim(),
          password: this.password(),
          firstName: this.firstName().trim(),
          lastName: this.lastName().trim(),
        })
      : this.auth.login(this.usernameOrEmail().trim(), this.password());

    request$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => this.router.navigate(['/home']),
      error: (err: ApiError) => {
        this.submitting.set(false);
        if (err.fieldErrors) this.fieldErrors.set(err.fieldErrors);
        this.error.set(err.message);
      },
    });
  }
}
