/**
 * Per-frame snapshot of the audio spectrum, all normalised to roughly `[0, 1]`.
 * `beat` is a decaying envelope (jumps toward 1 on an onset, falls between hits) so
 * visuals can "pulse" without reading raw FFT bins.
 */
export interface AudioFrame {
  bass: number;
  mid: number;
  treble: number;
  /** Overall loudness (weighted blend of the bands). */
  level: number;
  /** 0–1 beat envelope: spikes on a detected onset, decays each frame. */
  beat: number;
}

/** Musical band edges in Hz. Most usable energy sits below ~8 kHz. */
const BANDS = {
  bass: [20, 160],
  mid: [160, 2000],
  treble: [2000, 8000],
} as const;

const SILENT: AudioFrame = { bass: 0, mid: 0, treble: 0, level: 0, beat: 0 };

/**
 * Turns a Web Audio `AnalyserNode` into smoothed band energies plus a simple beat
 * pulse. Pure and framework-agnostic: the engine calls {@link sample} once per frame.
 *
 * Beat detection is the classic energy-vs-rolling-average approach — an onset is a
 * bass-energy spike well above the recent local average, gated by a refractory period
 * so a single hit can't retrigger. It's a reimplementation (no Mineradio code), tuned
 * for the calm Euphony register: the envelope decays gently, never strobes.
 */
export class AudioReactive {
  private readonly bins: Uint8Array<ArrayBuffer>;
  private readonly hzPerBin: number;

  /** Rolling window of recent bass levels for the adaptive beat threshold (~1 s). */
  private readonly history = new Float32Array(43);
  private historyIndex = 0;

  /** Smoothed band outputs (extra attack/decay on top of the analyser's own smoothing). */
  private smooth = { bass: 0, mid: 0, treble: 0 };
  private beatEnv = 0;
  private framesSinceBeat = 99;

  constructor(private readonly analyser: AnalyserNode) {
    this.bins = new Uint8Array(new ArrayBuffer(analyser.frequencyBinCount));
    const nyquist = analyser.context.sampleRate / 2;
    this.hzPerBin = nyquist / analyser.frequencyBinCount;
  }

  /** Read the current spectrum and advance the beat envelope. Call once per frame. */
  sample(): AudioFrame {
    this.analyser.getByteFrequencyData(this.bins);

    const bass = this.bandEnergy(BANDS.bass[0], BANDS.bass[1]);
    const mid = this.bandEnergy(BANDS.mid[0], BANDS.mid[1]);
    const treble = this.bandEnergy(BANDS.treble[0], BANDS.treble[1]);

    // Asymmetric smoothing: snap up quickly (attack), ease down slowly (decay).
    this.smooth.bass = this.envelope(this.smooth.bass, bass);
    this.smooth.mid = this.envelope(this.smooth.mid, mid);
    this.smooth.treble = this.envelope(this.smooth.treble, treble);

    this.detectBeat(bass);

    const level = this.smooth.bass * 0.5 + this.smooth.mid * 0.35 + this.smooth.treble * 0.15;
    return {
      bass: this.smooth.bass,
      mid: this.smooth.mid,
      treble: this.smooth.treble,
      level,
      beat: this.beatEnv,
    };
  }

  /** A frozen, all-zero frame for paused/idle playback. */
  static silent(): AudioFrame {
    return SILENT;
  }

  /** Mean normalised energy across the FFT bins covering `[loHz, hiHz]`. */
  private bandEnergy(loHz: number, hiHz: number): number {
    const lo = Math.max(1, Math.floor(loHz / this.hzPerBin));
    const hi = Math.min(this.bins.length - 1, Math.ceil(hiHz / this.hzPerBin));
    let sum = 0;
    for (let i = lo; i <= hi; i++) sum += this.bins[i];
    const count = hi - lo + 1;
    return count > 0 ? sum / count / 255 : 0;
  }

  private envelope(prev: number, next: number): number {
    const k = next > prev ? 0.5 : 0.12; // fast attack, slow release
    return prev + (next - prev) * k;
  }

  /** Compare instantaneous bass against the rolling local average to flag onsets. */
  private detectBeat(bass: number): void {
    const avg = this.history.reduce((a, b) => a + b, 0) / this.history.length;
    this.history[this.historyIndex] = bass;
    this.historyIndex = (this.historyIndex + 1) % this.history.length;

    this.framesSinceBeat++;
    const isOnset = bass > avg * 1.35 && bass > 0.12 && this.framesSinceBeat > 8;
    if (isOnset) {
      this.beatEnv = 1;
      this.framesSinceBeat = 0;
    } else {
      this.beatEnv *= 0.9; // gentle decay — serene pulse, not a strobe
    }
  }
}
