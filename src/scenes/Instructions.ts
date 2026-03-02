import Phaser from 'phaser';

export class Instructions extends Phaser.Scene {
    constructor() { super('Instructions'); }

    create() {
        const W = this.scale.width;
        const H = this.scale.height;
        const cx = W / 2;

        // Backdrop
        this.add.graphics()
            .fillGradientStyle(0x000a1a, 0x000a1a, 0x001a33, 0x001a33, 1)
            .fillRect(0, 0, W, H);

        this.add.text(cx, 36, 'HOW TO PLAY', {
            fontFamily: 'Georgia, serif',
            fontSize: '38px',
            color: '#00ccff',
            stroke: '#002244',
            strokeThickness: 3,
        }).setOrigin(0.5);

        // Two-column layout
        const leftX = 80;
        const rightX = cx + 40;
        let y = 100;

        // ── Controls ───────────────────────────────────────────────────────────
        this._section(leftX, y, '🎮 CONTROLS');
        y += 36;
        const controls = [
            ['W / ↑', 'Thrust forward'],
            ['S / ↓', 'Reverse'],
            ['A / ←', 'Rotate left'],
            ['D / →', 'Rotate right'],
            ['SPACE', 'Toggle buoyancy'],
        ];
        controls.forEach(([key, desc]) => {
            this._row(leftX, y, key, desc);
            y += 28;
        });

        // ── Mechanics ─────────────────────────────────────────────────────────
        y = 100;
        this._section(rightX, y, '⚗️  MECHANICS');
        y += 36;

        this._para(rightX, y, W / 2 - 60, [
            '🫧 BUOYANCY TOGGLE',
            'Press SPACE to switch between sinking',
            '(gravity pulls you down) and floating',
            '(antigravity lifts you up). Buoyancy',
            'drains Oxygen faster!',
        ]);
        y += 156;

        this._para(rightX, y, W / 2 - 60, [
            '🫁 OXYGEN',
            'Your lifeline. Shown top-left in green.',
            'Drain speeds up during buoyancy mode.',
            'Turns red when critical. Reach 0 = fatal.',
        ]);
        y += 128;

        this._para(rightX, y, W / 2 - 60, [
            '⚙ HULL INTEGRITY',
            'Shown below oxygen bar. Enemies and',
            'terrain collisions reduce it.',
            'Reach 0 = mission failed.',
        ]);

        // ── Objectives ────────────────────────────────────────────────────────
        y = H - 160;
        this._section(leftX, y, '🎯 OBJECTIVES');
        y += 32;
        [
            '• Collect the required number of glowing Artifacts',
            '• A portal appears once enough are collected',
            '• Swim through to advance to the next depth zone',
            '• Avoid enemies, manage your oxygen carefully',
        ].forEach(line => {
            this.add.text(leftX, y, line, {
                fontFamily: 'monospace', fontSize: '13px', color: '#aabbdd',
            });
            y += 24;
        });

        // ── Back button ───────────────────────────────────────────────────────
        const back = this.add.text(cx, H - 28, '◄ BACK TO MENU', {
            fontFamily: 'monospace',
            fontSize: '18px',
            color: '#ff9933',
        }).setOrigin(0.5).setInteractive({ useHandCursor: true });

        back.on('pointerover', () => back.setAlpha(0.7));
        back.on('pointerout', () => back.setAlpha(1));
        back.on('pointerdown', () => this.scene.start('MainMenu'));
    }

    private _section(x: number, y: number, label: string) {
        this.add.text(x, y, label, {
            fontFamily: 'monospace',
            fontSize: '15px',
            color: '#66ffcc',
            stroke: '#002211',
            strokeThickness: 2,
        });
    }

    private _row(x: number, y: number, key: string, desc: string) {
        this.add.text(x, y, key, {
            fontFamily: 'monospace', fontSize: '14px', color: '#ffcc44',
        });
        this.add.text(x + 90, y, desc, {
            fontFamily: 'monospace', fontSize: '14px', color: '#aaccee',
        });
    }

    private _para(x: number, y: number, _maxW: number, lines: string[]) {
        lines.forEach((line, i) => {
            this.add.text(x, y + i * 22, line, {
                fontFamily: 'monospace',
                fontSize: i === 0 ? '14px' : '12px',
                color: i === 0 ? '#88eeff' : '#7799aa',
            });
        });
    }
}
