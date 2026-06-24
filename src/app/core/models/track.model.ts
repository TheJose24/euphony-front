/** A single playable track shown in tables, the player bar and the player page. */
export interface Track {
  id: string;
  title: string;
  artist: string;
  album: string;
  cover: string;
  dateAdded: string;
  duration: string;
}

/** Card item used in the right-hand "Favorite Album / Music" panel. */
export interface FavoriteItem {
  title: string;
  followers: string;
  cover: string;
}
