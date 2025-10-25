export class SoundManager {
  constructor() {
    this.enabled = true;
    this.context = null;
  }

  setEnabled(enabled) {
    this.enabled = enabled;
  }

  ensureContext() {
    if (!this.context) {
      this.context = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (this.context.state === 'suspended') {
      this.context.resume();
    }
  }

  play(type) {
    if (!this.enabled) return;
    this.ensureContext();
    const duration = 0.2;
    const oscillator = this.context.createOscillator();
    const gain = this.context.createGain();

    oscillator.type = type === 'notify' ? 'triangle' : 'sine';
    const baseFrequency = type === 'update' ? 440 : type === 'notify' ? 520 : 360;
    oscillator.frequency.setValueAtTime(baseFrequency, this.context.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(baseFrequency / 2, this.context.currentTime + duration);

    gain.gain.setValueAtTime(0.2, this.context.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.context.currentTime + duration);

    oscillator.connect(gain);
    gain.connect(this.context.destination);

    oscillator.start();
    oscillator.stop(this.context.currentTime + duration);
  }
}
