/**
 * MusicManager — procedural chiptune synthesizer using Web Audio API.
 *
 * No external files, no CORS. Each location gets a distinct melody
 * synthesized with OscillatorNode + GainNode. Fades between locations.
 */

export interface TrackDef {
  key: string;
  name: string;
  /** BPM */
  tempo: number;
  /** Base frequency in Hz */
  baseHz: number;
  /** Waveform for melody */
  wave: OscillatorType;
  /** Note pattern — semitone offsets from baseHz */
  pattern: number[];
  /** Bass note offsets (shorter loop) */
  bass: number[];
}

// Pentatonic/RPG-style note sequences per location
const TRACK_DEFS: Record<string, TrackDef> = {
  music_career_city: {
    key: "music_career_city",
    name: "Town Theme",
    tempo: 132,
    baseHz: 261.63, // C4
    wave: "square",
    pattern: [0, 4, 7, 12, 7, 4, 0, 2, 4, 7, 9, 7, 4, 2, 0, -5],
    bass: [0, 0, 7, 0, -5, 0, 7, 0],
  },
  music_resume_tailor: {
    key: "music_resume_tailor",
    name: "Castle on the Mountain",
    tempo: 108,
    baseHz: 220.0, // A3
    wave: "sawtooth",
    pattern: [0, 3, 7, 10, 12, 10, 7, 3, 0, -2, 3, 7, 10, 14, 12, 10],
    bass: [0, 7, 0, 7, -5, 7, -2, 7],
  },
  music_cover_letter: {
    key: "music_cover_letter",
    name: "Rainy Streets",
    tempo: 88,
    baseHz: 196.0, // G3
    wave: "triangle",
    pattern: [0, 2, 5, 7, 9, 7, 5, 2, 0, -3, 2, 5, 7, 10, 9, 7],
    bass: [0, 0, 5, 0, -3, 0, 5, 0],
  },
  music_interview_coach: {
    key: "music_interview_coach",
    name: "In the Royal Court",
    tempo: 120,
    baseHz: 293.66, // D4
    wave: "square",
    pattern: [0, 5, 7, 12, 14, 12, 7, 5, 0, 5, 8, 12, 15, 12, 8, 5],
    bass: [0, 7, 12, 7, 0, 7, 5, 7],
  },
  music_job_analyzer: {
    key: "music_job_analyzer",
    name: "Dungeon",
    tempo: 100,
    baseHz: 146.83, // D3
    wave: "sawtooth",
    pattern: [0, 3, 5, 0, 3, 7, 5, 3, 0, -2, 0, 3, 5, 8, 7, 5],
    bass: [0, 0, -5, 0, 3, 0, -2, 0],
  },
  music_study_hall: {
    key: "music_study_hall",
    name: "Shrine of Mysteries",
    tempo: 80,
    baseHz: 174.61, // F3
    wave: "triangle",
    pattern: [0, 4, 7, 11, 12, 11, 7, 4, 0, 4, 9, 11, 14, 11, 9, 4],
    bass: [0, 7, 0, 7, -1, 7, 0, 7],
  },
};

// ── Helper: semitone offset → frequency multiplier ────────────────────────
function semitoneToHz(baseHz: number, semitones: number): number {
  return baseHz * 2 ** (semitones / 12);
}

// ── Synth player ─────────────────────────────────────────────────────────────

interface SynthPlayer {
  stop(): void;
}

