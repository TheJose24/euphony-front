import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '@env/environment';
import {
  AuthResponseDTO,
  LoginRequestDTO,
  RefreshTokenRequestDTO,
  RegisterRequestDTO,
} from './dto/auth.dto';

/**
 * Client for the Authentication module — `/api/auth` (public endpoints).
 * The three calls return the same `AuthResponseDTO` (token pair + user info).
 * Token storage and session state live in `AuthStore`, not here.
 */
@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/api/auth`;

  /** POST `/login` — sign in by username or email (`200`). */
  login(body: LoginRequestDTO): Observable<AuthResponseDTO> {
    return this.http.post<AuthResponseDTO>(`${this.base}/login`, body);
  }

  /** POST `/register` — create an account and auto-login (`201`). */
  register(body: RegisterRequestDTO): Observable<AuthResponseDTO> {
    return this.http.post<AuthResponseDTO>(`${this.base}/register`, body);
  }

  /** POST `/refresh` — swap a refresh token for a new pair (`200`). */
  refresh(refreshToken: string): Observable<AuthResponseDTO> {
    const body: RefreshTokenRequestDTO = { refreshToken };
    return this.http.post<AuthResponseDTO>(`${this.base}/refresh`, body);
  }
}
