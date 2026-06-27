import { Injectable, computed, inject, signal } from '@angular/core';
import { Track } from '@core/models/track.model';
import { defaultTrack } from '@core/data/tracks.data';
import { toSeconds } from '@core/utils/format';
import { SongsService } from '@core/api/songs.service';

export type RepeatMode = 'off' | 'all' | 'one';

/** Lifecycle of the current track. Drives the player's loading / error / empty UI states. */
export type PlaybackStatus = 'idle' | 'loading' | 'playing' | 'paused' | 'error';

/** The default/placeholder track has a non-numeric id and no backing stream. */
function isRealSong(track: Track): boolean {
  const id = Number(track.id);
  return Number.isInteger(id) && id > 0;
}

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
 *
 * Playback lifecycle is modelled explicitly as `status` (`idle | loading | playing | paused |
 * error`) rather than a single boolean, so the UI can honestly show "nothing cued", buffering, and
 * failed streams instead of optimistically claiming a track is playing.
 */
@Injectable({ providedIn: 'root' })
export class PlayerStore {
  private readonly songs = inject(SongsService);

  private readonly _queue = signal<readonly Track[]>([defaultTrack]);
  private readonly _index = signal(0);
  private readonly _status = signal<PlaybackStatus>('idle');
  private readonly _progress = signal(0);
  private readonly _duration = signal(toSeconds(defaultTrack.duration));
  private readonly _shuffle = signal(false);
  private readonly _repeat = signal<RepeatMode>('off');

  /** The track currently loaded in the player bar / player page (queue position). */
  readonly current = computed(() => this._queue()[this._index()] ?? defaultTrack);
  readonly progress = this._progress.asReadonly();
  readonly duration = this._duration.asReadonly();
  readonly queue = this._queue.asReadonly();
  readonly index = this._index.asReadonly();
  readonly shuffle = this._shuffle.asReadonly();
  readonly repeat = this._repeat.asReadonly();

  /** Full playback lifecycle. */
  readonly status = this._status.asReadonly();
  /** Convenience flags derived from `status` for templates and sibling components. */
  readonly isPlaying = computed(() => this._status() === 'playing');
  readonly isLoading = computed(() => this._status() === 'loading');
  readonly hasError = computed(() => this._status() === 'error');
  /** A real, streamable song is cued (not the silent placeholder default). */
  readonly hasTrack = computed(() => isRealSong(this.current()));

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
    if (!isRealSong(this.current())) return; // nothing real to play (silent placeholder)
    if (this.audio.paused) {
      this._status.set('loading');
      void this.audio.play().catch(() => {
        if (this._status() === 'loading') this._status.set('paused');
      });
    } else {
      this.audio.pause();
    }
  }

  /** Re-attempt the current track after a playback error. */
  retry(): void {
    this.playAt(this._index());
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
    if (isRealSong(track)) {
      this.audio.src = this.songs.streamUrl(Number(track.id));
      this._status.set('loading'); // confirmed by the 'playing' / 'error' events below
      void this.audio.play().catch(() => {
        // Autoplay blocked (no user gesture) leaves the track cued but paused; a real
        // load/network failure surfaces via the 'error' event, which wins over this.
        if (this._status() === 'loading') this._status.set('paused');
      });
    } else {
      // Placeholder/default track with no backing audio — nothing is really cued.
      this.audio.removeAttribute('src');
      this.audio.load();
      this._status.set('idle');
    }
  }

  /** When a track finishes, auto-advance; if nothing follows, stop. */
  private onEnded(): void {
    if (this._repeat() === 'one') {
      this.playAt(this._index());
    } else if (this.hasNext() || (this._shuffle() && this._queue().length > 1)) {
      this.next();
    } else {
      this._status.set('paused');
    }
  }

  /** Create the audio element and bridge its events to the store's signals. */
  private createAudio(): HTMLAudioElement {
    const audio = new Audio();
    audio.preload = 'metadata';
    // 'playing' fires when audio actually starts (after any buffering); 'waiting' when it stalls.
    audio.addEventListener('playing', () => this._status.set('playing'));
    audio.addEventListener('waiting', () => {
      if (isRealSong(this.current())) this._status.set('loading');
    });
    audio.addEventListener('pause', () => {
      // Only a real pause of live playback; ignore pauses caused by swapping the source.
      if (this._status() === 'playing') this._status.set('paused');
    });
    audio.addEventListener('ended', () => this.onEnded());
    audio.addEventListener('error', () => {
      if (isRealSong(this.current())) this._status.set('error');
    });
    audio.addEventListener('timeupdate', () => this._progress.set(audio.currentTime));
    audio.addEventListener('loadedmetadata', () => {
      if (Number.isFinite(audio.duration)) this._duration.set(audio.duration);
    });
    return audio;
  }
}
