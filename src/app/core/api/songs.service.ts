import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { environment } from '@env/environment';
import { SongMetadataResponseDTO, SongRequestDTO, SongResponseDTO } from './dto/song.dto';

/**
 * Client for the Songs module — `/api/v1/songs`.
 * Multipart endpoints purposely do NOT set `Content-Type`: the browser adds the
 * `boundary` automatically, and JSON parts are sent as `application/json` Blobs.
 */
@Injectable({ providedIn: 'root' })
export class SongsService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/api/v1/songs`;

  /** GET `/all` — every song. The backend answers `204` (null) when empty → coalesce to `[]`. */
  getAll(): Observable<SongResponseDTO[]> {
    return this.http.get<SongResponseDTO[] | null>(`${this.base}/all`).pipe(map((list) => list ?? []));
  }

  /** GET `/search/{id}` — a single song by numeric id. */
  getById(id: number): Observable<SongResponseDTO> {
    return this.http.get<SongResponseDTO>(`${this.base}/search/${id}`);
  }

  /** GET `/search/by-album/{albumId}` — songs of an album (enriched DTO, no N+1). */
  getByAlbum(albumId: number): Observable<SongResponseDTO[]> {
    return this.http
      .get<SongResponseDTO[] | null>(`${this.base}/search/by-album/${albumId}`)
      .pipe(map((list) => list ?? []));
  }

  /** GET `/search/by-artist/{artistId}` — songs of an artist (enriched DTO, no N+1). */
  getByArtist(artistId: number): Observable<SongResponseDTO[]> {
    return this.http
      .get<SongResponseDTO[] | null>(`${this.base}/search/by-artist/${artistId}`)
      .pipe(map((list) => list ?? []));
  }

  /** POST `/analyze` — extract metadata from an audio file without persisting it. */
  analyze(file: File): Observable<SongMetadataResponseDTO> {
    const fd = new FormData();
    fd.append('file', file);
    return this.http.post<SongMetadataResponseDTO>(`${this.base}/analyze`, fd);
  }

  /** POST `/create` — multipart: required audio file + JSON metadata. Returns a text message. */
  create(songFile: File, song: SongRequestDTO): Observable<string> {
    const fd = new FormData();
    fd.append('songFile', songFile);
    fd.append('songRequest', new Blob([JSON.stringify(song)], { type: 'application/json' }));
    return this.http.post(`${this.base}/create`, fd, { responseType: 'text' });
  }

  /**
   * PUT `/update/{id}` — multipart: cover image + JSON metadata.
   * The backend binding requires `coverArt`, so always pass a file.
   */
  update(id: number, coverArt: File, song: SongRequestDTO): Observable<string> {
    const fd = new FormData();
    fd.append('coverArt', coverArt);
    fd.append('songRequest', new Blob([JSON.stringify(song)], { type: 'application/json' }));
    return this.http.put(`${this.base}/update/${id}`, fd, { responseType: 'text' });
  }

  /** DELETE `/delete/{id}`. */
  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/delete/${id}`);
  }

  /**
   * Direct URL for an `<audio>` element — GET `/stream/{id}` (supports HTTP Range).
   * Bind it to the player's `src`; no XHR needed.
   */
  streamUrl(id: number): string {
    return `${environment.apiUrl}/api/v1/songs/stream/${id}`;
  }
}
