/**
 * Web Audio API procedural sound synthesizer for realistic laboratory sound effects
 * and Web Speech Synthesis for Arabic AI Lab Assistant narration.
 */

class LabAudioEngine {
  private ctx: AudioContext | null = null;
  private stirrerOsc: OscillatorNode | null = null;
  private stirrerGain: GainNode | null = null;
  private isMuted: boolean = false;

  private initContext() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  public setMuted(muted: boolean) {
    this.isMuted = muted;
    if (muted && this.stirrerGain && this.ctx) {
      this.stirrerGain.gain.setValueAtTime(0, this.ctx.currentTime);
    }
  }

  public getMuted(): boolean {
    return this.isMuted;
  }

  /**
   * Sound of a water/chemical drop falling from burette
   */
  public playDripSound() {
    if (this.isMuted) return;
    try {
      this.initContext();
      if (!this.ctx) return;

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      const startTime = this.ctx.currentTime;
      // High frequency pitch glide down (typical liquid droplet resonance)
      osc.type = 'sine';
      osc.frequency.setValueAtTime(1400, startTime);
      osc.frequency.exponentialRampToValueAtTime(450, startTime + 0.08);

      gain.gain.setValueAtTime(0.2, startTime);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.09);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(startTime);
      osc.stop(startTime + 0.1);
    } catch {
      // AudioContext might be blocked until user gesture
    }
  }

  /**
   * Delicate glass clink (pipette touching beaker or flask glass)
   */
  public playGlassClink() {
    if (this.isMuted) return;
    try {
      this.initContext();
      if (!this.ctx) return;

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      const startTime = this.ctx.currentTime;
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(2600, startTime);
      osc.frequency.exponentialRampToValueAtTime(2200, startTime + 0.18);

      gain.gain.setValueAtTime(0.25, startTime);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.2);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(startTime);
      osc.stop(startTime + 0.22);
    } catch {
      // ignore
    }
  }

  /**
   * UI Click / Stopcock valve rotation notch
   */
  public playClickSound() {
    if (this.isMuted) return;
    try {
      this.initContext();
      if (!this.ctx) return;

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      const startTime = this.ctx.currentTime;
      osc.type = 'square';
      osc.frequency.setValueAtTime(600, startTime);
      osc.frequency.exponentialRampToValueAtTime(150, startTime + 0.03);

      gain.gain.setValueAtTime(0.12, startTime);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.035);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(startTime);
      osc.stop(startTime + 0.04);
    } catch {
      // ignore
    }
  }

  /**
   * Continuous low motor hum for magnetic stirrer
   */
  public updateStirrerSound(active: boolean, rpm: number = 300) {
    if (this.isMuted || !active) {
      if (this.stirrerOsc && this.stirrerGain && this.ctx) {
        this.stirrerGain.gain.setValueAtTime(0, this.ctx.currentTime);
      }
      return;
    }

    try {
      this.initContext();
      if (!this.ctx) return;

      if (!this.stirrerOsc) {
        this.stirrerOsc = this.ctx.createOscillator();
        this.stirrerGain = this.ctx.createGain();

        this.stirrerOsc.type = 'sine';
        this.stirrerOsc.frequency.setValueAtTime(90, this.ctx.currentTime);

        this.stirrerGain.gain.setValueAtTime(0.04, this.ctx.currentTime);

        this.stirrerOsc.connect(this.stirrerGain);
        this.stirrerGain.connect(this.ctx.destination);

        this.stirrerOsc.start();
      }

      const freq = 60 + (rpm / 1000) * 80;
      this.stirrerOsc.frequency.setValueAtTime(freq, this.ctx.currentTime);
      this.stirrerGain?.gain.setValueAtTime(0.04, this.ctx.currentTime);
    } catch {
      // ignore
    }
  }

  /**
   * Musical fanfare when equivalence point is reached
   */
  public playSuccessChime() {
    if (this.isMuted) return;
    try {
      this.initContext();
      if (!this.ctx) return;

      const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
      const startTime = this.ctx.currentTime;

      notes.forEach((freq, idx) => {
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        const t = startTime + idx * 0.12;
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, t);

        gain.gain.setValueAtTime(0.2, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.4);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(t);
        osc.stop(t + 0.45);
      });
    } catch {
      // ignore
    }
  }

  /**
   * Spoken Arabic announcement using Web Speech Synthesis API
   */
  public speakArabic(text: string) {
    if (this.isMuted || !('speechSynthesis' in window)) return;
    try {
      window.speechSynthesis.cancel(); // Stop any pending speech
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'ar-SA';
      utterance.rate = 1.0;
      utterance.pitch = 1.0;

      // Find Arabic voice if installed
      const voices = window.speechSynthesis.getVoices();
      const arVoice = voices.find(v => v.lang.startsWith('ar'));
      if (arVoice) {
        utterance.voice = arVoice;
      }

      window.speechSynthesis.speak(utterance);
    } catch {
      // ignore
    }
  }
}

export const labAudio = new LabAudioEngine();
