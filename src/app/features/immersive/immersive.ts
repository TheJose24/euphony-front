import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  OnDestroy,
  computed,
  effect,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { LucideAngularModule } from 'lucide-angular';
import { PlayerStore } from '@core/state/player.store';
import {
  ImmersiveCameraMode,
  ImmersiveIntensity,
  ImmersiveShelfSource,
  ImmersivePrefsStore,
} from '@core/state/immersive-prefs.store';
import { SongsService } from '@core/api/songs.service';
import { PlaylistsService } from '@core/api/playlists.service';
import { PlaylistsStore } from '@core/state/playlists.store';
import { LyricLineDTO } from '@core/api/dto/song.dto';
import { toTrack } from '@core/api/song.mapper';
import { mediaUrl } from '@core/api/media';
import { Track } from '@core/models/track.model';
import { fmtTime } from '@core/utils/format';
import { ImmersiveEngine } from './engine/immersive-engine';

/** How long the overlay stays visible after the last pointer/key activity. */
const OVERLAY_TIMEOUT_MS = 3000;

/**
 * Fullscreen immersive now-playing view. Hosts the WebGL `<canvas>` (driven by
 * {@link ImmersiveEngine}) plus a minimal glass overlay with track info and transport.
 *
 * It does **not** use `AppLayout` — it's a `fixed inset-0` surface above the shell. All
 * playback state is reused from `PlayerStore`; nothing is duplicated. Signals are pushed
 * into the engine via `effect()`s (never read inside the render loop).
 */
@Component({
  selector: 'app-immersive',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [LucideAngularModule],
  templateUrl: './immersive.html',
  host: {
    '(document:keydown.escape)': 'exit()',
    '(pointermove)': 'revealOverlay()',
    '(pointerdown)': 'revealOverlay()',
    '(document:keydown)': 'revealOverlay()',
  },
})
export class Immersive implements AfterViewInit, OnDestroy {
  protected readonly player = inject(PlayerStore);
  protected readonly prefs = inject(ImmersivePrefsStore);
  private readonly router = inject(Router);
  private readonly songs = inject(SongsService);
  private readonly playlistsService = inject(PlaylistsService);
  protected readonly playlists = inject(PlaylistsStore);
  protected readonly fmtTime = fmtTime;

  private readonly canvasRef = viewChild.required<ElementRef<HTMLCanvasElement>>('canvas');

  /** Overlay auto-hides after inactivity; reappears on pointer/key movement. */
  protected readonly overlayVisible = signal(true);
  private hideTimer = 0;

  /** Settings popover (intensity selector) visibility. */
  protected readonly settingsOpen = signal(false);

  /** The intensity levels offered in the UI, in order. */
  protected readonly intensities: { value: ImmersiveIntensity; label: string }[] = [
    { value: 'off', label: 'Apagado' },
    { value: 'subtle', label: 'Sutil' },
    { value: 'full', label: 'Completo' },
  ];

  /** Camera modes offered in the UI. */
  protected readonly cameraModes: { value: ImmersiveCameraMode; label: string }[] = [
    { value: 'auto', label: 'Automática' },
    { value: 'manual', label: 'Manual' },
  ];

  /** True once the canvas is in the DOM, gating engine mount in the reactive effect. */
  private readonly ready = signal(false);
  /** Captured on entry (user gesture) so the engine can be (re)mounted later. */
  private analyser?: AnalyserNode;

  /**
   * Lyrics for the current track. `syncedLyrics` (time-stamped, ascending by `timeMs`) drives
   * the karaoke highlight when present; `lyrics` (plain text) is the fallback. `null` = none.
   */
  protected readonly lyrics = signal<string | null>(null);
  protected readonly syncedLyrics = signal<LyricLineDTO[] | null>(null);
  protected readonly lyricsLoading = signal(false);
  protected readonly lyricsOpen = signal(false);
  private lyricsForId: string | null = null;
  private lyricsSub?: Subscription;

  /** Whether this track has any lyrics to show (synced or plain). */
  protected readonly hasLyrics = computed(() => !!this.syncedLyrics()?.length || !!this.lyrics());

