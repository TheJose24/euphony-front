/**
 * Auth DTOs — `/api/auth` (see API_ENDPOINTS.md §6.0). The backend issues its own
 * JWT (HS256): a short-lived `accessToken` (Bearer on `/api/v1/**`) and a long-lived
 * `refreshToken` (only for `POST /api/auth/refresh`).
 */

/** `POST /login` — sign in by username **or** email. */
export interface LoginRequestDTO {
  usernameOrEmail: string; // username or email
  password: string;
}

/** `POST /register` — create an account (role `user_client_role`) and auto-login. */
export interface RegisterRequestDTO {
  username: string; // 3-20 chars
  email: string; // valid email
  password: string; // min 8 chars
  firstName: string;
  lastName: string;
}

/** `POST /refresh` — exchange a valid refresh token for a fresh token pair. */
export interface RefreshTokenRequestDTO {
  refreshToken: string;
}

/** Response shared by `/register`, `/login` and `/refresh`. */
export interface AuthResponseDTO {
  tokenType: string; // "Bearer"
  accessToken: string;
  refreshToken: string;
  expiresIn: number; // accessToken validity, in seconds
  userId: string; // user UUID
  username: string;
  roles: string[];
}
