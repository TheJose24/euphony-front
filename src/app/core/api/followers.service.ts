import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { environment } from '@env/environment';
import { FollowersArtistRequestDTO, FollowersArtistResponseDTO } from './dto/follower.dto';

/**
 * Client for the Followers module — `/api/v1/followers`.
 * A user follows artists. Follow/unfollow are idempotent and return no body
 * (`DELETE /unfollow` carries a JSON body, as the backend implements it).
 */
@Injectable({ providedIn: 'root' })
export class FollowersService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/api/v1/followers`;

  /** POST `/follow` — follow an artist (201, no body). */
  follow(userId: string, artistId: number): Observable<void> {
    const body: FollowersArtistRequestDTO = { userId, artistId };
    return this.http.post<void>(`${this.base}/follow`, body);
  }

  /** DELETE `/unfollow` — unfollow an artist (200, no body; request carries a JSON body). */
  unfollow(userId: string, artistId: number): Observable<void> {
    const body: FollowersArtistRequestDTO = { userId, artistId };
    return this.http.delete<void>(`${this.base}/unfollow`, { body });
  }

  /** GET `/by-user/{userId}` — artists the user follows. */
  getByUser(userId: string): Observable<FollowersArtistResponseDTO[]> {
    return this.http
      .get<FollowersArtistResponseDTO[] | null>(`${this.base}/by-user/${userId}`)
      .pipe(map((list) => list ?? []));
  }

  /** GET `/by-artist/{artistId}` — the artist's followers. */
  getByArtist(artistId: number): Observable<FollowersArtistResponseDTO[]> {
    return this.http
      .get<FollowersArtistResponseDTO[] | null>(`${this.base}/by-artist/${artistId}`)
      .pipe(map((list) => list ?? []));
  }
}
