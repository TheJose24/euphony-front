import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { authInterceptor } from './auth.interceptor';
import { AuthStore } from '@core/state/auth.store';
import { AuthResponseDTO } from './dto/auth.dto';

const REFRESHED: AuthResponseDTO = {
  tokenType: 'Bearer',
  accessToken: 'fresh-token',
  refreshToken: 'r2',
  expiresIn: 3600,
  userId: 'u',
  username: 'n',
  roles: [],
};

function configure(authMock: Partial<AuthStore>) {
  TestBed.configureTestingModule({
    providers: [
      provideHttpClient(withInterceptors([authInterceptor])),
      provideHttpClientTesting(),
      { provide: AuthStore, useValue: authMock },
    ],
  });
  return {
    http: TestBed.inject(HttpClient),
    httpMock: TestBed.inject(HttpTestingController),
  };
}

describe('authInterceptor', () => {
  beforeEach(() => TestBed.resetTestingModule());

  it('adds the Bearer header to /api/v1 requests when a token exists', () => {
    const { http, httpMock } = configure({ accessToken: () => 'access-1' } as Partial<AuthStore>);
    http.get('/api/v1/songs/all').subscribe();

    const req = httpMock.expectOne('/api/v1/songs/all');
    expect(req.request.headers.get('Authorization')).toBe('Bearer access-1');
    req.flush([]);
    httpMock.verify();
  });

  it('does NOT add the header to /api/auth requests', () => {
    const { http, httpMock } = configure({ accessToken: () => 'access-1' } as Partial<AuthStore>);
    http.post('/api/auth/login', {}).subscribe();

    const req = httpMock.expectOne('/api/auth/login');
    expect(req.request.headers.has('Authorization')).toBe(false);
    req.flush(REFRESHED);
    httpMock.verify();
  });

  it('sends no header when there is no token', () => {
    const { http, httpMock } = configure({ accessToken: () => null } as Partial<AuthStore>);
    http.get('/api/v1/songs/all').subscribe();

    const req = httpMock.expectOne('/api/v1/songs/all');
    expect(req.request.headers.has('Authorization')).toBe(false);
    req.flush([]);
    httpMock.verify();
  });

  it('refreshes and retries once on a 401, using the new token', () => {
    const refreshSession = vi.fn().mockReturnValue(of(REFRESHED));
    const { http, httpMock } = configure({
      accessToken: () => 'stale-token',
      refreshSession,
    } as unknown as Partial<AuthStore>);

    let result: unknown;
    http.get('/api/v1/favorites/songs/by-user/u').subscribe((r) => (result = r));

    // First attempt carries the stale token and fails with 401.
    const first = httpMock.expectOne((r) => r.headers.get('Authorization') === 'Bearer stale-token');
    first.flush('expired', { status: 401, statusText: 'Unauthorized' });

    // Interceptor refreshes, then retries with the new token.
    expect(refreshSession).toHaveBeenCalledTimes(1);
    const retry = httpMock.expectOne((r) => r.headers.get('Authorization') === 'Bearer fresh-token');
    retry.flush([{ id: 1 }]);

    expect(result).toEqual([{ id: 1 }]);
    httpMock.verify();
  });
});
