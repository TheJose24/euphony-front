import { Injectable, signal } from '@angular/core';
import { Track } from '@core/models/track.model';

/**
 * Drives the global "add to playlist" picker. Any component can call `open(track)` to
 * prompt the user to add that song to one of their playlists; the `<app-playlist-picker>`
 * (mounted once in the root) renders the modal when `track()` is set.
 */
@Injectable({ providedIn: 'root' })
export class PlaylistPickerService {
  private readonly _track = signal<Track | null>(null);
  readonly track = this._track.asReadonly();

  open(track: Track): void {
    this._track.set(track);
  }

  close(): void {
    this._track.set(null);
  }
}
