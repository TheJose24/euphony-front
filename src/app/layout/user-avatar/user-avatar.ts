import { ChangeDetectionStrategy, Component, ElementRef, HostListener, computed, inject, signal } from '@angular/core';
import { LucideAngularModule } from 'lucide-angular';
import { AVATAR } from '@core/data/tracks.data';
import { AuthStore } from '@core/state/auth.store';

/**
 * Top-bar avatar. Shows the signed-in user and opens a small menu to sign out.
 * Closes on outside click or Escape.
 */
@Component({
  selector: 'app-user-avatar',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [LucideAngularModule],
  templateUrl: './user-avatar.html',
})
export class UserAvatar {
  private readonly auth = inject(AuthStore);
  private readonly host = inject(ElementRef<HTMLElement>);

  protected readonly avatar = AVATAR;
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
