import { describe, expect, it } from 'vitest';
import { toTrack } from './song.mapper';
import { SongResponseDTO } from './dto/song.dto';

function dto(overrides: Partial<SongResponseDTO> = {}): SongResponseDTO {
  return {
    songId: 42,
    artistId: 1,
    artistName: 'Aphex Twin',
    albumId: 7,
    albumTitle: 'Selected Ambient Works',
    albumCover: '/uploads/images/album.png',
    title: 'Xtal',
    coverImg: '/uploads/images/song.png',
    duration: '00:04:52',
    language: null,
    lyrics: null,
    syncedLyrics: null,
    releaseDate: '1992-11-09',
    filePath: null,
    averageRating: null,
    numberOfPlays: null,
    genres: ['ambient', 'electronic'],
    ...overrides,
  };
}

describe('toTrack', () => {
  it('maps the core fields and stringifies the id', () => {
    const t = toTrack(dto());
    expect(t.id).toBe('42');
    expect(t.title).toBe('Xtal');
    expect(t.artist).toBe('Aphex Twin');
    expect(t.album).toBe('Selected Ambient Works');
    expect(t.dateAdded).toBe('1992-11-09');
    expect(t.genres).toEqual(['ambient', 'electronic']);
  });

  it('formats the "HH:mm:ss" duration as "m:ss"', () => {
    expect(toTrack(dto({ duration: '00:04:52' })).duration).toBe('4:52');
    expect(toTrack(dto({ duration: '' })).duration).toBe('0:00');
  });

  it('prefers the song cover, falling back to the album cover', () => {
    expect(toTrack(dto()).cover).toBe('/uploads/images/song.png');
    expect(toTrack(dto({ coverImg: null })).cover).toBe('/uploads/images/album.png');
  });

  it('uses the placeholder cover when neither artwork is present', () => {
    expect(toTrack(dto({ coverImg: null, albumCover: null })).cover).toBe('assets/album1.jpg');
  });

  it('falls back to em-dash for missing artist/album/date', () => {
    const t = toTrack(dto({ artistName: null as never, albumTitle: null, releaseDate: null }));
    expect(t.artist).toBe('—');
    expect(t.album).toBe('—');
    expect(t.dateAdded).toBe('—');
  });
});
