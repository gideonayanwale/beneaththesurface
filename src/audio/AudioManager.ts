// ─── AudioManager ───────────────────────────────────────────────────────────
// Uses Web Audio API directly – no external audio files required.
// All sounds are synthesised procedurally so the game works offline on itch.io.

export class AudioManager {
    private ctx: AudioContext;
    private masterGain: GainNode;
    private engineOsc: OscillatorNode | null = null;
    private engineGain: GainNode | null = null;
    private warningInterval: ReturnType<typeof setInterval> | null = null;

    constructor() {
        this.ctx = new AudioContext();
        this.masterGain = this.ctx.createGain();
        this.masterGain.gain.value = 0.45;
        this.masterGain.connect(this.ctx.destination);
    }

    /** Resume context after first user interaction (browser policy). */
    resume() {
        if (this.ctx.state === 'suspended') this.ctx.resume();
    }

    // ── Engine hum ──────────────────────────────────────────────────────────
    startEngineHum() {
        if (this.engineOsc) return;
        this.engineGain = this.ctx.createGain();
        this.engineGain.gain.value = 0;
        this.engineGain.connect(this.masterGain);

        this.engineOsc = this.ctx.createOscillator();
        this.engineOsc.type = 'triangle';
        this.engineOsc.frequency.value = 80;
        this.engineOsc.connect(this.engineGain);
        this.engineOsc.start();

        this.engineGain.gain.linearRampToValueAtTime(0.15, this.ctx.currentTime + 0.15);
    }

    stopEngineHum() {
        if (!this.engineOsc || !this.engineGain) return;
        this.engineGain.gain.linearRampToValueAtTime(0, this.ctx.currentTime + 0.2);
        const osc = this.engineOsc;
        setTimeout(() => osc.stop(), 250);
        this.engineOsc = null;
        this.engineGain = null;
    }

    // ── Antigravity toggle ───────────────────────────────────────────────────
    playAntigravOn() {
        this._sweep(220, 440, 0.3, 'sine', 0.18);
    }

    playAntigravOff() {
        this._sweep(440, 220, 0.3, 'sine', 0.18);
    }

    // ── Collect artifact ─────────────────────────────────────────────────────
    playCollect() {
        [523, 659, 784].forEach((freq, i) => {
            setTimeout(() => this._tone(freq, 0.12, 'sine', 0.2), i * 60);
        });
    }

    // ── Hull damage ──────────────────────────────────────────────────────────
    playHullDamage() {
        this._noise(0.08, 0.22);
        this._tone(55, 0.08, 'sawtooth', 0.25);
    }

    // ── Oxygen warning ───────────────────────────────────────────────────────
    startOxygenWarning() {
        if (this.warningInterval) return;
        this.warningInterval = setInterval(() => {
            this._tone(880, 0.07, 'square', 0.1);
        }, 1500);
    }

    stopOxygenWarning() {
        if (this.warningInterval) {
            clearInterval(this.warningInterval);
            this.warningInterval = null;
        }
    }

    // ── Death ────────────────────────────────────────────────────────────────
    playDeath() {
        this.stopEngineHum();
        this.stopOxygenWarning();
        this._sweep(200, 40, 1.2, 'sawtooth', 0.35);
    }

    // ── UI click ─────────────────────────────────────────────────────────────
    playClick() {
        this._tone(440, 0.05, 'sine', 0.12);
    }

    // ── Level complete ────────────────────────────────────────────────────────
    playLevelComplete() {
        [523, 659, 784, 1047].forEach((freq, i) => {
            setTimeout(() => this._tone(freq, 0.18, 'sine', 0.3), i * 80);
        });
    }

    // ── Bubble burst (antigrav) ───────────────────────────────────────────────
    playBubbles() {
        this._noise(0.06, 0.12);
    }

    setMasterVolume(v: number) {
        this.masterGain.gain.value = Math.max(0, Math.min(1, v));
    }

    // ── Internals ─────────────────────────────────────────────────────────────
    private _tone(freq: number, duration: number, type: OscillatorType, gain: number) {
        const g = this.ctx.createGain();
        g.gain.value = gain;
        g.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + duration);
        g.connect(this.masterGain);

        const osc = this.ctx.createOscillator();
        osc.type = type;
        osc.frequency.value = freq;
        osc.connect(g);
        osc.start();
        osc.stop(this.ctx.currentTime + duration);
    }

    private _sweep(fromFreq: number, toFreq: number, duration: number, type: OscillatorType, gain: number) {
        const g = this.ctx.createGain();
        g.gain.value = gain;
        g.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + duration);
        g.connect(this.masterGain);

        const osc = this.ctx.createOscillator();
        osc.type = type;
        osc.frequency.setValueAtTime(fromFreq, this.ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(toFreq, this.ctx.currentTime + duration);
        osc.connect(g);
        osc.start();
        osc.stop(this.ctx.currentTime + duration + 0.05);
    }

    private _noise(duration: number, gain: number) {
        const bufLen = this.ctx.sampleRate * duration;
        const buf = this.ctx.createBuffer(1, bufLen, this.ctx.sampleRate);
        const data = buf.getChannelData(0);
        for (let i = 0; i < bufLen; i++) data[i] = Math.random() * 2 - 1;

        const src = this.ctx.createBufferSource();
        src.buffer = buf;

        const filter = this.ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.value = 800;
        filter.Q.value = 0.5;

        const g = this.ctx.createGain();
        g.gain.value = gain;
        g.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + duration);

        src.connect(filter);
        filter.connect(g);
        g.connect(this.masterGain);
        src.start();
        src.stop(this.ctx.currentTime + duration);
    }
}
