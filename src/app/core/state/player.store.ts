import { Injectable, computed, inject, signal } from '@angular/core';
import { Track } from '@core/models/track.model';
import { defaultTrack } from '@core/data/tracks.data';
import { toSeconds } from '@core/utils/format';
import { SongsService } from '@core/api/songs.service';

/**
 * Global playback state + the real `<audio>` element driving it.
 *
 * The store owns a single `HTMLAudioElement` (this service is a root singleton) and
 * keeps the signals in sync with the element's events, so every component can keep
 * calling `togglePlay()` / `setTrack()` / `setProgress()` and the audio just follows.
 *
 * A track's `id` is the backend song id (as string); `streamUrl(id)` points the
 * element at `GET /api/v1/songs/stream/{id}` (Range-enabled). The mock `defaultTrack`
 * has a non-numeric id, so it stays silent until the user picks a real song.
 */
@Injectable({ providedIn: 'root' })
export class PlayerStore {
  private readonly songs = inject(SongsService);

  private readonly _current = signal<Track>(defaultTrack);
  private readonly _isPlaying = signal(false);
  private readonly _favorites = signal<ReadonlySet<string>>(new Set([defaultTrack.id]));
  private readonly _progress = signal(0);
  private readonly _duration = signal(toSeconds(defaultTrack.duration));

  /** The track currently loaded in the player bar / player page. */
  readonly current = this._current.asReadonly();
  readonly isPlaying = this._isPlaying.asReadonly();
  readonly favorites = this._favorites.asReadonly();
  readonly progress = this._progress.asReadonly();
  readonly duration = this._duration.asReadonly();

  /** Whether the current track is in the favourites set. */
  readonly isCurrentFavorite = computed(() => this._favorites().has(this._current().id));

  /** Playback progress as a 0–100 percentage for the seek bar. */
  readonly progressPct = computed(() => {
    const duration = this._duration();
    return duration ? (this._progress() / duration) * 100 : 0;
  });

  /** Real audio element, wired to keep the signals above in sync with playback. */
  private readonly audio = this.createAudio();

  isFavorite(id: string): boolean {
    return this._favorites().has(id);
  }

  setTrack(track: Track): void {
    this._current.set(track);
    this._progress.set(0);
    this._duration.set(toSeconds(track.duration));
    this.load(track);
  }

  togglePlay(): void {
    if (this.audio.paused) {
      void this.audio.play().catch(() => this._isPlaying.set(false));
    } else {
      this.audio.pause();
    }
  }

  toggleFavorite(id?: string): void {
    const trackId = id ?? this._current().id;
    const next = new Set(this._favorites());
    if (next.has(trackId)) {
      next.delete(trackId);
    } else {
      next.add(trackId);
    }
    this._favorites.set(next);
  }

  /** Seek to a position in seconds (called by the progress-bar scrubber). */
  setProgress(seconds: number): void {
    if (Number.isFinite(this.audio.duration)) {
      this.audio.currentTime = seconds;
    }
    this._progress.set(seconds);
  }

  /** Point the audio element at a track's stream and start playing (if it's a real song). */
  private load(track: Track): void {
    const songId = Number(track.id);
    if (Number.isInteger(songId) && songId > 0) {
      this.audio.src = this.songs.streamUrl(songId);
      this._isPlaying.set(true); // optimistic; corrected by the play/error events
      void this.audio.play().catch(() => this._isPlaying.set(false));
    } else {
      // Mock/default track with no backing audio — stay silent.
      this.audio.removeAttribute('src');
      this.audio.load();
      this._isPlaying.set(false);
    }
  }

  /** Create the audio element and bridge its events to the store's signals. */
  private createAudio(): HTMLAudioElement {
    const audio = new Audio();
    audio.preload = 'metadata';
    audio.addEventListener('play', () => this._isPlaying.set(true));
    audio.addEventListener('pause', () => this._isPlaying.set(false));
    audio.addEventListener('ended', () => this._isPlaying.set(false));
    audio.addEventListener('error', () => this._isPlaying.set(false));
    audio.addEventListener('timeupdate', () => this._progress.set(audio.currentTime));
    audio.addEventListener('loadedmetadata', () => {
      if (Number.isFinite(audio.duration)) this._duration.set(audio.duration);
    });
    return audio;
  }
}
