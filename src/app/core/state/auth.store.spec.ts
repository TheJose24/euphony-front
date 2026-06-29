import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { Subject, of, throwError } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AuthStore } from './auth.store';
import { AuthService } from '@core/api/auth.service';
import { AuthResponseDTO } from '@core/api/dto/auth.dto';

const STORAGE_KEY = 'euphony.auth';

/** In-memory `localStorage` — the test runner's environment doesn't provide one. */
class MemoryStorage implements Storage {
  private readonly map = new Map<string, string>();
  get length(): number {
    return this.map.size;
  }
  clear(): void {
    this.map.clear();
  }
  getItem(key: string): string | null {
    return this.map.has(key) ? this.map.get(key)! : null;
  }
  key(index: number): string | null {
    return [...this.map.keys()][index] ?? null;
  }
  removeItem(key: string): void {
    this.map.delete(key);
  }
  setItem(key: string, value: string): void {
    this.map.set(key, String(value));
  }
}
vi.stubGlobal('localStorage', new MemoryStorage());

const RESPONSE: AuthResponseDTO = {
  tokenType: 'Bearer',
  accessToken: 'access-1',
  refreshToken: 'refresh-1',
  expiresIn: 3600,
  userId: 'uuid-123',
  username: 'johndoe',
  roles: ['user_client_role'],
};

function setup(authServiceMock: Partial<AuthService> = {}) {
  const router = { navigate: vi.fn() };
  TestBed.configureTestingModule({
    providers: [
      { provide: AuthService, useValue: authServiceMock },
      { provide: Router, useValue: router },
    ],
  });
  return { router, store: () => TestBed.inject(AuthStore) };
}

describe('AuthStore', () => {
  beforeEach(() => {
    localStorage.clear();
    TestBed.resetTestingModule();
  });

  it('starts signed out when storage is empty', () => {
    const { store } = setup();
    const s = store();
    expect(s.isAuthed()).toBe(false);
    expect(s.userId()).toBe('');
    expect(s.user()).toBe('');
    expect(s.accessToken()).toBeNull();
  });

  it('restores a persisted session at construction', () => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        accessToken: 'a',
        refreshToken: 'r',
        userId: 'uuid-9',
        username: 'restored',
        roles: ['user_client_role'],
      }),
    );
    const { store } = setup();
    const s = store();
    expect(s.isAuthed()).toBe(true);
    expect(s.userId()).toBe('uuid-9');
    expect(s.user()).toBe('restored');
    expect(s.accessToken()).toBe('a');
  });

  it('ignores a malformed/incomplete persisted session', () => {
    localStorage.setItem(STORAGE_KEY, '{ not json');
    expect(setup().store().isAuthed()).toBe(false);

    TestBed.resetTestingModule();
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ accessToken: 'a' })); // missing fields
    expect(setup().store().isAuthed()).toBe(false);
  });

  it('login() stores the session and persists it', () => {
    const login = vi.fn().mockReturnValue(of(RESPONSE));
    const { store } = setup({ login });
    const s = store();

    let emitted = false;
    s.login('johndoe', 'password123').subscribe(() => (emitted = true));

    expect(login).toHaveBeenCalledWith({ usernameOrEmail: 'johndoe', password: 'password123' });
    expect(emitted).toBe(true);
    expect(s.isAuthed()).toBe(true);
    expect(s.userId()).toBe('uuid-123');
    expect(s.roles()).toEqual(['user_client_role']);
    expect(JSON.parse(localStorage.getItem(STORAGE_KEY)!).accessToken).toBe('access-1');
  });

  it('register() stores the session and persists it', () => {
    const register = vi.fn().mockReturnValue(of(RESPONSE));
    const { store } = setup({ register });
    const s = store();

    const body = {
      username: 'johndoe',
      email: 'j@x.com',
      password: 'password123',
      firstName: 'John',
      lastName: 'Doe',
    };
    s.register(body).subscribe();

    expect(register).toHaveBeenCalledWith(body);
    expect(s.isAuthed()).toBe(true);
    expect(s.user()).toBe('johndoe');
  });

  it('logout() clears the session, storage and navigates to /login', () => {
    const { store, router } = setup({ login: vi.fn().mockReturnValue(of(RESPONSE)) });
    const s = store();
    s.login('johndoe', 'password123').subscribe();
    expect(s.isAuthed()).toBe(true);

    s.logout();

    expect(s.isAuthed()).toBe(false);
    expect(s.userId()).toBe('');
    expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
    expect(router.navigate).toHaveBeenCalledWith(['/login']);
  });

  it('refreshSession() shares a single in-flight request for concurrent callers', () => {
    const subject = new Subject<AuthResponseDTO>();
    const refresh = vi.fn().mockReturnValue(subject.asObservable());
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ accessToken: 'a', refreshToken: 'r', userId: 'u', username: 'n', roles: [] }),
    );
    const { store } = setup({ refresh });
    const s = store();

    s.refreshSession().subscribe();
    s.refreshSession().subscribe();
    expect(refresh).toHaveBeenCalledTimes(1);
    expect(refresh).toHaveBeenCalledWith('r');

    subject.next(RESPONSE);
    subject.complete();
    expect(s.accessToken()).toBe('access-1');

    // A new refresh after completion issues a fresh request.
    s.refreshSession().subscribe();
    expect(refresh).toHaveBeenCalledTimes(2);
  });

  it('refreshSession() errors when there is no refresh token', () => {
    const { store } = setup();
    let status: number | undefined;
    store()
      .refreshSession()
      .subscribe({ error: (e) => (status = e.status) });
    expect(status).toBe(401);
  });

  it('refreshSession() clears the session when the refresh fails', () => {
    const refresh = vi.fn().mockReturnValue(throwError(() => ({ status: 401, message: 'nope' })));
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ accessToken: 'a', refreshToken: 'r', userId: 'u', username: 'n', roles: [] }),
    );
    const { store } = setup({ refresh });
    const s = store();

    s.refreshSession().subscribe({ error: () => undefined });

    expect(s.isAuthed()).toBe(false);
    expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
  });
});
