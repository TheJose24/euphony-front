import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { environment } from '@env/environment';
import { SongResponseDTO } from './dto/song.dto';
import {
  PlaylistRequestDTO,
  PlaylistResponseDTO,
  PlaylistSongRequestDTO,
} from './dto/playlist.dto';

/**
 * Client for the Playlists module — `/api/v1/playlists`.
 * Playlist CRUD plus song management. `GET /{id}/songs` returns the same enriched
 * `SongResponseDTO` as `/songs/all`; add/remove are idempotent and return no body.
 */
@Injectable({ providedIn: 'root' })
export class PlaylistsService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/api/v1/playlists`;

  /** GET `/all`. */
  getAll(): Observable<PlaylistResponseDTO[]> {
    return this.http
      .get<PlaylistResponseDTO[] | null>(`${this.base}/all`)
      .pipe(map((list) => list ?? []));
  }

  /** GET `/user/{userId}` — the user's playlists. */
  getByUser(userId: string): Observable<PlaylistResponseDTO[]> {
    return this.http
      .get<PlaylistResponseDTO[] | null>(`${this.base}/user/${userId}`)
      .pipe(map((list) => list ?? []));
  }

  /** GET `/search/{id}` — one playlist by id. */
  getById(id: number): Observable<PlaylistResponseDTO> {
    return this.http.get<PlaylistResponseDTO>(`${this.base}/search/${id}`);
  }

  /** POST `/create`. */
  create(body: PlaylistRequestDTO): Observable<void> {
    return this.http.post<void>(`${this.base}/create`, body);
  }

  /** PUT `/update/{id}`. */
  update(id: number, body: PlaylistRequestDTO): Observable<void> {
    return this.http.put<void>(`${this.base}/update/${id}`, body);
  }

  /** DELETE `/delete/{id}`. */
  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/delete/${id}`);
  }

  /** GET `/{id}/songs` — the playlist's songs (enriched, insertion order). */
  getSongs(id: number): Observable<SongResponseDTO[]> {
    return this.http
      .get<SongResponseDTO[] | null>(`${this.base}/${id}/songs`)
      .pipe(map((list) => list ?? []));
  }

  /** POST `/{id}/songs` — add a song (idempotent). */
  addSong(id: number, songId: number): Observable<void> {
    const body: PlaylistSongRequestDTO = { songId };
    return this.http.post<void>(`${this.base}/${id}/songs`, body);
  }

  /** DELETE `/{id}/songs/{songId}` — remove a song (idempotent). */
  removeSong(id: number, songId: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/${id}/songs/${songId}`);
  }
}
