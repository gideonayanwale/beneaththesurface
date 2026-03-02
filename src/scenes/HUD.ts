import Phaser from 'phaser';

// ─── HUD Scene ───────────────────────────────────────────────────────────────
// Launched alongside GameScene. Reads from registry and draws bars + counters.

const BAR_W = 200;
const BAR_H = 16;
const PAD = 16;

export class HUD extends Phaser.Scene {
    private oxygenBarFill!: Phaser.GameObjects.Rectangle;
    private oxygenBarBg!: Phaser.GameObjects.Rectangle;
    private hullBarFill!: Phaser.GameObjects.Rectangle;
    private hullBarBg!: Phaser.GameObjects.Rectangle;
    private oxygenLabel!: Phaser.GameObjects.Text;
    private hullLabel!: Phaser.GameObjects.Text;
    private depthText!: Phaser.GameObjects.Text;
    private antigravIcon!: Phaser.GameObjects.Text;
    private warningText!: Phaser.GameObjects.Text;
    private warningTween!: Phaser.Tweens.Tween | null;

    constructor() { super({ key: 'HUD', active: false }); }

    create() {
        const W = this.scale.width;

        // ── Oxygen bar ────────────────────────────────────────────────────────
        this.oxygenLabel = this.add.text(PAD, PAD, 'O₂', {
            fontFamily: 'monospace', fontSize: '13px', color: '#88ffee',
        });

        this.oxygenBarBg = this.add.rectangle(PAD + 30, PAD + 7, BAR_W, BAR_H, 0x003322)
            .setOrigin(0, 0.5)
            .setStrokeStyle(1, 0x00aa66);

        this.oxygenBarFill = this.add.rectangle(PAD + 30, PAD + 7, BAR_W, BAR_H, 0x00ffaa)
            .setOrigin(0, 0.5);

        // ── Hull bar ──────────────────────────────────────────────────────────
        this.hullLabel = this.add.text(PAD, PAD + 26, '⚙', {
            fontFamily: 'monospace', fontSize: '13px', color: '#88aaff',
        });

        this.hullBarBg = this.add.rectangle(PAD + 30, PAD + 33, BAR_W, BAR_H, 0x001133)
            .setOrigin(0, 0.5)
            .setStrokeStyle(1, 0x0044aa);

        this.hullBarFill = this.add.rectangle(PAD + 30, PAD + 33, BAR_W, BAR_H, 0x4499ff)
            .setOrigin(0, 0.5);

        // ── Depth counter ─────────────────────────────────────────────────────
        this.depthText = this.add.text(W - PAD, PAD, 'DEPTH  0m', {
            fontFamily: 'monospace', fontSize: '14px', color: '#aaccff',
        }).setOrigin(1, 0);

        // ── Antigrav indicator ────────────────────────────────────────────────
        this.antigravIcon = this.add.text(W - PAD, PAD + 26, '▲ BUOY OFF', {
            fontFamily: 'monospace', fontSize: '12px', color: '#336655',
        }).setOrigin(1, 0);

        // ── Low oxygen warning ────────────────────────────────────────────────
        this.warningText = this.add.text(this.scale.width / 2, 60, '⚠ OXYGEN CRITICAL ⚠', {
            fontFamily: 'monospace', fontSize: '18px', color: '#ff4444',
        }).setOrigin(0.5).setAlpha(0);

        this.warningTween = null;
    }

    update() {
        const o = this.registry.get('hud:oxygen') as number ?? 1;
        const h = this.registry.get('hud:hull') as number ?? 1;
        const depth = this.registry.get('hud:depth') as number ?? 0;
        const antigrav = this.registry.get('hud:antigrav') as boolean ?? false;
        const oxyLow = this.registry.get('hud:oxygenLow') as boolean ?? false;

        // Oxygen bar colour transitions
        const oxyColor = o > 0.5 ? 0x00ffaa : o > 0.25 ? 0xffcc00 : 0xff4444;
        this.oxygenBarFill.setFillStyle(oxyColor);
        this.oxygenBarFill.setSize(BAR_W * Math.max(0, o), BAR_H);

        // Hull bar
        const hullColor = h > 0.5 ? 0x4499ff : h > 0.25 ? 0xff8800 : 0xff2222;
        this.hullBarFill.setFillStyle(hullColor);
        this.hullBarFill.setSize(BAR_W * Math.max(0, h), BAR_H);

        // Depth
        this.depthText.setText(`DEPTH  ${depth}m`);

        // Antigrav
        if (antigrav) {
            this.antigravIcon.setText('▲ BUOY ACTIVE').setColor('#00ffcc');
        } else {
            this.antigravIcon.setText('▼ BUOY OFF').setColor('#336655');
        }

        // Warning text pulse
        if (oxyLow && !this.warningTween) {
            this.warningTween = this.tweens.add({
                targets: this.warningText,
                alpha: { from: 0, to: 1 },
                duration: 400,
                yoyo: true,
                repeat: -1,
            });
        } else if (!oxyLow && this.warningTween) {
            this.warningTween.stop();
            this.warningText.setAlpha(0);
            this.warningTween = null;
        }
    }
}