  /**
   * Index of the active synced line: the last whose `timeMs <= progress`. Recomputes as
   * `player.progress()` advances; frozen on pause. `-1` when there are no synced lyrics.
   */
  protected readonly activeLyricIndex = computed(() => {
    const lines = this.syncedLyrics();
    if (!lines?.length) return -1;
    const ms = this.player.progress() * 1000; // progress() is in seconds
    let active = -1;
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].timeMs <= ms) active = i;
      else break; // ascending, so no later line can match
    }
    return active;
  });

  /** DOM host for the CSS3D lyric stage (synced lyrics rendered in the scene). */
  private readonly lyric3dRef = viewChild<ElementRef<HTMLElement>>('lyric3d');

  /** Active synced line text, announced via an `aria-live` region for screen readers. */
  protected readonly activeLyricLine = computed(() => {
    const lines = this.syncedLyrics();
    const i = this.activeLyricIndex();
    return this.lyricsOpen() && lines && i >= 0 ? (lines[i]?.text ?? '') : '';
  });

  /** Whether the 3D shelf is showing (any source other than `off`). */
  protected readonly shelfOpen = computed(() => this.prefs.shelfSource() !== 'off');
  /** Index of the shelf's focused card (updated by the engine on navigation). */
  protected readonly shelfFocusedIndex = signal(0);
  /** Shelf sources offered in the settings popover. */
  protected readonly shelfSources: { value: ImmersiveShelfSource; label: string }[] = [
    { value: 'off', label: 'Oculto' },
    { value: 'queue', label: 'Cola' },
    { value: 'playlists', label: 'Playlists' },
  ];
  /** Caption for the focused card, per source. */
  protected readonly shelfCaption = computed(() => {
    const i = this.shelfFocusedIndex();
    if (this.prefs.shelfSource() === 'queue') {
      const track = this.player.queue()[i];
      return track ? { title: track.title, subtitle: track.artist } : null;
    }
    if (this.prefs.shelfSource() === 'playlists') {
      const pl = this.playlists.playlists()[i];
      return pl ? { title: pl.name, subtitle: `${pl.songCount} canciones` } : null;
    }
    return null;
  });
  /** Tracks whether the shelf was already shown, to seed its focus only on first open. */
  private shelfShown = false;
  /** Last non-hidden source, so the top-bar toggle restores it. */
  private lastShelfSource: Exclude<ImmersiveShelfSource, 'off'> = 'queue';
  /** In-flight playlist-songs request when selecting a playlist. */
  private shelfSelectSub?: Subscription;

  private engine?: ImmersiveEngine;

  constructor() {
    // Mount/unmount the engine reactively: `off` (or disabled) tears it down to zero cost,
    // switching back to subtle/full rebuilds it live — all gated on the canvas being ready.
    effect(() => {
      const active = this.prefs.active();
      if (!this.ready()) return;
      if (active && !this.engine) this.mountEngine();
      else if (!active && this.engine) this.teardownEngine();
    });
    // Push playback/preference state into the imperative engine — outside the render loop.
    // NB: read the signal FIRST, then call the engine. `this.engine?.setX(signal())` would
    // short-circuit the signal read while the engine is still mounting, so the effect would
    // never track it and never re-run.
    effect(() => {
      const track = this.player.current();
      this.engine?.setTrack(track);
    });
    effect(() => {
      const playing = this.player.isPlaying();
      this.engine?.setPlaying(playing);
    });
    effect(() => {
      const intensity = this.prefs.intensity();
      this.engine?.setIntensity(intensity);
    });
    effect(() => {
      const mode = this.prefs.cameraMode();
      this.engine?.setCameraMode(mode);
    });
    // Fetch lyrics whenever the track changes (its own request, cancelled on the next).
    effect(() => this.syncLyrics(this.player.current()));
    // Feed the 3D lyric stage: lines only when open + synced; active index follows the audio.
    effect(() => {
      const lines = this.lyricsOpen() ? this.syncedLyrics() : null;
      this.engine?.setLyrics(lines ?? []);
    });
    effect(() => {
      const index = this.activeLyricIndex();
      this.engine?.setActiveLine(index);
    });
    // Feed the shelf from the chosen source; re-runs on source/queue/playlists changes.
    effect(() => {
      this.prefs.shelfSource();
      this.player.queue();
      this.playlists.playlists();
      this.syncShelf();
    });
  }

  ngAfterViewInit(): void {
    // Entering the mode is a user gesture (the nav click), so the AudioContext can resume.
    // This also routes the element through the analyser the visualizer reads.
    this.analyser = this.player.getAnalyser();
    this.ready.set(true); // lets the mount effect create the engine if active
    this.scheduleHide();
  }

  ngOnDestroy(): void {
    this.teardownEngine();
    this.lyricsSub?.unsubscribe();
    this.shelfSelectSub?.unsubscribe();
    if (this.hideTimer) clearTimeout(this.hideTimer);
  }

  /** Create and start the WebGL engine with the current prefs/playback state. */
  private mountEngine(): void {
    const engine = new ImmersiveEngine({
      canvas: this.canvasRef().nativeElement,
      intensity: this.prefs.intensity(),
    });
    if (this.analyser) engine.setAnalyser(this.analyser);
    engine.setPlaying(this.player.isPlaying());
    engine.setTrack(this.player.current());
    // Camera: restore the persisted manual framing and persist further changes.
    engine.setCameraMode(this.prefs.cameraMode());
    const saved = this.prefs.cameraState();
    if (saved) engine.applyCameraState(saved);
    engine.onCameraEnd = (state) => this.prefs.setCameraState(state);
    // Shelf: selection plays, focus drives the caption.
    engine.onShelfSelect = (index) => this.onShelfSelect(index);
    engine.onShelfFocus = (index) => this.shelfFocusedIndex.set(index);
    // 3D lyrics: hand over the DOM host and seed the current state.
    const lyric3d = this.lyric3dRef();
    if (lyric3d) engine.setLyricContainer(lyric3d.nativeElement);
    engine.onLyricSeek = (timeMs) => this.player.setProgress(timeMs / 1000);
    engine.setLyrics(this.lyricsOpen() ? (this.syncedLyrics() ?? []) : []);
    engine.setActiveLine(this.activeLyricIndex());
    engine.start();
    this.engine = engine;
    this.syncShelf(); // apply the persisted shelf source now the engine exists
  }

  /** Fully dispose the engine (RAF, listeners, GPU) — leaves no cost behind. */
  private teardownEngine(): void {
    this.engine?.dispose();
    this.engine = undefined;
    this.shelfShown = false; // a future remount re-seeds the shelf focus
  }

  setIntensity(intensity: ImmersiveIntensity): void {
    this.prefs.setIntensity(intensity);
  }

  setCameraMode(mode: ImmersiveCameraMode): void {
    this.prefs.setCameraMode(mode);
  }

  /** Return to the default framing and forget the saved manual view. */
  resetView(): void {
    this.engine?.resetView();
    this.prefs.setCameraState(null);
  }

  /** Top-bar quick toggle: hide, or restore the last shown source. */
  toggleShelf(): void {
    this.prefs.setShelfSource(this.prefs.shelfSource() === 'off' ? this.lastShelfSource : 'off');
  }

  /** Pick the shelf source from the settings popover. */
  setShelfSource(source: ImmersiveShelfSource): void {
    this.prefs.setShelfSource(source);
  }

  shelfPrev(): void {
    this.engine?.shelfPrev();
  }

  shelfNext(): void {
    this.engine?.shelfNext();
  }

  /** Select (play) the currently focused card. */
  selectFocused(): void {
    this.onShelfSelect(this.shelfFocusedIndex());
  }

  /** Push the chosen source's items to the engine and toggle shelf visibility. */
  private syncShelf(): void {
    const engine = this.engine;
    if (!engine) return;
    const source = this.prefs.shelfSource();
    if (source === 'off') {
      engine.setShelfVisible(false);
      this.shelfShown = false;
      return;
    }
    this.lastShelfSource = source;

    let items: { title: string; cover: string | null }[];
    let seed = 0;
    if (source === 'queue') {
      items = this.player.queue().map((t) => ({ title: t.title, cover: t.cover }));
      seed = this.player.index();
    } else {
      // Playlists: the DTO carries a cover (placeholder when null — no per-song fetch).
      items = this.playlists.playlists().map((p) => ({ title: p.name, cover: mediaUrl(p.coverImage) }));
    }

    engine.setShelfItems(items);
    const wasHidden = !this.shelfShown;
    engine.setShelfVisible(true);
    this.shelfShown = true;
    if (wasHidden) engine.setShelfFocus(seed);
  }

  /** A shelf card was selected — act per source. */
  private onShelfSelect(index: number): void {
    if (this.prefs.shelfSource() === 'queue') {
      this.player.jumpTo(index);
      return;
    }
    if (this.prefs.shelfSource() === 'playlists') {
      const playlist = this.playlists.playlists()[index];
      if (!playlist) return;
      this.shelfSelectSub?.unsubscribe();
      this.shelfSelectSub = this.playlistsService.getSongs(playlist.playlistId).subscribe({
        next: (songs) => {
          const tracks = songs.map(toTrack);
          if (tracks.length) this.player.setQueue(tracks); // empty playlist → no-op
        },
      });
    }
  }

  toggleSettings(): void {
    this.settingsOpen.update((open) => !open);
    this.overlayVisible.set(true);
    this.scheduleHide(); // open → stays; close → restarts the inactivity countdown
  }

  toggleLyrics(): void {
    this.lyricsOpen.update((open) => !open);
  }

  /** Load the current track's lyrics, cancelling any in-flight request for a previous one. */
  private syncLyrics(track: Track): void {
    if (track.id === this.lyricsForId) return;
    this.lyricsForId = track.id;
    this.lyricsSub?.unsubscribe();
    this.lyrics.set(null);
    this.syncedLyrics.set(null);

    const id = Number(track.id);
    if (!Number.isInteger(id) || id <= 0) return; // silent placeholder, nothing to fetch
    this.lyricsLoading.set(true);
    this.lyricsSub = this.songs.getById(id).subscribe({
      next: (dto) => {
        this.lyrics.set(dto.lyrics?.trim() || null);
        this.syncedLyrics.set(dto.syncedLyrics?.length ? dto.syncedLyrics : null);
        this.lyricsLoading.set(false);
      },
      error: () => {
        this.lyrics.set(null);
        this.syncedLyrics.set(null);
        this.lyricsLoading.set(false);
      },
    });
  }


  /** Leave immersive mode back to the now-playing page. */
  exit(): void {
    void this.router.navigate(['/player']);
  }

  seek(event: Event): void {
    this.player.setProgress(Number((event.target as HTMLInputElement).value));
  }

  setVolume(event: Event): void {
    this.player.setVolume(Number((event.target as HTMLInputElement).value));
  }

  /** Speaker icon reflecting the current level (muted / low / high). */
  volumeIcon(): string {
    if (this.player.muted() || this.player.volume() === 0) return 'volume-x';
    return this.player.volume() < 0.5 ? 'volume-1' : 'volume-2';
  }

  /** Accessible value text for the volume slider, e.g. "60%". */
  volumeLabel(): string {
    return `${Math.round(this.player.volumePct())}%`;
  }

  /** Show the overlay and (re)start the inactivity countdown to hide it again. */
  revealOverlay(): void {
    if (!this.overlayVisible()) this.overlayVisible.set(true);
    this.scheduleHide();
  }

  private scheduleHide(): void {
    if (this.hideTimer) clearTimeout(this.hideTimer);
    // Don't hide the controls while the settings popover is open (it lives in the overlay).
    if (this.settingsOpen()) return;
    this.hideTimer = window.setTimeout(() => this.overlayVisible.set(false), OVERLAY_TIMEOUT_MS);
  }
}
