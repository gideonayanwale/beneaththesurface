import Phaser from 'phaser';

export class Preloader extends Phaser.Scene {
    constructor() { super('Preloader'); }

    preload() {
        // Display a loading bar while we generate textures
        const W = this.scale.width;
        const H = this.scale.height;
        const barW = 300, barH = 12;
        const barX = W / 2 - barW / 2;
        const barY = H / 2;

        const bg = this.add.graphics();
        bg.fillStyle(0x001a33);
        bg.fillRect(barX - 2, barY - 2, barW + 4, barH + 4);
        const bar = this.add.graphics();

        this.load.on('progress', (v: number) => {
            bar.clear();
            bar.fillStyle(0x00ccff);
            bar.fillRect(barX, barY, barW * v, barH);
        });

        this.add.text(W / 2, H / 2 - 36, 'BENEATH THE SURFACE', {
            fontFamily: 'Georgia, serif', fontSize: '28px', color: '#00ccff',
        }).setOrigin(0.5);

        this.add.text(W / 2, H / 2 + 32, 'Preparing the deep...', {
            fontFamily: 'monospace', fontSize: '13px', color: '#336688',
        }).setOrigin(0.5);
    }

    create() {
        this._generateTextures();
        this.scene.start('MainMenu');
    }

    private _generateTextures() {
        const g = this.make.graphics({});

        // ── Submarine ──────────────────────────────────────────────────────────
        // Hull (ellipse)
        g.clear();
        g.fillStyle(0x0077aa, 1);
        g.fillEllipse(32, 20, 52, 26);
        // Conning tower
        g.fillStyle(0x005588, 1);
        g.fillRect(22, 8, 20, 10);
        // Porthole
        g.fillStyle(0x00eeff, 0.9);
        g.fillCircle(30, 8, 4);
        g.fillStyle(0x003355, 0.5);
        g.fillCircle(30, 8, 2);
        // Nose pointer (direction indicator)
        g.fillStyle(0x00ffcc, 1);
        g.fillTriangle(56, 20, 50, 14, 50, 26);
        // Propeller dots
        g.fillStyle(0xaaeeff, 0.7);
        g.fillCircle(8, 14, 4);
        g.fillCircle(8, 26, 4);
        g.generateTexture('submarine', 64, 40);

        // ── Enemy fish ─────────────────────────────────────────────────────────
        g.clear();
        g.fillStyle(0xff6644, 1);
        g.fillEllipse(20, 12, 32, 16); // body
        g.fillStyle(0xff4422, 1);
        g.fillTriangle(0, 6, 0, 18, 10, 12); // tail
        g.fillStyle(0xffeecc, 1);
        g.fillCircle(28, 10, 3); // eye
        g.fillStyle(0x000000, 1);
        g.fillCircle(29, 10, 1.5);
        g.generateTexture('enemy', 40, 24);

        // ── Rock tile ──────────────────────────────────────────────────────────
        g.clear();
        g.fillStyle(0x1a1a2e, 1);
        g.fillRect(0, 0, 32, 32);
        g.fillStyle(0x22223a, 0.7);
        g.fillRect(2, 2, 14, 14);
        g.fillRect(18, 16, 12, 12);
        g.lineStyle(1, 0x333355, 0.5);
        g.strokeRect(0, 0, 32, 32);
        g.generateTexture('tile_rock', 32, 32);

        // ── Floor tile ──────────────────────────────────────────────────────────
        g.clear();
        g.fillStyle(0x111128, 1);
        g.fillRect(0, 0, 32, 32);
        g.fillStyle(0x1a1a40, 0.6);
        g.fillRect(0, 0, 32, 6);
        g.lineStyle(1, 0x222244, 0.4);
        g.strokeRect(0, 0, 32, 32);
        g.generateTexture('tile_floor', 32, 32);

        // ── Artifact (glowing orb) ─────────────────────────────────────────────
        g.clear();
        g.fillStyle(0xffee00, 0.2);
        g.fillCircle(16, 16, 16);
        g.fillStyle(0xffee00, 0.4);
        g.fillCircle(16, 16, 10);
        g.fillStyle(0xffffff, 0.9);
        g.fillCircle(16, 16, 5);
        g.lineStyle(2, 0xffcc00, 0.8);
        g.strokeCircle(16, 16, 14);
        g.generateTexture('artifact', 32, 32);

        // ── Portal ────────────────────────────────────────────────────────────
        g.clear();
        g.lineStyle(4, 0x00ffcc, 0.9);
        g.strokeCircle(24, 24, 20);
        g.lineStyle(2, 0x00eebb, 0.5);
        g.strokeCircle(24, 24, 16);
        g.fillStyle(0x00ffcc, 0.1);
        g.fillCircle(24, 24, 20);
        g.generateTexture('portal', 48, 48);

        // ── Bubble ────────────────────────────────────────────────────────────
        g.clear();
        g.fillStyle(0xaaddff, 0.5);
        g.fillCircle(5, 5, 5);
        g.lineStyle(1, 0xffffff, 0.4);
        g.strokeCircle(5, 5, 5);
        g.generateTexture('bubble', 10, 10);

        // ── God-ray gradient ──────────────────────────────────────────────────
        g.clear();
        g.fillStyle(0x88ccff, 0.0);
        g.fillRect(0, 0, 20, 240);
        // Phaser doesn't do per-pixel alpha in graphics directly, we'll use
        // a simple light rectangle that we alpha-tween in-scene
        g.fillStyle(0x88ccff, 0.06);
        g.fillRect(4, 0, 12, 240);
        g.generateTexture('god_ray', 20, 240);

        g.destroy();
    }
}
