import Phaser from 'phaser';
import { Submarine } from '../objects/Submarine';
import { Enemy } from '../objects/Enemy';
import { AudioManager } from '../audio/AudioManager';
import { LEVEL_CONFIGS, LevelConfig } from '../data/LevelConfig';
import { DIFFICULTY, DifficultyKey } from '../data/DifficultyConfig';

export class GameScene extends Phaser.Scene {
    // ── References ────────────────────────────────────────────────────────────
    private submarine!: Submarine;
    private enemies!: Phaser.GameObjects.Group;
    private artifacts!: Phaser.GameObjects.Group;
    private portal!: Phaser.GameObjects.Sprite | null;
    private audio!: AudioManager;

    // ── Level state ────────────────────────────────────────────────────────────
    private levelCfg!: LevelConfig;
    private artifactsCollected: number = 0;
    private portalOpen: boolean = false;

    // ── HUD / Pressure ─────────────────────────────────────────────────────────
    private pressureTimer: number = 0;
    private oxyWasLow: boolean = false;

    constructor() { super('GameScene'); }

    create(data?: { level?: number }) {
        // ── Config ─────────────────────────────────────────────────────────────
        const levelId = data?.level ?? (this.registry.get('level') as number) ?? 1;
        this.registry.set('level', levelId);
        this.levelCfg = LEVEL_CONFIGS[Math.min(levelId - 1, LEVEL_CONFIGS.length - 1)];

        const diffKey = (this.registry.get('difficulty') as DifficultyKey) ?? 'normal';
        const diff = DIFFICULTY[diffKey];

        this.artifactsCollected = 0;
        this.portalOpen = false;
        this.portal = null;
        this.pressureTimer = 0;
        this.oxyWasLow = false;

        const W = this.levelCfg.worldWidth;
        const H = this.levelCfg.worldHeight;

        // ── Audio ──────────────────────────────────────────────────────────────
        this.audio = new AudioManager();
        this.audio.resume();

        // ── Physics world ─────────────────────────────────────────────────────
        this.physics.world.gravity.y = this.levelCfg.gravity;
        this.physics.world.setBounds(0, 0, W, H);

        // ── Background ────────────────────────────────────────────────────────
        this._buildBackground(W, H);

        // ── Tilemap (procedural rock walls) ──────────────────────────────────
        const walls = this._buildWalls(W, H);

        // ── God rays (level 1 only) ──────────────────────────────────────────
        if (this.levelCfg.godRays) this._buildGodRays(W);

        // ── Darkness overlay ──────────────────────────────────────────────────
        if (this.levelCfg.darkOverlayAlpha > 0) {
            this.add.rectangle(W / 2, H / 2, W, H, 0x000000, this.levelCfg.darkOverlayAlpha)
                .setDepth(80);
        }

        // ── Bubbles ────────────────────────────────────────────────────────────
        this._buildBubbles(W, H);

        // ── Artifacts ─────────────────────────────────────────────────────────
        this.artifacts = this.add.group();
        this._spawnArtifacts(W, H);

        // ── Enemies ───────────────────────────────────────────────────────────
        this.enemies = this.add.group();
        this._spawnEnemies(W, H, diff.enemySpeedMult);

        // ── Submarine (spawn near top-centre) ─────────────────────────────────
        this.submarine = new Submarine(this, W / 2, 200, this.audio, diff);

        // ── Collisions ────────────────────────────────────────────────────────
        // Sub vs walls
        this.physics.add.collider(this.submarine, walls, () => {
            this.submarine.takeDamage(8);
        });

        // Enemies vs walls
        this.physics.add.collider(this.enemies, walls);

        // Sub vs enemies
        this.physics.add.overlap(this.submarine, this.enemies, (_sub, enemyObj) => {
            const enemy = enemyObj as Enemy;
            this.submarine.takeDamage(enemy.getDamage());
        });

        // Sub vs artifacts
        this.physics.add.overlap(this.submarine, this.artifacts, (_sub, artObj) => {
            const art = artObj as Phaser.GameObjects.Sprite;
            if (!art.active) return;
            art.destroy();
            this.artifactsCollected++;
            this.audio.playCollect();
            this._updateArtifactUI();

            if (this.artifactsCollected >= this.levelCfg.artifactsRequired && !this.portalOpen) {
                this._openPortal(W, H);
            }
        });

        // ── Camera ────────────────────────────────────────────────────────────
        this.cameras.main.setBounds(0, 0, W, H);
        this.cameras.main.startFollow(this.submarine, true, 0.06, 0.06);
        this.cameras.main.setBackgroundColor(this.levelCfg.bgColor);

        // ── HUD scene ─────────────────────────────────────────────────────────
        if (!this.scene.isActive('HUD')) this.scene.launch('HUD');
        else this.scene.wake('HUD');

        // ── Death handler ─────────────────────────────────────────────────────
        this.events.on('submarine:dead', (reason: string) => {
            this.scene.sleep('HUD');
            this.scene.start('GameOver', {
                reason,
                depth: Math.floor(this.submarine.y / 10),
            });
        });

        // ── Artifact count HUD init ────────────────────────────────────────────
        this._updateArtifactUI();
    }

