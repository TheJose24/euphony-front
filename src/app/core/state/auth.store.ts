import { Injectable, signal } from '@angular/core';

/**
 * Simple authentication state, ported from the React Zustand `useAuth` store.
 * No real backend — login just records a display name and flips a flag.
 */
@Injectable({ providedIn: 'root' })
export class AuthStore {
  private readonly _isAuthed = signal(false);
  private readonly _user = signal('davedirect3');

  readonly isAuthed = this._isAuthed.asReadonly();
  readonly user = this._user.asReadonly();

  login(user: string): void {
    this._user.set(user || 'davedirect3');
    this._isAuthed.set(true);
  }

  logout(): void {
    this._isAuthed.set(false);
  }
}
