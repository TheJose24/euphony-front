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

const VOLUME_KEY = 'euphony.volume';

/** Restore persisted volume/mute, tolerating absent/corrupt storage. */
function restoreVolume(): { volume: number; muted: boolean } {
  try {
    const raw = localStorage.getItem(VOLUME_KEY);
    if (!raw) return { volume: 1, muted: false };
    const p = JSON.parse(raw) as { volume?: unknown; muted?: unknown };
    const volume = typeof p.volume === 'number' ? Math.min(1, Math.max(0, p.volume)) : 1;
    return { volume, muted: p.muted === true };
  } catch {
    return { volume: 1, muted: false };
  }
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
  private readonly _volume = signal(restoreVolume().volume);
  private readonly _muted = signal(restoreVolume().muted);

  /** The track currently loaded in the player bar / player page (queue position). */
  readonly current = computed(() => this._queue()[this._index()] ?? defaultTrack);
  readonly progress = this._progress.asReadonly();
  readonly duration = this._duration.asReadonly();
  readonly queue = this._queue.asReadonly();
  readonly index = this._index.asReadonly();
  readonly shuffle = this._shuffle.asReadonly();
  readonly repeat = this._repeat.asReadonly();
  /** Output volume 0–1 and mute state, applied through the Web Audio `GainNode`. */
  readonly volume = this._volume.asReadonly();
  readonly muted = this._muted.asReadonly();
  /** Effective volume as a 0–100 percentage for the volume slider (0 while muted). */
  readonly volumePct = computed(() => (this._muted() ? 0 : this._volume()) * 100);

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

  /**
   * Web Audio graph: `source → gain → destination`, with a parallel `source → analyser`
   * tap for the immersive visualizer. Built once on the first real playback so ALL audio
   * (not just immersive) flows through the same path — otherwise tapping it later would
   * audibly change the level mid-session. The `gain` node is the real volume control.
   */
  private audioCtx?: AudioContext;
  private analyser?: AnalyserNode;
  private gainNode?: GainNode;

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

  /** Remove an up-next track from the queue. The currently-playing track can't be removed here. */
  removeAt(index: number): void {
    if (index <= this._index() || index >= this._queue().length) return;
    this._queue.update((q) => q.filter((_, i) => i !== index));
  }

  /** Reorder an up-next track to a new position, keeping it after the current one. */
  moveTo(from: number, to: number): void {
    const cur = this._index();
    const len = this._queue().length;
    if (from <= cur || from >= len) return;
    to = Math.min(Math.max(to, cur + 1), len - 1);
    if (to === from) return;
    this._queue.update((q) => {
      const next = [...q];
      const [item] = next.splice(from, 1);
      next.splice(to, 0, item);
      return next;
    });
  }

  togglePlay(): void {
    if (!isRealSong(this.current())) return; // nothing real to play (silent placeholder)
    if (this.audio.paused) {
      this._status.set('loading');
      this.ensureAudioGraph(); // route through Web Audio (gesture → context can resume)
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

  /** Set output volume (0–1). Dragging it up while muted also unmutes. */
  setVolume(volume: number): void {
    const v = Math.min(1, Math.max(0, volume));
    this._volume.set(v);
    if (v > 0 && this._muted()) this._muted.set(false);
    this.applyGain();
    this.persistVolume();
  }

  toggleMute(): void {
    this._muted.update((m) => !m);
    this.applyGain();
    this.persistVolume();
  }

  /**
   * Return the analyser for the immersive visualizer, building the graph if needed.
   * Call from a user gesture so the `AudioContext` can `resume()` (browsers start it
   * suspended). The graph is normally already up from the first playback.
   */
  getAnalyser(): AnalyserNode {
    this.ensureAudioGraph();
    return this.analyser as AnalyserNode;
  }

  /**
   * Build the `source → gain → destination` graph (+ analyser tap) once, and resume the
   * context if suspended. A media element can only be routed into Web Audio a single time,
   * so this is idempotent. Called on the first real playback (a user gesture) so the level
   * is consistent from the start and the immersive tap doesn't change it later.
   */
  private ensureAudioGraph(): void {
    if (!this.analyser) {
      const ctx = new AudioContext();
      const source = ctx.createMediaElementSource(this.audio);
      const gain = ctx.createGain();
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 2048;
      analyser.smoothingTimeConstant = 0.8;
      source.connect(gain);
      gain.connect(ctx.destination); // audio path (volume-controlled)
      source.connect(analyser); // analysis-only tap, no onward connection needed
      gain.gain.value = this._muted() ? 0 : this._volume();
      this.audioCtx = ctx;
      this.gainNode = gain;
      this.analyser = analyser;
    }
    if (this.audioCtx?.state === 'suspended') void this.audioCtx.resume();
  }

  /** Push the current volume/mute to the gain node with a short ramp to avoid clicks. */
  private applyGain(): void {
    if (!this.gainNode || !this.audioCtx) return;
    const target = this._muted() ? 0 : this._volume();
    this.gainNode.gain.setTargetAtTime(target, this.audioCtx.currentTime, 0.015);
  }

  private persistVolume(): void {
    try {
      localStorage.setItem(VOLUME_KEY, JSON.stringify({ volume: this._volume(), muted: this._muted() }));
    } catch {
      /* storage unavailable — volume just won't persist across reloads */
    }
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
      this.ensureAudioGraph(); // keep all playback on the same Web Audio path (consistent level)
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
    // Fetch the stream with CORS so the immersive visualizer's Web Audio tap can read its
    // samples. Without this, routing a cross-origin element through `createMediaElementSource`
    // taints the graph and it outputs silence (zeroes) — which then mutes normal playback too,
    // since the element is rerouted through Web Audio once tapped. Requires the backend to send
    // `Access-Control-Allow-Origin` on `GET /api/v1/songs/stream/{id}` (see docs_backend/PROMPT_CORS.md).
    // Harmless in dev where the proxy makes the stream same-origin.
    audio.crossOrigin = 'anonymous';
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
