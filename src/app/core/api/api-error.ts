import { HttpErrorResponse } from '@angular/common/http';

/**
 * Normalised API error.
 *
 * The backend returns two different error shapes (see API_ENDPOINTS.md §3):
 *  - **Validation** → a JSON object `{ field: message }` (HTTP 400).
 *  - **Business / domain** → a plain-text string in the body.
 *
 * `fieldErrors` is populated only for the validation case so forms can map
 * messages back to their inputs.
 */
export interface ApiError {
  status: number;
  message: string;
  fieldErrors?: Record<string, string>;
}

/** Collapse a raw `HttpErrorResponse` into the app's `ApiError` shape. */
export function toApiError(err: HttpErrorResponse): ApiError {
  // Status 0 → request never reached the server (network down, CORS, server off).
  if (err.status === 0) {
    return { status: 0, message: 'No se pudo conectar con el servidor.' };
  }

  const body = err.error;

  // Validation errors: a plain `{ field: message }` object.
  if (body && typeof body === 'object' && !Array.isArray(body)) {
    const fieldErrors = body as Record<string, string>;
    const message = Object.values(fieldErrors).join(' ') || `Error ${err.status}`;
    return { status: err.status, message, fieldErrors };
  }

  // Business errors: the body is a plain string.
  if (typeof body === 'string' && body.trim()) {
    return { status: err.status, message: body };
  }

  return { status: err.status, message: err.message || `Error ${err.status}` };
}
