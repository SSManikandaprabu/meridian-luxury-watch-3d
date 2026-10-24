/**
 * Synthesizes an authentic Swiss lever escapement tick (28,800 vph / 4 Hz / 8 beats per sec)
 * using the WebAudio API. Off by default and strictly user-initiated.
 */
class MechanicalEscapementAudio {
  private ctx: AudioContext | null = null;
  private timerId: number | null = null;
  private isRunning = false;
  private beatCount = 0;

  public start(): void {
    if (this.isRunning) return;
    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!this.ctx) {
      this.ctx = new AudioCtx();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    this.isRunning = true;
    // 28,800 vibrations per hour = 8 beats per second = 125ms interval
    this.timerId = window.setInterval(() => {
      this.triggerImpulse();
    }, 125);
  }

  public stop(): void {
    this.isRunning = false;
    if (this.timerId !== null) {
      window.clearInterval(this.timerId);
      this.timerId = null;
    }
  }

  private triggerImpulse(): void {
    if (!this.ctx || !this.isRunning) return;
    const now = this.ctx.currentTime;
    const isTick = this.beatCount % 2 === 0;
    this.beatCount++;

    // Very soft escapement pallet stone impulse
    const osc = this.ctx.createOscillator();
    const filter = this.ctx.createBiquadFilter();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(isTick ? 4150 : 3820, now);
    osc.frequency.exponentialRampToValueAtTime(isTick ? 1850 : 1680, now + 0.008);

    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(isTick ? 3900 : 3500, now);
    filter.Q.setValueAtTime(7.5, now);

    const peakGain = isTick ? 0.016 : 0.012;
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.linearRampToValueAtTime(peakGain, now + 0.0012);
    gain.gain.exponentialRampToValueAtTime(0.00005, now + 0.014);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.015);
  }
}

export const escapementAudio = new MechanicalEscapementAudio();
