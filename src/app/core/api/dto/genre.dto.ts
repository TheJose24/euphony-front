/**
 * DTOs for the Genres module (`/api/v1/genres`).
 * See docs_backend/API_ENDPOINTS.md §6.7.
 */

/** Request body for POST `/create` and PUT `/update/{id}`. */
export interface GenreRequestDTO {
  name: string;
  description: string;
}

/** Response body for GET `/all` and GET `/search/{name}`. */
export interface GenreResponseDTO {
  idGenre: number;
  name: string;
  description: string;
}
