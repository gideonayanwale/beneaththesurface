// ─── Level Configuration Data ──────────────────────────────────────────────
// Each entry drives GameScene behaviour: physics, visuals, enemies, collectibles.

export interface LevelConfig {
    id: number;
    name: string;
    worldWidth: number;
    worldHeight: number;
    gravity: number;          // Arcade physics world gravity Y
    bgColor: number;          // 0xRRGGBB background fill
    darkOverlayAlpha: number; // 0–1 darkness over the world
    godRays: boolean;
    enemyCount: number;
    artifactsRequired: number;// min to unlock exit
    artifactsTotal: number;
    musicKey: string;         // future audio
    pressureDamageInterval: number; // ms between pressure hits (0 = none)
}

export const LEVEL_CONFIGS: LevelConfig[] = [
    {
        id: 1,
        name: 'Sunlit Shallows',
        worldWidth: 3200,
        worldHeight: 2400,
        gravity: 200,
        bgColor: 0x001a4d,
        darkOverlayAlpha: 0,
        godRays: true,
        enemyCount: 4,
        artifactsRequired: 3,
        artifactsTotal: 5,
        musicKey: 'music_sunlit',
        pressureDamageInterval: 0,
    },
    {
        id: 2,
        name: 'Twilight Zone',
        worldWidth: 3600,
        worldHeight: 2800,
        gravity: 240,
        bgColor: 0x000d33,
        darkOverlayAlpha: 0.25,
        godRays: false,
        enemyCount: 6,
        artifactsRequired: 3,
        artifactsTotal: 5,
        musicKey: 'music_twilight',
        pressureDamageInterval: 0,
    },
    {
        id: 3,
        name: 'Midnight Zone',
        worldWidth: 4000,
        worldHeight: 3200,
        gravity: 280,
        bgColor: 0x00071a,
        darkOverlayAlpha: 0.45,
        godRays: false,
        enemyCount: 8,
        artifactsRequired: 4,
        artifactsTotal: 6,
        musicKey: 'music_midnight',
        pressureDamageInterval: 0,
    },
    {
        id: 4,
        name: 'Abyssal Zone',
        worldWidth: 4400,
        worldHeight: 3600,
        gravity: 320,
        bgColor: 0x000308,
        darkOverlayAlpha: 0.65,
        godRays: false,
        enemyCount: 10,
        artifactsRequired: 4,
        artifactsTotal: 6,
        musicKey: 'music_abyssal',
        pressureDamageInterval: 10000,
    },
    {
        id: 5,
        name: 'The Hadal Void',
        worldWidth: 4800,
        worldHeight: 4000,
        gravity: 360,
        bgColor: 0x000000,
        darkOverlayAlpha: 0.8,
        godRays: false,
        enemyCount: 12,
        artifactsRequired: 5,
        artifactsTotal: 7,
        musicKey: 'music_hadal',
        pressureDamageInterval: 8000,
    },
];
