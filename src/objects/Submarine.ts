import Phaser from 'phaser';
import { AudioManager } from '../audio/AudioManager';
import type { DifficultyConfig } from '../data/DifficultyConfig';

// ─── Tuning Constants ────────────────────────────────────────────────────────
// Adjust these numbers to feel the difference immediately.
export const SUB_CONSTANTS = {
    DRAG: 0.96,              // Velocity decay per frame (0-1, higher = less drag)
    THRUST: 700,             // Forward acceleration (px/s²)
    REVERSE_THRUST: 280,     // Backward acceleration (px/s²)
    MAX_VELOCITY: 320,       // Hard cap on speed (px/s)
    ROTATION_SPEED: 0.055,   // Radians per frame for turning
    GRAVITY_SINKING: 0,      // Body gravity offset when sinking (world gravity handles it)
    GRAVITY_BUOYANT: -380,   // Body gravity offset when antigrav ON (world gravity + this = net upward)
    OXYGEN_BASE: 180,        // Base oxygen seconds at Normal difficulty
    HULL_MAX: 100,
    ANTIGRAV_DRAIN_MULT: 2.5,// Oxygen drains this much faster when antigrav active
    DAMAGE_COOLDOWN_MS: 800, // Ms between hull damage hits
};

export class Submarine extends Phaser.Physics.Arcade.Sprite {
    // ── State ─────────────────────────────────────────────────────────────────
    oxygen: number;
    hull: number;

    isAntigravActive: boolean = false;
    isAlive: boolean = true;

    private oxygenMax: number;
    private hullMax: number = SUB_CONSTANTS.HULL_MAX;

    private drainRate: number;        // oxygen / second base
    private antigravDrainMult: number;
    private damageMult: number;

    private damageCooldown: number = 0;

    // ── Input ─────────────────────────────────────────────────────────────────
    private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
    private keyW!: Phaser.Input.Keyboard.Key;
    private keyA!: Phaser.Input.Keyboard.Key;
    private keyS!: Phaser.Input.Keyboard.Key;
    private keyD!: Phaser.Input.Keyboard.Key;
    private keySpace!: Phaser.Input.Keyboard.Key;

    // ── Audio + VFX ───────────────────────────────────────────────────────────
    private audio: AudioManager;
    private thrustParticles!: Phaser.GameObjects.Particles.ParticleEmitter;
    private toggleFlash!: Phaser.GameObjects.Rectangle;
    private isThrusting: boolean = false;

