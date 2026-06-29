/**
 * Data Transfer Objects for the Songs module (`/api/v1/songs`).
 * Field names and shapes mirror the backend exactly — see docs_backend/API_ENDPOINTS.md §6.6.
 */

/** One time-stamped lyric line. `timeMs` is the line's start in milliseconds. */
export interface LyricLineDTO {
  timeMs: number;
  text: string;
}

/** Response body for GET `/all` and GET `/search/{id}`. */
export interface SongResponseDTO {
  songId: number;
  artistId: number;
  artistName: string;
  albumId: number | null;
  albumTitle: string | null;
  albumCover: string | null; // album artwork, used as fallback when coverImg is null
  title: string;
  coverImg: string | null;
  duration: string; // "HH:mm:ss"
  language: string | null;
  lyrics: string | null;
  /**
   * Time-synced lyrics, ascending by `timeMs`. `null` when the song has none (e.g.
   * instrumentals) → fall back to plain `lyrics`. Additive; does not replace `lyrics`.
   */
  syncedLyrics: LyricLineDTO[] | null;
  releaseDate: string | null; // "yyyy-MM-dd"
  filePath: string | null;
  averageRating: number | null;
  numberOfPlays: number | null;
  genres: string[];
}

/** JSON part (`songRequest`) sent with POST `/create` and PUT `/update/{id}`. */
export interface SongRequestDTO {
  title: string;
  artist: string;
  album: string;
  releaseDate: string;
  language: string;
  duration: string; // "HH:mm:ss"
  genres: string[];
  lyrics: string;
  albumCoverPath: string;
}

/** Response body for POST `/analyze` (metadata extracted from an audio file). */
export interface SongMetadataResponseDTO {
  title: string;
  artist: string;
  album: string;
  releaseDate: string;
  duration: string;
  genres: string[];
  lyrics: string;
  filePath: string;
  albumCoverPath: string;
}
