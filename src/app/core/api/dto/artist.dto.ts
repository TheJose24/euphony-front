/**
 * DTOs for the Artists module (`/api/v1/artists`).
 * See docs_backend/API_ENDPOINTS.md §6.3.
 */

/** Request body for POST `/create` and PUT `/update/{id}`. */
export interface ArtistRequestDTO {
  name: string;
  biography?: string;
  country: string;
  /** Free-form map of network → handle, e.g. `{ "Twitter": "@johndoe" }`. */
  socialNetworks?: Record<string, string>;
}

/** Response body for GET `/all` and GET `/search/{name}`. */
export interface ArtistResponseDTO {
  idArtist: number;
  name: string;
  biography: string | null;
  country: string;
  socialNetworks: Record<string, string> | null;
  isVerified: boolean;
}