    constructor(scene: Phaser.Scene, x: number, y: number, audio: AudioManager, diff: DifficultyConfig) {
        super(scene, x, y, 'submarine');

        this.audio = audio;

        // Apply difficulty scalars
        this.oxygenMax = SUB_CONSTANTS.OXYGEN_BASE * diff.oxygenCapacityMult;
        this.oxygen = this.oxygenMax;
        this.hull = this.hullMax;
        this.drainRate = 1; // O2 per second base
        this.antigravDrainMult = diff.antigravOxygenDrainMult;
        this.damageMult = diff.damageTakenMult;

        scene.add.existing(this);
        scene.physics.add.existing(this);

        // ── Physics ───────────────────────────────────────────────────────────
        this.setCollideWorldBounds(true);
        this.setDamping(true);
        this.setDrag(SUB_CONSTANTS.DRAG, SUB_CONSTANTS.DRAG);
        this.setMaxVelocity(SUB_CONSTANTS.MAX_VELOCITY);

        // ── Thrust particle emitter (bubbles behind sub) ──────────────────────
        this.thrustParticles = scene.add.particles(x, y, 'bubble', {
            lifespan: 400,
            speedX: { min: -20, max: 20 },
            speedY: { min: -20, max: 20 },
            scale: { start: 0.4, end: 0 },
            alpha: { start: 0.7, end: 0 },
            blendMode: 'ADD',
            emitting: false,
        });

        // ── Toggle flash rect (brief screen flash on toggle) ──────────────────
        this.toggleFlash = scene.add.rectangle(0, 0, 1280, 720, 0x00ffcc, 0)
            .setScrollFactor(0)
            .setDepth(100);

        // ── Input ─────────────────────────────────────────────────────────────
        if (scene.input.keyboard) {
            this.cursors = scene.input.keyboard.createCursorKeys();
            this.keyW = scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W);
            this.keyA = scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A);
            this.keyS = scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S);
            this.keyD = scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D);
            this.keySpace = scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
        }
    }

    // ── Public API ─────────────────────────────────────────────────────────────
    getOxygenFraction() { return this.oxygen / this.oxygenMax; }
    getHullFraction() { return this.hull / this.hullMax; }

    takeDamage(amount: number) {
        if (!this.isAlive || this.damageCooldown > 0) return;
        const dmg = amount * this.damageMult;
        this.hull = Math.max(0, this.hull - dmg);
        this.damageCooldown = SUB_CONSTANTS.DAMAGE_COOLDOWN_MS;
        this.audio.playHullDamage();

        // Red flash on damage
        this.scene.tweens.add({
            targets: this,
            tint: 0xff2222 as unknown as number,
            duration: 80,
            yoyo: true,
            onComplete: () => {
                if (this.isAntigravActive) this.setTint(0x00ffcc);
                else this.clearTint();
            }
        });

        if (this.hull <= 0) this._die('Hull Destroyed');
    }

    // ── Update ─────────────────────────────────────────────────────────────────
    preUpdate(time: number, delta: number) {
        super.preUpdate(time, delta);
        if (!this.isAlive) return;

        const dtSec = delta / 1000;

        this._updateInput();
        this._updateAntigravity();
        this._drainOxygen(dtSec);
        this._updateDamageCooldown(delta);
        this._updateThrustParticles();
        this._syncHUD();
    }

    // ── Private helpers ────────────────────────────────────────────────────────
    private _updateInput() {
        if (!this.cursors || !this.body) return;

        const left = this.cursors.left.isDown || this.keyA.isDown;
        const right = this.cursors.right.isDown || this.keyD.isDown;
        const fwd = this.cursors.up.isDown || this.keyW.isDown;
        const rev = this.cursors.down.isDown || this.keyS.isDown;

        if (left) this.rotation -= SUB_CONSTANTS.ROTATION_SPEED;
        else if (right) this.rotation += SUB_CONSTANTS.ROTATION_SPEED;

        const body = this.body as Phaser.Physics.Arcade.Body;
        if (fwd) {
            this.scene.physics.velocityFromRotation(this.rotation, SUB_CONSTANTS.THRUST, body.acceleration);
            this.isThrusting = true;
        } else if (rev) {
            this.scene.physics.velocityFromRotation(this.rotation, -SUB_CONSTANTS.REVERSE_THRUST, body.acceleration);
            this.isThrusting = true;
        } else {
            this.setAcceleration(0, 0);
            this.isThrusting = false;
        }

        // Engine hum management
        if (this.isThrusting) this.audio.startEngineHum();
        else this.audio.stopEngineHum();
    }

    private _updateAntigravity() {
        if (!this.keySpace || !this.body) return;

        if (Phaser.Input.Keyboard.JustDown(this.keySpace)) {
            this.isAntigravActive = !this.isAntigravActive;
            const body = this.body as Phaser.Physics.Arcade.Body;

            if (this.isAntigravActive) {
                body.gravity.y = SUB_CONSTANTS.GRAVITY_BUOYANT;
                this.setTint(0x00ffcc);
                this.audio.playAntigravOn();
                this.audio.playBubbles();

                // Juicy screen flash
                this.scene.tweens.add({
                    targets: this.toggleFlash,
                    alpha: { from: 0.15, to: 0 },
                    duration: 250,
                    ease: 'Expo.Out',
                });
            } else {
                body.gravity.y = SUB_CONSTANTS.GRAVITY_SINKING;
                this.clearTint();
                this.audio.playAntigravOff();
                this.audio.playBubbles();

                this.scene.tweens.add({
                    targets: this.toggleFlash,
                    alpha: { from: 0.08, to: 0 },
                    duration: 180,
                    ease: 'Expo.Out',
                });
            }
        }
    }

    private _drainOxygen(dtSec: number) {
        const rate = this.isAntigravActive
            ? this.drainRate * this.antigravDrainMult
            : this.drainRate;

        this.oxygen = Math.max(0, this.oxygen - rate * dtSec);

        if (this.oxygen <= 0) this._die('Oxygen Depleted');
    }

    private _updateDamageCooldown(delta: number) {
        if (this.damageCooldown > 0) this.damageCooldown -= delta;
    }

    private _updateThrustParticles() {
        this.thrustParticles.setPosition(this.x, this.y);
        if (this.isThrusting && !this.thrustParticles.emitting) {
            this.thrustParticles.start();
        } else if (!this.isThrusting && this.thrustParticles.emitting) {
            this.thrustParticles.stop();
        }
    }

    private _syncHUD() {
        this.scene.registry.set('hud:oxygen', this.getOxygenFraction());
        this.scene.registry.set('hud:hull', this.getHullFraction());
        this.scene.registry.set('hud:depth', Math.floor(this.y / 10));
        this.scene.registry.set('hud:antigrav', this.isAntigravActive);
        this.scene.registry.set('hud:oxygenLow', this.oxygen < this.oxygenMax * 0.20);
    }

    private _die(reason: string) {
        if (!this.isAlive) return;
        this.isAlive = false;
        this.audio.playDeath();
        this.setAcceleration(0, 0);
        this.setVelocity(0, 0);
        (this.body as Phaser.Physics.Arcade.Body).enable = false;

        this.scene.tweens.add({
            targets: this,
            alpha: 0,
            angle: 360,
            duration: 800,
            ease: 'Power2',
        });

        this.scene.time.delayedCall(900, () => {
            this.scene.events.emit('submarine:dead', reason);
        });
    }
}
