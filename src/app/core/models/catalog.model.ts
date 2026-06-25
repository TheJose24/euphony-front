/** Presentation models for the Browse catalog (artists & albums). */

/** Artist tile rendered in the Browse grid. */
export interface ArtistTile {
  id: number;
  name: string;
  country: string;
  verified: boolean;
  /** First letter of the name, used for the placeholder avatar. */
  initial: string;
}

/** Album tile rendered in the Browse grid. */
export interface AlbumTile {
  id: number;
  title: string;
  artist: string;
  /** Resolved cover URL, or null to show a placeholder. */
  cover: string | null;
  /** Release year (YYYY) or null. */
  year: string | null;
}
