import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { environment } from '@env/environment';
import { SongResponseDTO } from './dto/song.dto';
import { AlbumResponseDTO } from './dto/album.dto';
import { FavoriteAlbumRequestDTO, FavoriteSongRequestDTO } from './dto/favorite.dto';

/**
 * Client for the Favorites module — `/api/v1/favorites`.
 * Per-user liked songs and favorite albums. Like/unlike are idempotent and
 * return no body. Every call needs the logged-in user's UUID (`userId`).
 */
@Injectable({ providedIn: 'root' })
export class FavoritesService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/api/v1/favorites`;

  /** POST `/songs` — like a song (idempotent → 201, no body). */
  likeSong(userId: string, songId: number): Observable<void> {
    const body: FavoriteSongRequestDTO = { userId, songId };
    return this.http.post<void>(`${this.base}/songs`, body);
  }

  /** DELETE `/songs` — remove a like (idempotent → 200, no body). */
  unlikeSong(userId: string, songId: number): Observable<void> {
    const body: FavoriteSongRequestDTO = { userId, songId };
    return this.http.delete<void>(`${this.base}/songs`, { body });
  }

  /** GET `/songs/by-user/{userId}` — the user's liked songs (enriched `SongResponseDTO`). */
  getLikedSongs(userId: string): Observable<SongResponseDTO[]> {
    return this.http
      .get<SongResponseDTO[] | null>(`${this.base}/songs/by-user/${userId}`)
      .pipe(map((list) => list ?? []));
  }

  /** POST `/albums` — favorite an album (idempotent → 201, no body). */
  favoriteAlbum(userId: string, albumId: number): Observable<void> {
    const body: FavoriteAlbumRequestDTO = { userId, albumId };
    return this.http.post<void>(`${this.base}/albums`, body);
  }

  /** DELETE `/albums` — remove an album favorite (idempotent → 200, no body). */
  unfavoriteAlbum(userId: string, albumId: number): Observable<void> {
    const body: FavoriteAlbumRequestDTO = { userId, albumId };
    return this.http.delete<void>(`${this.base}/albums`, { body });
  }

  /** GET `/albums/by-user/{userId}` — the user's favorite albums. */
  getFavoriteAlbums(userId: string): Observable<AlbumResponseDTO[]> {
    return this.http
      .get<AlbumResponseDTO[] | null>(`${this.base}/albums/by-user/${userId}`)
      .pipe(map((list) => list ?? []));
  }
}
