import { HttpErrorResponse, HttpInterceptorFn, HttpRequest } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, switchMap, throwError } from 'rxjs';
import { AuthStore } from '@core/state/auth.store';

/** Clone a request adding the `Authorization: Bearer` header. */
function withBearer<T>(req: HttpRequest<T>, token: string): HttpRequest<T> {
  return req.clone({ setHeaders: { Authorization: `Bearer ${token}` } });
}

/**
 * Attaches the access token to `/api/v1/**` requests and transparently refreshes it.
 *
 * Auth endpoints (`/api/auth/**`) are left untouched (they're public and issue the
 * tokens). On a 401 from a protected call, it asks `AuthStore` for a fresh token pair
 * (a single shared `/refresh`), then retries the original request once. If the refresh
 * fails the user is signed out.
 *
 * Note: the API is currently `permitAll` server-side, so the 401/refresh path is dormant
 * until security is switched on — but the Bearer header is already sent as documented.
 */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthStore);

  // Never decorate the auth calls themselves.
  if (req.url.includes('/api/auth/')) return next(req);

  const token = auth.accessToken();
  const authed = token ? withBearer(req, token) : req;

  // Only protected resources need the refresh-on-401 dance.
  if (!req.url.includes('/api/v1/')) return next(authed);

  return next(authed).pipe(
    catchError((err: HttpErrorResponse) => {
      if (err.status !== 401 || !token) return throwError(() => err);
      return auth.refreshSession().pipe(
        switchMap((res) => next(withBearer(req, res.accessToken))),
        catchError(() => {
          auth.logout();
          return throwError(() => err);
        }),
      );
    }),
  );
};
