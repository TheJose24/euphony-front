import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { environment } from '@env/environment';
import { AlbumRequestDTO, AlbumResponseDTO } from './dto/album.dto';

/**
 * Client for the Albums module — `/api/v1/albums`.
 * Mutations are multipart (JSON part + optional cover file) and the backend
 * answers them with a plain-text message, hence `responseType: 'text'`.
 */
@Injectable({ providedIn: 'root' })
export class AlbumsService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/api/v1/albums`;

  /** GET `/all` — every album (coalesces a `204`/null body to `[]`). */
  getAll(): Observable<AlbumResponseDTO[]> {
    return this.http.get<AlbumResponseDTO[] | null>(`${this.base}/all`).pipe(map((list) => list ?? []));
  }

  /** GET `/search/by-name/{name}` — one album by title. */
  getByName(name: string): Observable<AlbumResponseDTO> {
    return this.http.get<AlbumResponseDTO>(`${this.base}/search/by-name/${encodeURIComponent(name)}`);
  }

  /** GET `/search/by-artist/{artist}` — albums of an artist (by artist name). */
  getByArtist(artist: string): Observable<AlbumResponseDTO[]> {
    return this.http
      .get<AlbumResponseDTO[] | null>(`${this.base}/search/by-artist/${encodeURIComponent(artist)}`)
      .pipe(map((list) => list ?? []));
  }

  /** GET `/search/by-id/{id}` — one album by numeric id. */
  getById(id: number): Observable<AlbumResponseDTO> {
    return this.http.get<AlbumResponseDTO>(`${this.base}/search/by-id/${id}`);
  }

  /** POST `/create` — multipart: JSON metadata + optional cover image. Returns a text message. */
  create(album: AlbumRequestDTO, coverImage?: File): Observable<string> {
    return this.http.post(`${this.base}/create`, this.toFormData(album, coverImage), {
      responseType: 'text',
    });
  }

  /** PUT `/update/{id}` — multipart: JSON metadata + optional cover image. Returns a text message. */
  update(id: number, album: AlbumRequestDTO, coverImage?: File): Observable<string> {
    return this.http.put(`${this.base}/update/${id}`, this.toFormData(album, coverImage), {
      responseType: 'text',
    });
  }

  /** DELETE `/delete/{id}`. Returns a text message. */
  delete(id: number): Observable<string> {
    return this.http.delete(`${this.base}/delete/${id}`, { responseType: 'text' });
  }

  /** Build the multipart body: JSON part as an `application/json` Blob + optional file. */
  private toFormData(album: AlbumRequestDTO, coverImage?: File): FormData {
    const fd = new FormData();
    fd.append('albumRequestDTO', new Blob([JSON.stringify(album)], { type: 'application/json' }));
    if (coverImage) fd.append('coverImage', coverImage);
    return fd;
  }
}
