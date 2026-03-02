// ============================================
// Game — Main game loop (Canvas) with aerial terrain
// ============================================

const Game = (() => {
    let canvas, ctx;
    let running = false;
    let animId = null;
    let lastTime = 0;

    // Game state
    let score = 0;
    let hits = 0;
    let level = 1;
    let config = null;
    let gameOverCallback = null;
    let waitingForFirstTarget = true;

    // Terrain (procedurally generated once per game)
    let terrainData = null;

    function generateTerrain(w, h) {
        const data = {
            patches: [],   // grass/dirt patches
            roads: [],     // roads / paths
            buildings: [], // small structures
            trees: [],     // trees from above
        };

        // Random seed for consistent look during game
        const seed = Math.random() * 10000;
        function seededRandom(i) {
            const x = Math.sin(seed + i * 127.1) * 43758.5453;
            return x - Math.floor(x);
        }

        // Dirt/field patches
        for (let i = 0; i < 15; i++) {
            data.patches.push({
                x: seededRandom(i * 3) * w,
                y: seededRandom(i * 3 + 1) * h,
                rx: 40 + seededRandom(i * 3 + 2) * 80,
                ry: 30 + seededRandom(i * 3 + 3) * 60,
                color: seededRandom(i) > 0.5 ? '#0e140e' : '#101810',
            });
        }

        // Roads (horizontal and vertical paths)
        const roadCount = 2 + Math.floor(seededRandom(100) * 3);
        for (let i = 0; i < roadCount; i++) {
            const horizontal = seededRandom(200 + i) > 0.5;
            data.roads.push({
                x: horizontal ? 0 : seededRandom(300 + i) * w,
                y: horizontal ? seededRandom(400 + i) * h : 0,
                horizontal,
                width: 8 + seededRandom(500 + i) * 6,
                length: horizontal ? w : h,
            });
        }

        // Small building footprints
        for (let i = 0; i < 8; i++) {
            data.buildings.push({
                x: seededRandom(600 + i) * w,
                y: seededRandom(700 + i) * h,
                w: 12 + seededRandom(800 + i) * 20,
                h: 10 + seededRandom(900 + i) * 16,
                color: seededRandom(1000 + i) > 0.5 ? '#1a1a18' : '#181c16',
            });
        }

        // Trees (circles from top-down)
        for (let i = 0; i < 30; i++) {
            data.trees.push({
                x: seededRandom(1100 + i) * w,
                y: seededRandom(1200 + i) * h,
                r: 4 + seededRandom(1300 + i) * 10,
            });
        }

        return data;
    }

    function drawBackground(w, h) {
        // Base terrain color (dark green — aerial view of fields)
        ctx.fillStyle = '#0c120c';
        ctx.fillRect(0, 0, w, h);

        if (!terrainData) return;

        // Field patches
        for (const p of terrainData.patches) {
            ctx.fillStyle = p.color;
            ctx.beginPath();
            ctx.ellipse(p.x, p.y, p.rx, p.ry, 0, 0, Math.PI * 2);
            ctx.fill();
        }

        // Roads
        ctx.lineCap = 'butt';
        for (const r of terrainData.roads) {
            ctx.strokeStyle = '#1a1a16';
            ctx.lineWidth = r.width;
            ctx.beginPath();
            if (r.horizontal) {
                ctx.moveTo(0, r.y);
                ctx.lineTo(w, r.y);
            } else {
                ctx.moveTo(r.x, 0);
                ctx.lineTo(r.x, h);
            }
            ctx.stroke();

            // Road edges / dashes
            ctx.strokeStyle = '#222218';
            ctx.lineWidth = 1;
            ctx.setLineDash([6, 8]);
            ctx.beginPath();
            if (r.horizontal) {
                ctx.moveTo(0, r.y);
                ctx.lineTo(w, r.y);
            } else {
                ctx.moveTo(r.x, 0);
                ctx.lineTo(r.x, h);
            }
            ctx.stroke();
            ctx.setLineDash([]);
        }

        // Buildings (small rectangles — rooftops from above)
        for (const b of terrainData.buildings) {
            ctx.fillStyle = b.color;
            ctx.fillRect(b.x, b.y, b.w, b.h);
            // Shadow
            ctx.fillStyle = 'rgba(0,0,0,0.15)';
            ctx.fillRect(b.x + 3, b.y + 3, b.w, b.h);
        }

        // Trees (dark green circles)
        for (const t of terrainData.trees) {
            ctx.fillStyle = 'rgba(15, 40, 15, 0.5)';
            ctx.beginPath();
            ctx.arc(t.x, t.y, t.r, 0, Math.PI * 2);
            ctx.fill();
            // Darker center
            ctx.fillStyle = 'rgba(10, 30, 10, 0.4)';
            ctx.beginPath();
            ctx.arc(t.x, t.y, t.r * 0.5, 0, Math.PI * 2);
            ctx.fill();
        }

        // Grid lines (map overlay)
        ctx.strokeStyle = 'rgba(0, 255, 65, 0.03)';
        ctx.lineWidth = 1;
        const gridSize = 80;
        for (let x = 0; x < w; x += gridSize) {
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, h);
            ctx.stroke();
        }
        for (let y = 0; y < h; y += gridSize) {
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(w, y);
            ctx.stroke();
        }
    }

    function handleInput(e) {
        if (!running) return;
        e.preventDefault();

        let px, py;
        if (e.touches) {
            const rect = canvas.getBoundingClientRect();
            px = (e.touches[0].clientX - rect.left) * (canvas.width / rect.width);
            py = (e.touches[0].clientY - rect.top) * (canvas.height / rect.height);
        } else {
            const rect = canvas.getBoundingClientRect();
            px = (e.clientX - rect.left) * (canvas.width / rect.width);
            py = (e.clientY - rect.top) * (canvas.height / rect.height);
        }

        Drone.setTarget(px, py);

        const hitTarget = Targets.checkHit(px, py);

        if (hitTarget) {
            // === HIT ===
            hits++;
            const prevLevel = level;
            level = Levels.getLevel(hits);
            const bonusMultiplier = (hits % Levels.HITS_PER_LEVEL === 0) ? 1 : 0;
            const points = hitTarget.points + (bonusMultiplier * Levels.BONUS_POINTS);
            const isBonus = bonusMultiplier > 0;
            score += points;

            // Effects
            Effects.spawnExplosion(hitTarget.x, hitTarget.y, isBonus);
            Effects.spawnHitText(hitTarget.x, hitTarget.y, points, isBonus);
            Effects.triggerShake(isBonus ? 8 : (hitTarget.type === 'vehicle' ? 6 : 4), isBonus ? 0.3 : 0.15);
            HUD.flash(isBonus ? '#ffd700' : '#00ff41', 0.2);

            // Haptic feedback
            try {
                if (window.Telegram && Telegram.WebApp && Telegram.WebApp.HapticFeedback) {
                    Telegram.WebApp.HapticFeedback.impactOccurred(isBonus || hitTarget.type === 'vehicle' ? 'heavy' : 'medium');
                }
            } catch (_) { }

            // Level up
            if (Levels.isLevelUp(hits - 1, hits)) {
                config = Levels.getConfig(level);
                Effects.spawnLevelUp(canvas.width, canvas.height, level);
            }
        } else {
            // === MISS ===
            if (Targets.hasAny() && !waitingForFirstTarget) {
                try {
                    if (window.Telegram && Telegram.WebApp && Telegram.WebApp.HapticFeedback) {
                        Telegram.WebApp.HapticFeedback.notificationOccurred('error');
                    }
                } catch (_) { }

                endGame();
            }
        }
    }

    function handleMouseMove(e) {
        if (!running) return;
        const rect = canvas.getBoundingClientRect();
        const px = (e.clientX - rect.left) * (canvas.width / rect.width);
        const py = (e.clientY - rect.top) * (canvas.height / rect.height);
        Drone.setTarget(px, py);
    }

    function handleTouchMove(e) {
        if (!running) return;
        e.preventDefault();
        const rect = canvas.getBoundingClientRect();
        const px = (e.touches[0].clientX - rect.left) * (canvas.width / rect.width);
        const py = (e.touches[0].clientY - rect.top) * (canvas.height / rect.height);
        Drone.setTarget(px, py);
    }

    function loop(timestamp) {
        if (!running) return;
        const dt = Math.min(0.05, (timestamp - lastTime) / 1000);
        lastTime = timestamp;

        const w = canvas.width;
        const h = canvas.height;

        // Update
        Targets.update(dt, w, h, config);
        Drone.update(dt);
        Effects.update(dt);
        HUD.update(dt);

        if (waitingForFirstTarget && Targets.hasAny()) {
            waitingForFirstTarget = false;
        }

        const shake = Effects.getShakeOffset();

        // Draw
        ctx.save();
        ctx.translate(shake.x, shake.y);

        drawBackground(w, h);
        Targets.draw(ctx);
        Drone.draw(ctx);
        Effects.draw(ctx);

        ctx.restore();

        Effects.drawFPVOverlay(ctx, w, h);
        HUD.draw(ctx, w, h, { score, hits, level });

        animId = requestAnimationFrame(loop);
    }

    function resize() {
        if (!canvas) return;
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        // Regenerate terrain for new size
        terrainData = generateTerrain(canvas.width, canvas.height);
    }

    function start(onGameOverCb) {
        canvas = document.getElementById('game-canvas');
        ctx = canvas.getContext('2d');
        gameOverCallback = onGameOverCb;

        score = 0;
        hits = 0;
        level = 1;
        config = Levels.getConfig(1);
        waitingForFirstTarget = true;

        resize();
        window.addEventListener('resize', resize);

        Targets.clear();
        Effects.clear();
        Drone.init(canvas.width / 2, canvas.height / 2);

        Targets.spawn(canvas.width, canvas.height, config);

        canvas.classList.add('active');

        canvas.addEventListener('click', handleInput);
        canvas.addEventListener('touchstart', handleInput, { passive: false });
        canvas.addEventListener('mousemove', handleMouseMove);
        canvas.addEventListener('touchmove', handleTouchMove, { passive: false });

        running = true;
        lastTime = performance.now();
        animId = requestAnimationFrame(loop);
    }

    function endGame() {
        running = false;
        if (animId) cancelAnimationFrame(animId);

        canvas.removeEventListener('click', handleInput);
        canvas.removeEventListener('touchstart', handleInput);
        canvas.removeEventListener('mousemove', handleMouseMove);
        canvas.removeEventListener('touchmove', handleTouchMove);
        window.removeEventListener('resize', resize);

        canvas.classList.remove('active');

        if (gameOverCallback) {
            gameOverCallback({ score, hits, level });
        }
    }

    function getState() {
        return { score, hits, level };
    }

    return { start, endGame, getState };
})();
