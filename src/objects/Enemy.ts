import Phaser from 'phaser';

// ─── Tuning ──────────────────────────────────────────────────────────────────
const ENEMY = {
    PATROL_SPEED: 80,
    CHASE_SPEED: 140,
    CHASE_RANGE: 220,
    HULL_DAMAGE: 12,
    TURN_SPEED: 0.04,
};

export class Enemy extends Phaser.Physics.Arcade.Sprite {
    private patrolLeft: number;
    private patrolRight: number;
    private dir: number = 1;
    private chasing: boolean = false;
    private speedMult: number;

    constructor(scene: Phaser.Scene, x: number, y: number, patrolLeft: number, patrolRight: number, speedMult = 1) {
        super(scene, x, y, 'enemy');

        this.patrolLeft = patrolLeft;
        this.patrolRight = patrolRight;
        this.speedMult = speedMult;

        scene.add.existing(this);
        scene.physics.add.existing(this);

        const body = this.body as Phaser.Physics.Arcade.Body;
        body.setGravityY(-300); // float neutrally (cancels world gravity)
        body.setAllowGravity(true);
        this.setCollideWorldBounds(true);
    }

    getDamage() { return ENEMY.HULL_DAMAGE; }

    patrol(playerX: number, playerY: number) {
        const dist = Phaser.Math.Distance.Between(this.x, this.y, playerX, playerY);
        this.chasing = dist < ENEMY.CHASE_RANGE;

        const body = this.body as Phaser.Physics.Arcade.Body;

        if (this.chasing) {
            // Chase: angle toward player
            const angle = Phaser.Math.Angle.Between(this.x, this.y, playerX, playerY);
            const speed = ENEMY.CHASE_SPEED * this.speedMult;
            body.setVelocity(Math.cos(angle) * speed, Math.sin(angle) * speed);
            this.rotation = angle;
        } else {
            // Bounce patrol
            if (this.x <= this.patrolLeft) this.dir = 1;
            else if (this.x >= this.patrolRight) this.dir = -1;

            body.setVelocity(ENEMY.PATROL_SPEED * this.dir * this.speedMult, 0);
            this.setFlipX(this.dir < 0);
        }

        // Tint: red when chasing, normal when patrolling
        this.setTint(this.chasing ? 0xff4444 : 0xffffff);
    }
}