    update(_time: number, delta: number) {
        if (!this.submarine?.isAlive) return;

        // Enemy AI
        this.enemies.getChildren().forEach(e => {
            (e as Enemy).patrol(this.submarine.x, this.submarine.y);
        });

        // Portal overlap check
        if (this.portal && this.portalOpen) {
            const dist = Phaser.Math.Distance.Between(
                this.submarine.x, this.submarine.y,
                this.portal.x, this.portal.y
            );
            if (dist < 40) this._nextLevel();
        }

        // Pressure damage (deep levels)
        if (this.levelCfg.pressureDamageInterval > 0) {
            this.pressureTimer += delta;
            if (this.pressureTimer >= this.levelCfg.pressureDamageInterval) {
                this.pressureTimer = 0;
                this.submarine.takeDamage(Phaser.Math.Between(8, 12));
                this.cameras.main.shake(200, 0.008);
            }
        }

        // Oxygen warning SFX
        const oxyLow = (this.registry.get('hud:oxygenLow') as boolean) ?? false;
        if (oxyLow && !this.oxyWasLow) this.audio.startOxygenWarning();
        else if (!oxyLow && this.oxyWasLow) this.audio.stopOxygenWarning();
        this.oxyWasLow = oxyLow;
    }

    // ── Builder helpers ────────────────────────────────────────────────────────

    private _buildBackground(W: number, H: number) {
        // Two parallax layers using tileSprite-like approach
        // Layer 1: deep glow gradient at horizon
        const layer1 = this.add.graphics();
        layer1.fillGradientStyle(
            Phaser.Display.Color.HexStringToColor('#' + this.levelCfg.bgColor.toString(16).padStart(6, '0')).color,
            Phaser.Display.Color.HexStringToColor('#' + this.levelCfg.bgColor.toString(16).padStart(6, '0')).color,
            0x000000, 0x000000, 1
        );
        layer1.fillRect(0, 0, W, H);
        layer1.setDepth(-10);

        // Some distant geometric shapes to suggest rock formations
        const rockBg = this.add.graphics().setDepth(-8).setAlpha(0.25);
        rockBg.fillStyle(0x112244, 1);
        for (let i = 0; i < 20; i++) {
            const rx = Phaser.Math.Between(0, W);
            const ry = Phaser.Math.Between(H * 0.3, H);
            const rw = Phaser.Math.Between(60, 220);
            const rh = Phaser.Math.Between(30, 90);
            rockBg.fillEllipse(rx, ry, rw, rh);
        }
    }

    private _buildWalls(W: number, H: number): Phaser.Physics.Arcade.StaticGroup {
        const walls = this.physics.add.staticGroup();
        const TILE = 32;

        // Top ceiling
        for (let x = 0; x < W; x += TILE) {
            walls.create(x + TILE / 2, TILE / 2, 'tile_rock').setDepth(5);
        }

        // Bottom floor
        for (let x = 0; x < W; x += TILE) {
            walls.create(x + TILE / 2, H - TILE / 2, 'tile_floor').setDepth(5);
        }

        // Left wall
        for (let y = TILE; y < H - TILE; y += TILE) {
            walls.create(TILE / 2, y + TILE / 2, 'tile_rock').setDepth(5);
        }

        // Right wall
        for (let y = TILE; y < H - TILE; y += TILE) {
            walls.create(W - TILE / 2, y + TILE / 2, 'tile_rock').setDepth(5);
        }

        // Interior rock formations (randomised per level seed)
        const numFormations = 8 + this.levelCfg.id * 2;
        for (let i = 0; i < numFormations; i++) {
            const fx = Phaser.Math.Between(TILE * 3, W - TILE * 3);
            const fy = Phaser.Math.Between(H * 0.2, H - TILE * 4);
            const len = Phaser.Math.Between(3, 8);
            const horiz = Math.random() > 0.5;
            for (let j = 0; j < len; j++) {
                const tx = fx + (horiz ? j * TILE : 0);
                const ty = fy + (horiz ? 0 : j * TILE);
                walls.create(tx, ty, 'tile_rock').setDepth(5);
            }
        }

        return walls;
    }

