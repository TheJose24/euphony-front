/**
 * DTOs for the Favorites module (`/api/v1/favorites`).
 * See docs_backend/API_ENDPOINTS.md §6.11.
 */

/** Body for POST/DELETE `/songs` (like / unlike a song). */
export interface FavoriteSongRequestDTO {
  userId: string; // UUID
  songId: number;
}

/** Body for POST/DELETE `/albums` (favorite / unfavorite an album). */
export interface FavoriteAlbumRequestDTO {
  userId: string; // UUID
  albumId: number;
}
