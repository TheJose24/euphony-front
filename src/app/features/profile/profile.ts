import { ChangeDetectionStrategy, Component, effect, inject, signal } from '@angular/core';
import { LucideAngularModule } from 'lucide-angular';
import { AppLayout } from '@layout/app-layout/app-layout';
import { LoadingState } from '@shared/ui/loading-state/loading-state';
import { ErrorState } from '@shared/ui/error-state/error-state';
import { ProfileStore } from '@core/state/profile.store';
import { AuthStore } from '@core/state/auth.store';

/**
 * Account screen: shows the signed-in user's identity and lets them edit the profile
 * fields (birth date, country, city, phone, avatar path). Reads/writes through
 * `ProfileStore`; the read-only account fields come from the loaded profile or the session.
 */
@Component({
  selector: 'app-profile',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [AppLayout, LucideAngularModule, LoadingState, ErrorState],
  templateUrl: './profile.html',
})
export class Profile {
  protected readonly store = inject(ProfileStore);
  private readonly auth = inject(AuthStore);

  protected readonly query = signal('');
  protected readonly roles = this.auth.roles;

  // Editable form fields, seeded from the loaded profile.
  protected readonly birthDate = signal('');
  protected readonly country = signal('');
  protected readonly city = signal('');
  protected readonly phone = signal('');
  protected readonly imgProfile = signal('');

  constructor() {
    // Keep the form in sync with the store: seeds on load and resets after a save.
    effect(() => {
      const p = this.store.profile();
      if (!p) return;
      this.birthDate.set(p.birthDate ?? '');
      this.country.set(p.country ?? '');
      this.city.set(p.city ?? '');
      this.phone.set(p.phone ?? '');
      this.imgProfile.set(p.imgProfile ?? '');
    });
  }

  /** Pretty role label (`user_client_role` → `Usuario`). */
  roleLabel(role: string): string {
    switch (role) {
      case 'admin_client_role':
        return 'Administrador';
      case 'artist_client_role':
        return 'Artista';
      default:
        return 'Usuario';
    }
  }

  onSubmit(event: Event): void {
    event.preventDefault();
    if (this.store.saving()) return;
    this.store.save({
      birthDate: this.birthDate().trim() || null,
      country: this.country().trim() || null,
      city: this.city().trim() || null,
      phone: this.phone().trim() || null,
      imgProfile: this.imgProfile().trim() || null,
    });
  }
}