function startSynth(
  ctx: AudioContext,
  def: TrackDef,
  masterGain: GainNode,
): SynthPlayer {
  const beatDuration = 60 / def.tempo; // seconds per beat
  const noteLen = beatDuration * 0.85;
  const patLen = def.pattern.length;
  const bassLen = def.bass.length;

  // Main melody oscillator
  const melOsc = ctx.createOscillator();
  const melGain = ctx.createGain();
  melOsc.type = def.wave;
  melGain.gain.setValueAtTime(0.18, ctx.currentTime);
  melOsc.connect(melGain);
  melGain.connect(masterGain);

  // Bass oscillator
  const bassOsc = ctx.createOscillator();
  const bassGain = ctx.createGain();
  bassOsc.type = "square";
  bassGain.gain.setValueAtTime(0.1, ctx.currentTime);
  bassOsc.connect(bassGain);
  bassGain.connect(masterGain);

  // Light reverb via delay
  const delay = ctx.createDelay(0.3);
  const delayGain = ctx.createGain();
  delay.delayTime.setValueAtTime(beatDuration * 0.375, ctx.currentTime);
  delayGain.gain.setValueAtTime(0.12, ctx.currentTime);
  melGain.connect(delay);
  delay.connect(delayGain);
  delayGain.connect(masterGain);

  melOsc.start();
  bassOsc.start();

  let stopped = false;
  let step = 0;
  let bassStep = 0;

  function tick() {
    if (stopped) return;
    const now = ctx.currentTime;

    const semitone = def.pattern[step % patLen];
    const freq = semitoneToHz(def.baseHz, semitone);
    melOsc.frequency.setValueAtTime(freq, now);
    melGain.gain.cancelScheduledValues(now);
    melGain.gain.setValueAtTime(0.18, now);
    melGain.gain.linearRampToValueAtTime(0.12, now + noteLen * 0.6);
    melGain.gain.linearRampToValueAtTime(0, now + noteLen * 0.9);
    melGain.gain.setValueAtTime(0.18, now + beatDuration);

    if (step % 2 === 0) {
      const bassSemi = def.bass[bassStep % bassLen];
      const bassFreq = semitoneToHz(def.baseHz / 2, bassSemi);
      bassOsc.frequency.setValueAtTime(bassFreq, now);
      bassGain.gain.cancelScheduledValues(now);
      bassGain.gain.setValueAtTime(0.1, now);
      bassGain.gain.linearRampToValueAtTime(0, now + beatDuration * 1.8);
      bassGain.gain.setValueAtTime(0.1, now + beatDuration * 2);
      bassStep++;
    }

    step++;
    // Schedule next tick slightly before the beat ends to avoid jitter
    const nextIn = beatDuration * 1000 - 10;
    setTimeout(tick, nextIn);
  }

  tick();

  return {
    stop() {
      stopped = true;
      try {
        melOsc.stop();
        bassOsc.stop();
      } catch {
        // already stopped
      }
    },
  };
}

// ── MusicManager ──────────────────────────────────────────────────────────────

class MusicManager {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private currentPlayer: SynthPlayer | null = null;
  private currentKey = "";
  private currentName = "";
  private _isMuted = false;
  private targetVolume = 0.7;
  private pendingKey: string | null = null;
  private listenersAttached = false;
  private fadeTimer: ReturnType<typeof setTimeout> | null = null;

  /** Called once from BootScene or GameContainer to prime the AudioContext */
  init(): void {
    this.attachUnlockListeners();
  }

  /** setScene is kept for API compatibility — no longer needed */
  setScene(_scene: unknown): void {
    // no-op — synth manager is scene-independent
  }

  /** preloadTracks is kept for API compatibility */
  preloadTracks(_scene: unknown): void {
    // no-op — synth needs no preloading
  }

