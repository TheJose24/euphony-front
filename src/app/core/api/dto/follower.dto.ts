/**
 * DTOs for the Followers module (`/api/v1/followers`).
 * See docs_backend/API_ENDPOINTS.md §6.4.
 */

/** Body for POST `/follow` and DELETE `/unfollow`. */
export interface FollowersArtistRequestDTO {
  userId: string; // UUID
  artistId: number; // Long
}

/** Response for the `by-user` / `by-artist` listings. */
export interface FollowersArtistResponseDTO {
  userId: string;
  userName: string;
  artistId: number;
  artistName: string;
  followDate: string;
}
