const patterns = {
  correct: [[659, 0.11], [880, 0.18]],
  wrong: [[330, 0.14], [220, 0.24]],
  hint: [[523, 0.1], [784, 0.1], [1047, 0.17]],
  win: [[523, 0.13], [659, 0.13], [784, 0.13], [1047, 0.3]],
  loss: [[392, 0.16], [330, 0.18], [262, 0.32]],
};

export class SoundEffects {
  constructor() {
    this.enabled = localStorage.getItem('kings-rescue-sound') !== 'off';
    this.context = null;
    document.addEventListener('pointerdown', () => this.unlock());
    document.addEventListener('keydown', () => this.unlock());
  }

  toggle() {
    this.enabled = !this.enabled;
    localStorage.setItem('kings-rescue-sound', this.enabled ? 'on' : 'off');
    if (this.enabled) this.play('hint');
    return this.enabled;
  }

  unlock() {
    if (!this.enabled) return;
    const AudioContextType = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextType) {
      this.enabled = false;
      return;
    }
    this.context ??= new AudioContextType();
    if (this.context.state === 'suspended') this.context.resume().catch(() => {});
  }

  play(name) {
    if (!this.enabled) return;
    this.unlock();
    const pattern = patterns[name];
    if (!this.context || !pattern) return;

    pattern.forEach(([frequency, duration], index) => {
      const start = this.context.currentTime + index * 0.13;
      const oscillator = this.context.createOscillator();
      const gain = this.context.createGain();
      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(frequency, start);
      gain.gain.setValueAtTime(0.0001, start);
      gain.gain.exponentialRampToValueAtTime(0.3, start + 0.015);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
      oscillator.connect(gain).connect(this.context.destination);
      oscillator.start(start);
      oscillator.stop(start + duration + 0.02);
    });
  }
}