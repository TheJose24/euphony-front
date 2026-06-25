import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { environment } from '@env/environment';
import { ArtistRequestDTO, ArtistResponseDTO } from './dto/artist.dto';

/** Client for the Artists module — `/api/v1/artists`. */
@Injectable({ providedIn: 'root' })
export class ArtistsService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/api/v1/artists`;

  /** GET `/all` — every artist (coalesces a `204`/null body to `[]`). */
  getAll(): Observable<ArtistResponseDTO[]> {
    return this.http.get<ArtistResponseDTO[] | null>(`${this.base}/all`).pipe(map((list) => list ?? []));
  }

  /** GET `/search/{name}` — one artist by name (not id). */
  getByName(name: string): Observable<ArtistResponseDTO> {
    return this.http.get<ArtistResponseDTO>(`${this.base}/search/${encodeURIComponent(name)}`);
  }

  /**
   * Resolve an artist by numeric id. The backend exposes no by-id endpoint, so this
   * filters the full list client-side; emits `undefined` when not found.
   */
  getById(id: number): Observable<ArtistResponseDTO | undefined> {
    return this.getAll().pipe(map((list) => list.find((a) => a.idArtist === id)));
  }

  /** POST `/create`. */
  create(artist: ArtistRequestDTO): Observable<ArtistResponseDTO> {
    return this.http.post<ArtistResponseDTO>(`${this.base}/create`, artist);
  }

  /** PUT `/update/{id}`. */
  update(id: number, artist: ArtistRequestDTO): Observable<ArtistResponseDTO> {
    return this.http.put<ArtistResponseDTO>(`${this.base}/update/${id}`, artist);
  }

  /** DELETE `/delete/{id}`. */
  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/delete/${id}`);
  }
}
