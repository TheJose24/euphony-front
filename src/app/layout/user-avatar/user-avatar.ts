import { ChangeDetectionStrategy, Component, ElementRef, HostListener, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { LucideAngularModule } from 'lucide-angular';
import { AuthStore } from '@core/state/auth.store';
import { ProfileStore } from '@core/state/profile.store';

/**
 * Top-bar avatar. Shows the signed-in user (with their real profile photo) and opens a
 * small menu to view the profile or sign out. Closes on outside click or Escape.
 */
@Component({
  selector: 'app-user-avatar',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [LucideAngularModule, RouterLink],
  templateUrl: './user-avatar.html',
})
export class UserAvatar {
  private readonly auth = inject(AuthStore);
  private readonly profile = inject(ProfileStore);
  private readonly host = inject(ElementRef<HTMLElement>);

  protected readonly avatar = this.profile.avatar;
  protected readonly username = this.auth.user;
  /** First letter for the fallback badge / aria label when there's no photo. */
  protected readonly initial = computed(() => this.username().charAt(0).toUpperCase() || 'U');
  protected readonly open = signal(false);

  toggle(): void {
    this.open.update((v) => !v);
  }

  logout(): void {
    this.open.set(false);
    this.auth.logout();
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (this.open() && !this.host.nativeElement.contains(event.target)) this.open.set(false);
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    this.open.set(false);
  }
}
