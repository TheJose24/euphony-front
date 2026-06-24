import { FavoriteItem, Track } from '@core/models/track.model';

/** Album artwork lives under public/assets and is referenced by URL. */
const album1 = 'assets/album1.jpg';
const album2 = 'assets/album2.jpg';
const album3 = 'assets/album3.jpg';
const album4 = 'assets/album4.jpg';
const album5 = 'assets/album5.jpg';

export const PLAY_IT_SAFE_COVER = 'assets/play-it-safe.jpg';
export const CHILL_MIX_COVER = 'assets/chill-mix.jpg';
export const AVATAR = 'assets/avatar.jpg';

export const tracks: Track[] = [
  { id: '1', title: 'Relax and Unwind', artist: 'Lily Moonshadow', album: 'Serene Sounds', cover: album1, dateAdded: '2 days ago', duration: '20:24' },
  { id: '2', title: 'Midnight Reverie', artist: 'Max Silverlake', album: 'Cityscapes in Music', cover: album2, dateAdded: '5 days ago', duration: '12:32' },
  { id: '3', title: 'Whispered Echoes', artist: 'Ruby Riversong', album: 'Songs of the Night', cover: album3, dateAdded: '1 week ago', duration: '15:15' },
  { id: '4', title: 'Tides of Tranquility', artist: 'Finn Oceanwood', album: 'Whispers of the Wilderness', cover: album4, dateAdded: '2 weeks ago', duration: '54:32' },
  { id: '5', title: 'Neon Daydream', artist: 'Lily Moonshadow', album: 'Chronicles of the Cybernetic Age', cover: album5, dateAdded: '3 weeks ago', duration: '08:11' },
  { id: '6', title: 'Velvet Horizon', artist: 'Max Silverlake', album: 'Serene Sounds', cover: album1, dateAdded: '1 month ago', duration: '04:48' },
  { id: '7', title: 'Glass Cathedrals', artist: 'Ruby Riversong', album: 'Cityscapes in Music', cover: album2, dateAdded: '1 month ago', duration: '06:22' },
];

export const favoriteAlbums: FavoriteItem[] = [
  { title: 'Soundscapes from Beyond', followers: '421K follower', cover: album1 },
  { title: 'Cityscapes in Music', followers: '54K follower', cover: album2 },
  { title: 'Songs of the Night', followers: '142K follower', cover: album3 },
  { title: 'Whispers of the Wilderness', followers: '321K follower', cover: album4 },
  { title: 'Chronicles of the Cybernetic Age', followers: '153K follower', cover: album5 },
];

export const favoriteMusic: FavoriteItem[] = [
  { title: 'Soundscapes from Beyond', followers: '421K follower', cover: album1 },
  { title: 'Cityscapes in Music', followers: '54K follower', cover: album2 },
  { title: 'Songs of the Night', followers: '142K follower', cover: album3 },
  { title: 'Whispers of the Wilderness', followers: '321K follower', cover: album4 },
];

/** Track shown by default in the player bar before the user picks anything. */
export const defaultTrack: Track = {
  id: 'pis',
  title: 'Play It Safe',
  artist: 'Julia Wolf',
  album: 'WOLF',
  cover: PLAY_IT_SAFE_COVER,
  dateAdded: 'Mar 19',
  duration: '4:22',
};
