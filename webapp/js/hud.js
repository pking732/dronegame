// ============================================
// HUD — Military drone operator overlay on Canvas
// ============================================

const HUD = (() => {
    let flashTimer = 0;
    let flashColor = '';
    let missionTime = 0;

    function flash(color, duration) {
        flashColor = color;
        flashTimer = duration;
    }

    function update(dt) {
        if (flashTimer > 0) flashTimer -= dt;
        missionTime += dt;
    }

    function formatTime(seconds) {
        const m = Math.floor(seconds / 60);
        const s = Math.floor(seconds % 60);
        return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
    }

    function draw(ctx, w, h, state) {
        ctx.save();

        // === TOP BAR BACKGROUND ===
        const grad = ctx.createLinearGradient(0, 0, 0, 60);
        grad.addColorStop(0, 'rgba(0, 0, 0, 0.5)');
        grad.addColorStop(1, 'transparent');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, w, 60);

        // === Top-left: Score ===
        ctx.font = '600 10px Rajdhani';
        ctx.fillStyle = '#7aaa7a';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'top';
        ctx.fillText('СЧЁТ', 12, 10);

        ctx.font = '900 24px Orbitron';
        ctx.fillStyle = '#00ff41';
        ctx.shadowColor = '#00ff41';
        ctx.shadowBlur = 6;
        ctx.fillText(String(state.score), 12, 22);
        ctx.shadowBlur = 0;

        // === Top-right: Level ===
        ctx.textAlign = 'right';
        ctx.font = '600 10px Rajdhani';
        ctx.fillStyle = '#7aaa7a';
        ctx.fillText('УРОВЕНЬ', w - 12, 10);

        ctx.font = '900 24px Orbitron';
        ctx.fillStyle = '#00ff41';
        ctx.shadowColor = '#00ff41';
        ctx.shadowBlur = 6;
        ctx.fillText(String(state.level), w - 12, 22);
        ctx.shadowBlur = 0;

        // === Top-center: Hits + progress bar ===
        ctx.textAlign = 'center';
        ctx.font = '700 11px Rajdhani';
        ctx.fillStyle = '#7aaa7a';
        ctx.fillText(`ЦЕЛИ ПОРАЖЕНЫ: ${state.hits}`, w / 2, 10);

        // Progress bar to next level
        const hitsInLevel = state.hits % 5;
        const barW = 80;
        const barH = 4;
        const barX = (w - barW) / 2;
        const barY = 26;

        ctx.fillStyle = 'rgba(0, 255, 65, 0.1)';
        ctx.fillRect(barX, barY, barW, barH);
        ctx.fillStyle = '#00ff41';
        ctx.fillRect(barX, barY, barW * (hitsInLevel / 5), barH);

        // Small ticks
        ctx.strokeStyle = 'rgba(0, 255, 65, 0.3)';
        ctx.lineWidth = 1;
        for (let i = 1; i < 5; i++) {
            const tx = barX + barW * (i / 5);
            ctx.beginPath();
            ctx.moveTo(tx, barY);
            ctx.lineTo(tx, barY + barH);
            ctx.stroke();
        }

        // === BOTTOM BAR ===
        const botGrad = ctx.createLinearGradient(0, h - 50, 0, h);
        botGrad.addColorStop(0, 'transparent');
        botGrad.addColorStop(1, 'rgba(0, 0, 0, 0.4)');
        ctx.fillStyle = botGrad;
        ctx.fillRect(0, h - 50, w, 50);

        // Bottom-left: Simulated altitude & coordinates
        ctx.font = '600 9px Rajdhani';
        ctx.textAlign = 'left';
        ctx.fillStyle = '#5a8a5a';
        const alt = 120 + Math.floor(Math.sin(missionTime * 0.3) * 15);
        const lat = (48.5 + Math.sin(missionTime * 0.1) * 0.001).toFixed(4);
        const lon = (37.8 + Math.cos(missionTime * 0.15) * 0.001).toFixed(4);
        ctx.fillText(`ALT: ${alt}m`, 12, h - 32);
        ctx.fillText(`${lat}°N  ${lon}°E`, 12, h - 20);

        // Bottom-center: Mission time
        ctx.textAlign = 'center';
        ctx.font = '700 10px Orbitron';
        ctx.fillStyle = '#5a8a5a';
        ctx.fillText(`⏱ ${formatTime(missionTime)}`, w / 2, h - 20);

        // Bottom-right: Signal / battery
        ctx.textAlign = 'right';
        ctx.font = '600 9px Rajdhani';
        ctx.fillStyle = '#5a8a5a';
        ctx.fillText('СИГНАЛ: ████', w - 12, h - 32);
        ctx.fillText('БАТАРЕЯ: 87%', w - 12, h - 20);

        // === Corner brackets ===
        ctx.strokeStyle = 'rgba(0, 255, 65, 0.2)';
        ctx.lineWidth = 1;

        // Top-left
        ctx.beginPath();
        ctx.moveTo(4, 50);
        ctx.lineTo(4, 4);
        ctx.lineTo(50, 4);
        ctx.stroke();

        // Top-right
        ctx.beginPath();
        ctx.moveTo(w - 4, 50);
        ctx.lineTo(w - 4, 4);
        ctx.lineTo(w - 50, 4);
        ctx.stroke();

        // Bottom-left
        ctx.beginPath();
        ctx.moveTo(4, h - 45);
        ctx.lineTo(4, h - 4);
        ctx.lineTo(50, h - 4);
        ctx.stroke();

        // Bottom-right
        ctx.beginPath();
        ctx.moveTo(w - 4, h - 45);
        ctx.lineTo(w - 4, h - 4);
        ctx.lineTo(w - 50, h - 4);
        ctx.stroke();

        // === Flash effect ===
        if (flashTimer > 0) {
            ctx.globalAlpha = Math.min(0.3, flashTimer * 2);
            ctx.fillStyle = flashColor;
            ctx.fillRect(0, 0, w, h);
        }

        ctx.restore();
    }

    function reset() {
        missionTime = 0;
        flashTimer = 0;
    }

    return { flash, update, draw, reset };
})();
