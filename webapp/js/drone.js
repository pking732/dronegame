// ============================================
// Drone — Crosshair / reticle that follows input
// ============================================

const Drone = (() => {
    let x = 0;
    let y = 0;
    let targetX = 0;
    let targetY = 0;
    let active = false;
    let pulseTimer = 0;

    function init(canvasW, canvasH) {
        x = canvasW / 2;
        y = canvasH / 2;
        targetX = x;
        targetY = y;
        active = true;
        pulseTimer = 0;
    }

    function setTarget(tx, ty) {
        targetX = tx;
        targetY = ty;
    }

    function update(dt) {
        if (!active) return;
        // Smooth follow
        const lerp = 1 - Math.pow(0.001, dt);
        x += (targetX - x) * lerp;
        y += (targetY - y) * lerp;
        pulseTimer += dt;
    }

    function draw(ctx) {
        if (!active) return;

        const pulse = 1 + Math.sin(pulseTimer * 4) * 0.1;
        const r1 = 18 * pulse;
        const r2 = 28 * pulse;

        ctx.save();
        ctx.translate(x, y);

        // Outer ring glow
        ctx.shadowColor = '#00ff41';
        ctx.shadowBlur = 15;
        ctx.strokeStyle = 'rgba(0, 255, 65, 0.5)';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(0, 0, r2, 0, Math.PI * 2);
        ctx.stroke();

        // Cross lines
        ctx.shadowBlur = 8;
        ctx.strokeStyle = '#00ff41';
        ctx.lineWidth = 1.5;

        // Top
        ctx.beginPath();
        ctx.moveTo(0, -r2 + 4);
        ctx.lineTo(0, -r1);
        ctx.stroke();

        // Bottom
        ctx.beginPath();
        ctx.moveTo(0, r1);
        ctx.lineTo(0, r2 - 4);
        ctx.stroke();

        // Left
        ctx.beginPath();
        ctx.moveTo(-r2 + 4, 0);
        ctx.lineTo(-r1, 0);
        ctx.stroke();

        // Right
        ctx.beginPath();
        ctx.moveTo(r1, 0);
        ctx.lineTo(r2 - 4, 0);
        ctx.stroke();

        // Inner circle
        ctx.strokeStyle = 'rgba(0, 255, 65, 0.8)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(0, 0, r1, 0, Math.PI * 2);
        ctx.stroke();

        // Center dot
        ctx.shadowBlur = 12;
        ctx.fillStyle = '#00ff41';
        ctx.beginPath();
        ctx.arc(0, 0, 2.5, 0, Math.PI * 2);
        ctx.fill();

        // Corner ticks
        ctx.strokeStyle = 'rgba(0, 255, 65, 0.6)';
        ctx.lineWidth = 1;
        const corners = [
            { x: -r2 * 0.7, y: -r2 * 0.7 },
            { x: r2 * 0.7, y: -r2 * 0.7 },
            { x: -r2 * 0.7, y: r2 * 0.7 },
            { x: r2 * 0.7, y: r2 * 0.7 },
        ];
        for (const c of corners) {
            const dx = c.x > 0 ? -5 : 5;
            const dy = c.y > 0 ? -5 : 5;
            ctx.beginPath();
            ctx.moveTo(c.x + dx, c.y);
            ctx.lineTo(c.x, c.y);
            ctx.lineTo(c.x, c.y + dy);
            ctx.stroke();
        }

        ctx.restore();
    }

    function getPos() {
        return { x, y };
    }

    function deactivate() {
        active = false;
    }

    return { init, setTarget, update, draw, getPos, deactivate };
})();
