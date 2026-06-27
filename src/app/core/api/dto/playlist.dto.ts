/**
 * DTOs for the Playlists module (`/api/v1/playlists`).
 * See docs_backend/API_ENDPOINTS.md §6.8.
 */

/** Body for POST `/create` and PUT `/update/{id}`. */
export interface PlaylistRequestDTO {
  name: string; // required, 3–255 chars
  description?: string; // optional, max 1000
  isPublic: boolean; // required (default false)
  coverImage?: string; // optional URL (http(s)://…) or empty
  userId: string; // required (owner UUID)
}

/** Body for POST `/{id}/songs` (add a song to a playlist). */
export interface PlaylistSongRequestDTO {
  songId: number;
}

/** Response body for the GET playlist endpoints. */
export interface PlaylistResponseDTO {
  playlistId: number;
  name: string;
  creationDate: string;
  description: string | null;
  isPublic: boolean;
  coverImage: string | null;
  userId: string;
  songCount: number;
}
