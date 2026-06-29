import { Injectable, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, catchError, finalize, map, shareReplay, tap, throwError } from 'rxjs';
import { AuthService } from '@core/api/auth.service';
import { AuthResponseDTO, LoginRequestDTO, RegisterRequestDTO } from '@core/api/dto/auth.dto';
import { ApiError } from '@core/api/api-error';

/** Persisted session: the token pair plus the user identity the app reads everywhere. */
interface AuthSession {
  accessToken: string;
  refreshToken: string;
  userId: string;
  username: string;
  roles: string[];
}

const STORAGE_KEY = 'euphony.auth';

/** Read the persisted session synchronously at construction (so a reload stays logged in). */
function restore(): AuthSession | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const s = JSON.parse(raw) as Partial<AuthSession>;
    if (!s.accessToken || !s.refreshToken || !s.userId) return null;
    return {
      accessToken: s.accessToken,
      refreshToken: s.refreshToken,
      userId: s.userId,
      username: s.username ?? '',
      roles: s.roles ?? [],
    };
  } catch {
    return null;
  }
}

/**
 * Real authentication state, backed by the backend's own JWT (`/api/auth`).
 *
 * Holds the session (token pair + user identity), persists it to `localStorage` so a
 * page reload stays signed in, and is the single source of `userId` for every per-user
 * store (favorites, follows, playlists…). The `authInterceptor` reads `accessToken()` to
 * set the `Authorization: Bearer` header and calls `refreshSession()` on a 401.
 */
@Injectable({ providedIn: 'root' })
export class AuthStore {
  private readonly api = inject(AuthService);
  private readonly router = inject(Router);

  private readonly _session = signal<AuthSession | null>(restore());

  /** Whether a user is currently signed in. */
  readonly isAuthed = computed(() => this._session() !== null);
  /** Logged-in user's UUID, or `''` when signed out (per-user stores key off this). */
  readonly userId = computed(() => this._session()?.userId ?? '');
  /** Display username, or `''` when signed out. */
  readonly user = computed(() => this._session()?.username ?? '');
  /** Assigned roles (e.g. `user_client_role`). */
  readonly roles = computed(() => this._session()?.roles ?? []);
  /** Current access token for the `Authorization` header, or `null`. */
  readonly accessToken = computed(() => this._session()?.accessToken ?? null);

  /** In-flight refresh, shared so concurrent 401s trigger a single `/refresh` call. */
  private refreshInFlight: Observable<AuthResponseDTO> | null = null;

  /** Sign in by username or email. Emits once on success; errors as `ApiError`. */
  login(usernameOrEmail: string, password: string): Observable<void> {
    const body: LoginRequestDTO = { usernameOrEmail, password };
    return this.api.login(body).pipe(
      tap((res) => this.setSession(res)),
      map(() => void 0),
    );
  }

  /** Register a new account (backend auto-logs-in and returns a token pair). */
  register(body: RegisterRequestDTO): Observable<void> {
    return this.api.register(body).pipe(
      tap((res) => this.setSession(res)),
      map(() => void 0),
    );
  }

  /** Clear the session and return to the login screen. */
  logout(): void {
    this.clear();
    this.router.navigate(['/login']);
  }

  /**
   * Exchange the refresh token for a fresh pair. Used by the interceptor when an
   * `/api/v1` call returns 401. Shares a single in-flight request and clears the
   * session if the refresh itself fails (the user must sign in again).
   */
  refreshSession(): Observable<AuthResponseDTO> {
    if (this.refreshInFlight) return this.refreshInFlight;

    const token = this._session()?.refreshToken;
    if (!token) {
      return throwError(() => ({ status: 401, message: 'Sesión expirada.' }) as ApiError);
    }

    this.refreshInFlight = this.api.refresh(token).pipe(
      tap((res) => this.setSession(res)),
      catchError((err) => {
        this.clear();
        return throwError(() => err);
      }),
      finalize(() => (this.refreshInFlight = null)),
      shareReplay(1),
    );
    return this.refreshInFlight;
  }

  /** Persist a successful auth response as the active session. */
  private setSession(res: AuthResponseDTO): void {
    const session: AuthSession = {
      accessToken: res.accessToken,
      refreshToken: res.refreshToken,
      userId: res.userId,
      username: res.username,
      roles: res.roles ?? [],
    };
    this._session.set(session);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
    } catch {
      /* storage unavailable (private mode) — session still works in memory */
    }
  }

  /** Drop the session from memory and storage. */
  private clear(): void {
    this._session.set(null);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      /* ignore */
    }
  }
}
