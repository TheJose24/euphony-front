import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '@env/environment';
import { UserProfileRequestDTO, UserProfileResponseDTO } from './dto/user-profile.dto';

/**
 * Client for the User Profile module — `/api/v1/users/profile`.
 * Per-user profile data (birth date, location, phone, avatar path). The account
 * fields (username/email/name) come back denormalised but are not edited here.
 */
@Injectable({ providedIn: 'root' })
export class UserProfileService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/api/v1/users/profile`;

  /** GET `/search/{userId}` — the user's profile (`404` if it doesn't exist yet). */
  getByUser(userId: string): Observable<UserProfileResponseDTO> {
    return this.http.get<UserProfileResponseDTO>(`${this.base}/search/${userId}`);
  }

  /** PUT `/update/{userId}` — update the editable profile fields (`204`, no body). */
  update(userId: string, body: UserProfileRequestDTO): Observable<void> {
    return this.http.put<void>(`${this.base}/update/${userId}`, body);
  }
}
