import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { catchError, throwError } from 'rxjs';
import { toApiError } from './api-error';

/**
 * Turns every failed request's raw `HttpErrorResponse` into the app's normalised
 * `ApiError`, so callers always receive a consistent `{ status, message, fieldErrors? }`.
 */
export const httpErrorInterceptor: HttpInterceptorFn = (req, next) =>
  next(req).pipe(catchError((err: HttpErrorResponse) => throwError(() => toApiError(err))));
