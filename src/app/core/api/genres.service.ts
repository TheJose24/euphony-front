import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { environment } from '@env/environment';
import { GenreRequestDTO, GenreResponseDTO } from './dto/genre.dto';

/** Client for the Genres module — `/api/v1/genres`. */
@Injectable({ providedIn: 'root' })
export class GenresService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/api/v1/genres`;

  /** GET `/all` — every genre (coalesces a `204`/null body to `[]`). */
  getAll(): Observable<GenreResponseDTO[]> {
    return this.http.get<GenreResponseDTO[] | null>(`${this.base}/all`).pipe(map((list) => list ?? []));
  }

  /** GET `/search/{name}` — one genre by name. */
  getByName(name: string): Observable<GenreResponseDTO> {
    return this.http.get<GenreResponseDTO>(`${this.base}/search/${encodeURIComponent(name)}`);
  }

  /** POST `/create`. */
  create(genre: GenreRequestDTO): Observable<GenreResponseDTO> {
    return this.http.post<GenreResponseDTO>(`${this.base}/create`, genre);
  }

  /** PUT `/update/{id}`. */
  update(id: number, genre: GenreRequestDTO): Observable<GenreResponseDTO> {
    return this.http.put<GenreResponseDTO>(`${this.base}/update/${id}`, genre);
  }

  /** DELETE `/delete/{id}`. */
  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/delete/${id}`);
  }
}
