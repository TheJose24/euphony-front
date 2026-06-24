import { Injectable, computed, signal } from '@angular/core';
import { Track } from '@core/models/track.model';
import { defaultTrack } from '@core/data/tracks.data';
import { toSeconds } from '@core/utils/format';

/**
 * Global playback state, ported from the React Zustand `usePlayer` store.
 * Built on Angular signals so it works in this zoneless app.
 */
@Injectable({ providedIn: 'root' })
export class PlayerStore {
  private readonly _current = signal<Track>(defaultTrack);
  private readonly _isPlaying = signal(false);
  private readonly _favorites = signal<ReadonlySet<string>>(new Set([defaultTrack.id]));
  private readonly _progress = signal(159); // 2:39
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

  isFavorite(id: string): boolean {
    return this._favorites().has(id);
  }

  setTrack(track: Track): void {
    this._current.set(track);
    this._isPlaying.set(true);
    this._progress.set(0);
    this._duration.set(toSeconds(track.duration));
  }

  togglePlay(): void {
    this._isPlaying.update((playing) => !playing);
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

  setProgress(seconds: number): void {
    this._progress.set(seconds);
  }
}
