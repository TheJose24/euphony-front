import { ArtistResponseDTO } from './artist.dto';

/**
 * DTOs for the Albums module (`/api/v1/albums`).
 * See docs_backend/API_ENDPOINTS.md §6.5.
 */

/** JSON part (`albumRequestDTO`) sent with the multipart POST `/create` and PUT `/update/{id}`. */
export interface AlbumRequestDTO {
  idArtist: number;
  title: string;
  releaseDate?: string; // "yyyy-MM-dd"
  cover?: string; // URL alternative to uploading a `coverImage` file
}

/**
 * Response body for the GET endpoints.
 * NOTE: the backend serialises this DTO with Spanish field names.
 */
export interface AlbumResponseDTO {
  idAlbum: number;
  artista: ArtistResponseDTO;
  titulo: string;
  fechaLanzamiento: string | null;
  portada: string | null;
}