  private getOrCreateContext(): AudioContext | null {
    if (this.ctx) return this.ctx;
    try {
      this.ctx = new (
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext })
          .webkitAudioContext
      )();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(
        this._isMuted ? 0 : this.targetVolume,
        this.ctx.currentTime,
      );
      this.masterGain.connect(this.ctx.destination);
    } catch {
      return null;
    }
    return this.ctx;
  }

  private attachUnlockListeners(): void {
    if (this.listenersAttached) return;
    this.listenersAttached = true;
    const unlock = () => this.resumeAudioContextAndPlay();
    document.addEventListener("click", unlock);
    document.addEventListener("keydown", unlock);
    document.addEventListener("touchstart", unlock);
    document.addEventListener("pointerdown", unlock);
  }

  resumeAudioContext(): void {
    this.resumeAudioContextAndPlay();
  }

  resumeAudioContextAndPlay(): void {
    const ctx = this.getOrCreateContext();
    if (!ctx) return;
    if (ctx.state === "suspended") {
      ctx
        .resume()
        .then(() => {
          this.flushPending();
        })
        .catch(() => undefined);
    } else {
      this.flushPending();
    }
  }

  private flushPending(): void {
    if (this.pendingKey) {
      const key = this.pendingKey;
      this.pendingKey = null;
      this._startSynth(key);
    }
  }

  crossFadeTo(trackKey: string, fadeDuration = 600): void {
    if (this.currentKey === trackKey && this.currentPlayer) return;

    const ctx = this.getOrCreateContext();
    if (!ctx || ctx.state === "suspended") {
      this.pendingKey = trackKey;
      return;
    }

    // Fade out current
    if (this.currentPlayer && this.masterGain) {
      const oldPlayer = this.currentPlayer;
      const gain = this.masterGain;
      this.currentPlayer = null;
      gain.gain.cancelScheduledValues(ctx.currentTime);
      gain.gain.setValueAtTime(gain.gain.value, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(
        0,
        ctx.currentTime + fadeDuration / 1000,
      );
      if (this.fadeTimer) clearTimeout(this.fadeTimer);
      this.fadeTimer = setTimeout(() => {
        oldPlayer.stop();
        if (this.masterGain) {
          this.masterGain.gain.setValueAtTime(
            this._isMuted ? 0 : this.targetVolume,
            ctx.currentTime,
          );
        }
      }, fadeDuration + 50);
    }

    // Start new track after brief overlap
    setTimeout(() => {
      if (this.masterGain && ctx) {
        this.masterGain.gain.cancelScheduledValues(ctx.currentTime);
        this.masterGain.gain.setValueAtTime(0, ctx.currentTime);
        this.masterGain.gain.linearRampToValueAtTime(
          this._isMuted ? 0 : this.targetVolume,
          ctx.currentTime + fadeDuration / 1000,
        );
      }
      this._startSynth(trackKey);
    }, fadeDuration * 0.4);
  }

  play(trackKey: string): void {
    this.crossFadeTo(trackKey, 400);
  }

  private _startSynth(key: string): void {
    const ctx = this.getOrCreateContext();
    if (!ctx || !this.masterGain) return;

    const def = TRACK_DEFS[key];
    if (!def) return;

    // Stop old player if still running
    if (this.currentPlayer) {
      try {
        this.currentPlayer.stop();
      } catch {
        // ignore
      }
    }

    this.currentPlayer = startSynth(ctx, def, this.masterGain);
    this.currentKey = key;
    this.currentName = def.name;
    this.pendingKey = null;
    this.dispatchEvent();
  }

  stop(_fadeDuration = 600): void {
    if (this.currentPlayer) {
      this.currentPlayer.stop();
      this.currentPlayer = null;
    }
    this.currentKey = "";
    this.currentName = "";
    this.dispatchEvent();
  }

  mute(): void {
    this._isMuted = true;
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setValueAtTime(0, this.ctx.currentTime);
    }
    this.dispatchEvent();
  }

  unmute(): void {
    this._isMuted = false;
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setValueAtTime(
        this.targetVolume,
        this.ctx.currentTime,
      );
    }
    this.dispatchEvent();
  }

  toggleMute(): boolean {
    if (this._isMuted) {
      this.unmute();
    } else {
      this.mute();
    }
    return this._isMuted;
  }

  isMuted(): boolean {
    return this._isMuted;
  }

  /** Returns true when AudioContext hasn't been unlocked by a user gesture yet */
  isAudioContextSuspended(): boolean {
    if (!this.ctx) return true;
    return this.ctx.state === "suspended";
  }

  getCurrentTrackName(): string {
    return this.currentName;
  }

  private dispatchEvent(): void {
    try {
      window.dispatchEvent(
        new CustomEvent("music:trackChanged", {
          detail: {
            name: this.currentName,
            key: this.currentKey,
            muted: this._isMuted,
            pending: this.pendingKey,
          },
        }),
      );
    } catch {
      // silently handle
    }
  }
}

export const musicManager = new MusicManager();

// Re-export MUSIC_TRACKS shape so existing callers using .key work
// (crossFadeTo uses the key string directly now)
