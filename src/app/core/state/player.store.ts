import { Injectable, computed, inject, signal } from '@angular/core';
import { Track } from '@core/models/track.model';
import { defaultTrack } from '@core/data/tracks.data';
import { toSeconds } from '@core/utils/format';
import { SongsService } from '@core/api/songs.service';

export type RepeatMode = 'off' | 'all' | 'one';

/**
 * Global playback state + the real `<audio>` element driving it.
 *
 * The store owns a single `HTMLAudioElement` (this service is a root singleton) and keeps the
 * signals in sync with the element's events. It holds an ordered **queue** with a current `index`;
 * `current` is the track at that position, so `next()` / `previous()` and auto-advance on `ended`
 * just move the index. Components play a context with `setQueue(tracks, startIndex)` (or `setTrack`
 * for a single song).
 *
 * A track's `id` is the backend song id (as string); `streamUrl(id)` points the element at
 * `GET /api/v1/songs/stream/{id}` (Range-enabled). The mock `defaultTrack` has a non-numeric id, so
 * it stays silent until the user picks a real song. Likes live in `FavoritesStore`, not here.
 */
@Injectable({ providedIn: 'root' })
export class PlayerStore {
  private readonly songs = inject(SongsService);

  private readonly _queue = signal<readonly Track[]>([defaultTrack]);
  private readonly _index = signal(0);
  private readonly _isPlaying = signal(false);
  private readonly _progress = signal(0);
  private readonly _duration = signal(toSeconds(defaultTrack.duration));
  private readonly _shuffle = signal(false);
  private readonly _repeat = signal<RepeatMode>('off');

  /** The track currently loaded in the player bar / player page (queue position). */
  readonly current = computed(() => this._queue()[this._index()] ?? defaultTrack);
  readonly isPlaying = this._isPlaying.asReadonly();
  readonly progress = this._progress.asReadonly();
  readonly duration = this._duration.asReadonly();
  readonly queue = this._queue.asReadonly();
  readonly index = this._index.asReadonly();
  readonly shuffle = this._shuffle.asReadonly();
  readonly repeat = this._repeat.asReadonly();

  /** Tracks queued after the current one — feeds the "Up next" panel. */
  readonly upNext = computed(() => this._queue().slice(this._index() + 1));
  readonly hasPrevious = computed(() => this._index() > 0);
  readonly hasNext = computed(
    () => this._index() < this._queue().length - 1 || this._repeat() === 'all',
  );

  /** Playback progress as a 0–100 percentage for the seek bar. */
  readonly progressPct = computed(() => {
    const duration = this._duration();
    return duration ? (this._progress() / duration) * 100 : 0;
  });

  /** Real audio element, wired to keep the signals above in sync with playback. */
  private readonly audio = this.createAudio();

  /** Play a list of tracks as the active queue, starting at `startIndex`. */
  setQueue(tracks: Track[], startIndex = 0): void {
    if (!tracks.length) return;
    const index = Math.min(Math.max(startIndex, 0), tracks.length - 1);
    this._queue.set([...tracks]);
    this.playAt(index);
  }

  /** Convenience: play a single track as a one-item queue. */
  setTrack(track: Track): void {
    this.setQueue([track], 0);
  }

  /** Append a track to the end of the current queue (without changing what's playing). */
  enqueue(track: Track): void {
    this._queue.update((q) => [...q, track]);
  }

  togglePlay(): void {
    if (this.audio.paused) {
      void this.audio.play().catch(() => this._isPlaying.set(false));
    } else {
      this.audio.pause();
    }
  }

  /** Advance to the next track, honouring shuffle and repeat. No-op past the end when repeat is off. */
  next(): void {
    const queue = this._queue();
    if (this._repeat() === 'one') {
      this.playAt(this._index());
      return;
    }
    if (this._shuffle() && queue.length > 1) {
      this.playAt(this.randomIndex());
      return;
    }
    let i = this._index() + 1;
    if (i >= queue.length) {
      if (this._repeat() !== 'all') return;
      i = 0;
    }
    this.playAt(i);
  }

  /** Jump to an absolute queue position (e.g. from the "Up next" list). */
  jumpTo(index: number): void {
    if (index >= 0 && index < this._queue().length) this.playAt(index);
  }

  /** Restart the current track if we're a few seconds in; otherwise step back one. */
  previous(): void {
    if (this._progress() > 3 || this._index() === 0) {
      this.setProgress(0);
      return;
    }
    this.playAt(this._index() - 1);
  }

  toggleShuffle(): void {
    this._shuffle.update((on) => !on);
  }

  /** Cycle off → all → one → off. */
  cycleRepeat(): void {
    this._repeat.update((mode) => (mode === 'off' ? 'all' : mode === 'all' ? 'one' : 'off'));
  }

  /** Seek to a position in seconds (called by the progress-bar scrubber). */
  setProgress(seconds: number): void {
    if (Number.isFinite(this.audio.duration)) {
      this.audio.currentTime = seconds;
    }
    this._progress.set(seconds);
  }

  /** Jump to a queue position and start playing it. */
  private playAt(index: number): void {
    this._index.set(index);
    this._progress.set(0);
    this._duration.set(toSeconds(this.current().duration));
    this.load(this.current());
  }

  /** A random queue index other than the current one (for shuffle). */
  private randomIndex(): number {
    const n = this._queue().length;
    if (n <= 1) return this._index();
    let i = this._index();
    while (i === this._index()) i = Math.floor(Math.random() * n);
    return i;
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

  /** When a track finishes, auto-advance; if nothing follows, stop. */
  private onEnded(): void {
    if (this._repeat() === 'one') {
      this.playAt(this._index());
    } else if (this.hasNext() || (this._shuffle() && this._queue().length > 1)) {
      this.next();
    } else {
      this._isPlaying.set(false);
    }
  }

  /** Create the audio element and bridge its events to the store's signals. */
  private createAudio(): HTMLAudioElement {
    const audio = new Audio();
    audio.preload = 'metadata';
    audio.addEventListener('play', () => this._isPlaying.set(true));
    audio.addEventListener('pause', () => this._isPlaying.set(false));
    audio.addEventListener('ended', () => this.onEnded());
    audio.addEventListener('error', () => this._isPlaying.set(false));
    audio.addEventListener('timeupdate', () => this._progress.set(audio.currentTime));
    audio.addEventListener('loadedmetadata', () => {
      if (Number.isFinite(audio.duration)) this._duration.set(audio.duration);
    });
    return audio;
  }
}