    private _buildGodRays(W: number) {
        const numRays = 12;
        for (let i = 0; i < numRays; i++) {
            const rx = Phaser.Math.Between(80, W - 80);
            const ray = this.add.image(rx, -10, 'god_ray')
                .setOrigin(0.5, 0)
                .setBlendMode(Phaser.BlendModes.ADD)
                .setAlpha(Phaser.Math.FloatBetween(0.04, 0.14))
                .setDepth(-5)
                .setScale(Phaser.Math.FloatBetween(1, 2.5), 3);

            this.tweens.add({
                targets: ray,
                alpha: { from: ray.alpha * 0.3, to: ray.alpha },
                duration: Phaser.Math.Between(3000, 7000),
                yoyo: true,
                repeat: -1,
                ease: 'Sine.InOut',
            });
        }
    }

    private _buildBubbles(W: number, H: number) {
        const emitter = this.add.particles(0, 0, 'bubble', {
            x: { min: 64, max: W - 64 },
            y: H,
            quantity: 1,
            lifespan: { min: 8000, max: 16000 },
            speedY: { min: -60, max: -120 },
            speedX: { min: -10, max: 10 },
            scale: { start: 0.3, end: 0.8 },
            alpha: { start: 0.6, end: 0 },
            blendMode: 'ADD',
            gravityY: -50,
        }).setDepth(10);

        emitter.advance(8000);
    }

    private _spawnArtifacts(W: number, H: number) {
        const margin = 100;
        for (let i = 0; i < this.levelCfg.artifactsTotal; i++) {
            const x = Phaser.Math.Between(margin, W - margin);
            const y = Phaser.Math.Between(H * 0.15, H - margin);
            const art = this.physics.add.sprite(x, y, 'artifact').setDepth(15);
            (art.body as Phaser.Physics.Arcade.Body).setAllowGravity(false);
            this.artifacts.add(art);

            // Gentle pulsing glow
            this.tweens.add({
                targets: art,
                alpha: { from: 0.6, to: 1 },
                scale: { from: 0.85, to: 1.15 },
                duration: 1200 + i * 120,
                yoyo: true,
                repeat: -1,
                ease: 'Sine.InOut',
            });
        }
    }

    private _spawnEnemies(W: number, H: number, speedMult: number) {
        const margin = 150;
        for (let i = 0; i < this.levelCfg.enemyCount; i++) {
            const x = Phaser.Math.Between(margin, W - margin);
            const y = Phaser.Math.Between(H * 0.15, H - margin);
            const patrolW = Phaser.Math.Between(120, 300);
            const enemy = new Enemy(
                this,
                x, y,
                Math.max(margin, x - patrolW),
                Math.min(W - margin, x + patrolW),
                speedMult
            );
            enemy.setDepth(12);
            this.enemies.add(enemy);
        }
    }

    private _openPortal(W: number, H: number) {
        this.portalOpen = true;
        this.audio.playLevelComplete();
        this.cameras.main.flash(400, 0, 255, 200);

        // Spawn portal at centre-bottom of the level
        this.portal = this.physics.add.sprite(W / 2, H - 120, 'portal')
            .setDepth(20)
            .setScale(1.5);
        (this.portal.body as Phaser.Physics.Arcade.Body).setAllowGravity(false);

        this.tweens.add({
            targets: this.portal,
            scale: { from: 1.2, to: 1.8 },
            alpha: { from: 0, to: 1 },
            duration: 600,
            yoyo: false,
        });

        this.tweens.add({
            targets: this.portal,
            angle: 360,
            duration: 4000,
            repeat: -1,
            ease: 'Linear',
        });

        // Prompt text fixed to camera
        const promptTxt = this.add.text(W / 2, H - 70, '◈ PORTAL OPEN — DIVE THROUGH ◈', {
            fontFamily: 'monospace', fontSize: '15px', color: '#00ffcc',
        }).setOrigin(0.5).setDepth(25);
        this.tweens.add({ targets: promptTxt, alpha: { from: 0.4, to: 1 }, duration: 700, yoyo: true, repeat: -1 });
    }

    private _nextLevel() {
        const nextId = this.levelCfg.id + 1;
        this.audio.stopOxygenWarning();
        this.scene.sleep('HUD');

        if (nextId > LEVEL_CONFIGS.length) {
            // Game complete – for now restart from 1
            this.registry.set('level', 1);
            this.scene.start('MainMenu');
        } else {
            this.registry.set('level', nextId);
            this.scene.start('GameScene', { level: nextId });
        }
    }

    private _updateArtifactUI() {
        this.registry.set(
            'hud:artifacts',
            `${this.artifactsCollected}/${this.levelCfg.artifactsRequired}`
        );
    }
}
