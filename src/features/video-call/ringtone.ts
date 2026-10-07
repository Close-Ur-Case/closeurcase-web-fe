/**
 * Web Audio API Ringtone Synthesizer
 * Generates realistic incoming and outgoing phone ringing tones in-browser
 * with zero external MP3 assets, avoiding CORS and network issues.
 */

class RingtoneManager {
  private ctx: AudioContext | null = null;
  private intervalId: number | null = null;
  private isPlaying = false;

  private getContext(): AudioContext | null {
    try {
      if (!this.ctx || this.ctx.state === "closed") {
        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        this.ctx = new AudioContextClass();
      }
      if (this.ctx.state === "suspended") {
        void this.ctx.resume();
      }
      return this.ctx;
    } catch {
      return null;
    }
  }

  /**
   * Play an outgoing ringback tone (Standard North American / European ringback: 440Hz + 480Hz for 1.2s every 3.5s)
   */
  startOutgoingRing() {
    this.stopRing();
    const ctx = this.getContext();
    if (!ctx) return;
    this.isPlaying = true;

    const playBurst = () => {
      if (!this.isPlaying || !this.ctx) return;
      try {
        const now = this.ctx.currentTime;
        const osc1 = this.ctx.createOscillator();
        const osc2 = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc1.frequency.setValueAtTime(440, now);
        osc2.frequency.setValueAtTime(480, now);

        gain.gain.setValueAtTime(0, now);
        gain.gain.linearRampToValueAtTime(0.08, now + 0.05);
        gain.gain.setValueAtTime(0.08, now + 1.2);
        gain.gain.linearRampToValueAtTime(0, now + 1.25);

        osc1.connect(gain);
        osc2.connect(gain);
        gain.connect(this.ctx.destination);

        osc1.start(now);
        osc2.start(now);
        osc1.stop(now + 1.3);
        osc2.stop(now + 1.3);
      } catch {
        // Audio interrupted
      }
    };

    playBurst();
    this.intervalId = window.setInterval(playBurst, 3500);
  }

  /**
   * Play an incoming call ringtone (Melodic dual chime: 520Hz + 660Hz repeating every 2.4s)
   */
  startIncomingRing() {
    this.stopRing();
    const ctx = this.getContext();
    if (!ctx) return;
    this.isPlaying = true;

    const playBurst = () => {
      if (!this.isPlaying || !this.ctx) return;
      try {
        const now = this.ctx.currentTime;
        const osc1 = this.ctx.createOscillator();
        const osc2 = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc1.type = "sine";
        osc2.type = "sine";
        osc1.frequency.setValueAtTime(523.25, now); // C5
        osc2.frequency.setValueAtTime(659.25, now); // E5

        gain.gain.setValueAtTime(0, now);
        gain.gain.linearRampToValueAtTime(0.12, now + 0.05);
        gain.gain.setValueAtTime(0.12, now + 0.8);
        gain.gain.linearRampToValueAtTime(0, now + 0.9);

        // Secondary pulse 0.3s later
        const osc3 = this.ctx.createOscillator();
        const osc4 = this.ctx.createOscillator();
        const gain2 = this.ctx.createGain();

        osc3.frequency.setValueAtTime(587.33, now + 0.25); // D5
        osc4.frequency.setValueAtTime(783.99, now + 0.25); // G5

        gain2.gain.setValueAtTime(0, now + 0.25);
        gain2.gain.linearRampToValueAtTime(0.12, now + 0.3);
        gain2.gain.setValueAtTime(0.12, now + 1.0);
        gain2.gain.linearRampToValueAtTime(0, now + 1.1);

        osc1.connect(gain);
        osc2.connect(gain);
        gain.connect(this.ctx.destination);

        osc3.connect(gain2);
        osc4.connect(gain2);
        gain2.connect(this.ctx.destination);

        osc1.start(now);
        osc2.start(now);
        osc1.stop(now + 1.0);
        osc2.stop(now + 1.0);

        osc3.start(now + 0.25);
        osc4.start(now + 0.25);
        osc3.stop(now + 1.2);
        osc4.stop(now + 1.2);
      } catch {
        // Audio interrupted
      }
    };

    playBurst();
    this.intervalId = window.setInterval(playBurst, 2500);
  }

  /**
   * Stop any playing ringtone immediately
   */
  stopRing() {
    this.isPlaying = false;
    if (this.intervalId !== null) {
      window.clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }
}

export const ringtone = new RingtoneManager();
