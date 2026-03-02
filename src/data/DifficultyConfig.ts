// ─── Difficulty Configuration ───────────────────────────────────────────────
// Multipliers per memory.md locked decisions.

export type DifficultyKey = 'easy' | 'normal' | 'hard';

export interface DifficultyConfig {
    label: string;
    oxygenCapacityMult: number;
    enemySpeedMult: number;
    damageTakenMult: number;
    resourcesMult: number;
    antigravOxygenDrainMult: number; // ×2.5 base; difficulty scales further
}

export const DIFFICULTY: Record<DifficultyKey, DifficultyConfig> = {
    easy: {
        label: 'Easy',
        oxygenCapacityMult: 1.33,
        enemySpeedMult: 0.75,
        damageTakenMult: 0.7,
        resourcesMult: 1.5,
        antigravOxygenDrainMult: 2.0,
    },
    normal: {
        label: 'Normal',
        oxygenCapacityMult: 1.0,
        enemySpeedMult: 1.0,
        damageTakenMult: 1.0,
        resourcesMult: 1.0,
        antigravOxygenDrainMult: 2.5,
    },
    hard: {
        label: 'Hard',
        oxygenCapacityMult: 0.67,
        enemySpeedMult: 1.35,
        damageTakenMult: 1.4,
        resourcesMult: 0.6,
        antigravOxygenDrainMult: 3.0,
    },
};
