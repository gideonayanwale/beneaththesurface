import Phaser from 'phaser';

export class GameOver extends Phaser.Scene {
    constructor() { super('GameOver'); }

    create(data: { reason?: string; depth?: number }) {
        const W = this.scale.width;
        const H = this.scale.height;
        const cx = W / 2;
        const reason = data?.reason ?? 'Unknown';
        const depth = data?.depth ?? 0;

        // Dark overlay
        this.add.rectangle(cx, H / 2, W, H, 0x000000, 0.78);

        // Title
        this.add.text(cx, H * 0.28, 'MISSION FAILED', {
            fontFamily: 'Georgia, serif',
            fontSize: '54px',
            color: '#ff3333',
            stroke: '#550000',
            strokeThickness: 4,
            shadow: { offsetX: 0, offsetY: 0, color: '#ff0000', blur: 24, stroke: true, fill: true },
        }).setOrigin(0.5);

        // Reason
        this.add.text(cx, H * 0.42, reason, {
            fontFamily: 'monospace',
            fontSize: '22px',
            color: '#ffaa88',
        }).setOrigin(0.5);

        // Depth
        this.add.text(cx, H * 0.50, `Depth reached: ${depth}m`, {
            fontFamily: 'monospace',
            fontSize: '16px',
            color: '#666699',
        }).setOrigin(0.5);

        // Buttons
        this._btn(cx - 110, H * 0.65, 'RETRY', 0x00ccff, () => {
            const level = this.registry.get('level') ?? 1;
            this.scene.start('GameScene', { level });
        });

        this._btn(cx + 110, H * 0.65, 'MENU', 0xffaa33, () => {
            this.scene.start('MainMenu');
        });
    }

    private _btn(x: number, y: number, label: string, color: number, cb: () => void) {
        const hex = '#' + color.toString(16).padStart(6, '0');
        const txt = this.add.text(x, y, label, {
            fontFamily: 'monospace',
            fontSize: '24px',
            color: hex,
            backgroundColor: '#0a0a18',
            padding: { x: 20, y: 10 },
        }).setOrigin(0.5).setInteractive({ useHandCursor: true });

        txt.on('pointerover', () => txt.setAlpha(0.75));
        txt.on('pointerout', () => txt.setAlpha(1));
        txt.on('pointerdown', cb);
    }
}
