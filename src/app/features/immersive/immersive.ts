import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  OnDestroy,
  effect,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { LucideAngularModule } from 'lucide-angular';
import { PlayerStore } from '@core/state/player.store';
import { ImmersiveIntensity, ImmersivePrefsStore } from '@core/state/immersive-prefs.store';
import { SongsService } from '@core/api/songs.service';
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

  /** True once the canvas is in the DOM, gating engine mount in the reactive effect. */
  private readonly ready = signal(false);
  /** Captured on entry (user gesture) so the engine can be (re)mounted later. */
  private analyser?: AnalyserNode;

  /**
   * Plain-text lyrics for the current track (no LRC timestamps from the backend, so the
   * lyric stage is presentational, not time-synced). `null` = none / not loaded.
   */
  protected readonly lyrics = signal<string | null>(null);
  protected readonly lyricsLoading = signal(false);
  protected readonly lyricsOpen = signal(false);
  private lyricsForId: string | null = null;
  private lyricsSub?: Subscription;

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
    effect(() => this.engine?.setTrack(this.player.current()));
    effect(() => this.engine?.setPlaying(this.player.isPlaying()));
    effect(() => this.engine?.setIntensity(this.prefs.intensity()));
    // Fetch lyrics whenever the track changes (its own request, cancelled on the next).
    effect(() => this.syncLyrics(this.player.current()));
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
    engine.start();
    this.engine = engine;
  }

  /** Fully dispose the engine (RAF, listeners, GPU) — leaves no cost behind. */
  private teardownEngine(): void {
    this.engine?.dispose();
    this.engine = undefined;
  }

  setIntensity(intensity: ImmersiveIntensity): void {
    this.prefs.setIntensity(intensity);
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

    const id = Number(track.id);
    if (!Number.isInteger(id) || id <= 0) return; // silent placeholder, nothing to fetch
    this.lyricsLoading.set(true);
    this.lyricsSub = this.songs.getById(id).subscribe({
      next: (dto) => {
        this.lyrics.set(dto.lyrics?.trim() || null);
        this.lyricsLoading.set(false);
      },
      error: () => {
        this.lyrics.set(null);
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
