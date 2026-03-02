// ============================================
// Levels — Difficulty progression system
// ============================================

const Levels = (() => {
    // Every 5 hits = new level
    const HITS_PER_LEVEL = 5;
    const BONUS_POINTS = 50;
    const BASE_POINTS = 10;

    function getLevel(totalHits) {
        return Math.floor(totalHits / HITS_PER_LEVEL) + 1;
    }

    function getConfig(level) {
        return {
            // How long target stays alive (ms) — decreases with level
            targetLifetime: Math.max(1200, 3000 - (level - 1) * 200),

            // Target spawn interval (ms) — decreases
            spawnInterval: Math.max(600, 1800 - (level - 1) * 120),

            // Target speed (px/s) — increases
            targetSpeed: 30 + (level - 1) * 15,

            // Target min size multiplier — decreases
            targetScale: Math.max(0.5, 1.0 - (level - 1) * 0.05),

            // Max simultaneous targets — increases
            maxTargets: Math.min(4, 1 + Math.floor((level - 1) / 2)),

            // Chance of moving target (0-1)
            moveChance: Math.min(0.8, 0.1 + (level - 1) * 0.08),
        };
    }

    function getPoints(hitNumber) {
        let points = BASE_POINTS;
        // Every 5th hit = bonus
        if (hitNumber % HITS_PER_LEVEL === 0) {
            points += BONUS_POINTS;
        }
        return points;
    }

    function isLevelUp(prevHits, newHits) {
        return Math.floor(prevHits / HITS_PER_LEVEL) < Math.floor(newHits / HITS_PER_LEVEL);
    }

    return {
        HITS_PER_LEVEL,
        BONUS_POINTS,
        BASE_POINTS,
        getLevel,
        getConfig,
        getPoints,
        isLevelUp
    };
})();
