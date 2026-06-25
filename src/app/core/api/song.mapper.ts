import { Track } from '@core/models/track.model';
import { fmtTime, toSeconds } from '@core/utils/format';
import { SongResponseDTO } from './dto/song.dto';
import { mediaUrl } from './media';

/** Cover shown when a song has no artwork yet. */
const FALLBACK_COVER = 'assets/album1.jpg';

/** Map a backend `SongResponseDTO` into the UI `Track` model used by the tables and player. */
export function toTrack(dto: SongResponseDTO): Track {
  return {
    id: String(dto.songId),
    title: dto.title,
    artist: dto.artistName ?? '—',
    album: dto.albumTitle ?? '—',
    // Prefer the song's own artwork, fall back to the album cover, then a placeholder.
    cover: mediaUrl(dto.coverImg ?? dto.albumCover) ?? FALLBACK_COVER,
    dateAdded: dto.releaseDate ?? '—',
    duration: dto.duration ? fmtTime(toSeconds(dto.duration)) : '0:00',
  };
}
