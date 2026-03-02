import Phaser from 'phaser';
import { DIFFICULTY, DifficultyKey } from '../data/DifficultyConfig';

export class MainMenu extends Phaser.Scene {
    private diffKey: DifficultyKey = 'normal';
    private diffBtn!: Phaser.GameObjects.Text;
    private particles!: Phaser.GameObjects.Particles.ParticleEmitter;

    constructor() { super('MainMenu'); }

    create() {
        const W = this.scale.width;
        const H = this.scale.height;
        const cx = W / 2;

        // ── Animated bio-bioluminescent particle field ──────────────────────
        this.particles = this.add.particles(0, 0, 'bubble', {
            x: { min: 0, max: W },
            y: { min: 0, max: H },
            quantity: 1,
            lifespan: { min: 4000, max: 8000 },
            speedX: { min: -10, max: 10 },
            speedY: { min: -30, max: -8 },
            scale: { start: 0.15, end: 0.5 },
            alpha: { start: 0.0, end: 0, ease: 'Sine.InOut' },
            tint: [0x00ffcc, 0x0099ff, 0x66ffee],
            blendMode: 'ADD',
            gravityY: -20,
        });

        // Hack: override alpha with a random start between 0-0.6
        this.particles.setParticleAlpha({
            onEmit: () => Phaser.Math.FloatBetween(0.05, 0.55),
            onUpdate: (_p: Phaser.GameObjects.Particles.Particle, key: string, t: number, value: number) => value * (1 - t),
        });

        // ── Gradient background via Graphics ────────────────────────────────
        const bg = this.add.graphics();
        bg.fillGradientStyle(0x000510, 0x000510, 0x001a4d, 0x001a4d, 1);
        bg.fillRect(0, 0, W, H);

        // ── Title ────────────────────────────────────────────────────────────
        this.add.text(cx, H * 0.18, 'BENEATH', {
            fontFamily: 'Georgia, serif',
            fontSize: '72px',
            color: '#00ccff',
            stroke: '#003366',
            strokeThickness: 4,
            shadow: { offsetX: 0, offsetY: 0, color: '#00ffee', blur: 20, stroke: true, fill: true },
        }).setOrigin(0.5);

        this.add.text(cx, H * 0.30, 'THE SURFACE', {
            fontFamily: 'Georgia, serif',
            fontSize: '36px',
            color: '#66ddff',
            stroke: '#001133',
            strokeThickness: 3,
        }).setOrigin(0.5);

        this.add.text(cx, H * 0.42, '— explore the deep —', {
            fontFamily: 'monospace',
            fontSize: '14px',
            color: '#336688',
        }).setOrigin(0.5);

        // ── Buttons ──────────────────────────────────────────────────────────
        this._makeButton(cx, H * 0.56, '▶  DIVE IN', 0x00ffcc, () => {
            this.registry.set('difficulty', this.diffKey);
            this.registry.set('level', 1);
            this.scene.start('GameScene');
        });

        this._makeButton(cx, H * 0.66, '?  HOW TO PLAY', 0x66aaff, () => {
            this.scene.start('Instructions');
        });

        // Difficulty cycle button
        this.diffBtn = this._makeButton(cx, H * 0.76, this._diffLabel(), 0xffaa44, () => {
            const keys: DifficultyKey[] = ['easy', 'normal', 'hard'];
            const idx = keys.indexOf(this.diffKey);
            this.diffKey = keys[(idx + 1) % keys.length];
            this.diffBtn.setText(this._diffLabel());
        });

        // ── Depth hint ────────────────────────────────────────────────────────
        this.add.text(cx, H - 24, 'WASD / Arrows · SPACE = Buoyancy Toggle', {
            fontFamily: 'monospace', fontSize: '12px', color: '#224466',
        }).setOrigin(0.5);

        // ── Sub silhouette hint looping downward ─────────────────────────────
        const subHint = this.add.image(cx, H * 0.92, 'submarine').setAlpha(0.15).setScale(1.4);
        this.tweens.add({
            targets: subHint,
            y: H * 0.94,
            duration: 2500,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.InOut',
        });
    }

    private _diffLabel() {
        const labels = { easy: '◈  EASY', normal: '◉  NORMAL', hard: '◆  HARD' };
        return `DIFFICULTY: ${labels[this.diffKey]}`;
    }

    private _makeButton(x: number, y: number, label: string, color: number, onClick: () => void) {
        const hex = '#' + color.toString(16).padStart(6, '0');
        const btn = this.add.text(x, y, label, {
            fontFamily: 'monospace',
            fontSize: '22px',
            color: hex,
            stroke: '#000000',
            strokeThickness: 2,
        }).setOrigin(0.5).setInteractive({ useHandCursor: true });

        btn.on('pointerover', () => {
            btn.setScale(1.08);
            btn.setColor('#ffffff');
        });
        btn.on('pointerout', () => {
            btn.setScale(1);
            btn.setColor(hex);
        });
        btn.on('pointerdown', () => {
            this.sound?.play?.('click');
            onClick();
        });

        return btn;
    }
}
