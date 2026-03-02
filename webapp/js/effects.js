// ============================================
// Effects — Particles, screen shake, FPV overlay
// ============================================

const Effects = (() => {
    const particles = [];
    const texts = [];
    let shakeAmount = 0;
    let shakeDuration = 0;
    let shakeTimer = 0;

    // --- Particle class ---
    class Particle {
        constructor(x, y, color, speed, angle, life, size) {
            this.x = x;
            this.y = y;
            this.color = color;
            this.vx = Math.cos(angle) * speed;
            this.vy = Math.sin(angle) * speed;
            this.life = life;
            this.maxLife = life;
            this.size = size;
            this.dead = false;
        }
        update(dt) {
            this.x += this.vx * dt;
            this.y += this.vy * dt;
            this.vy += 80 * dt; // gravity
            this.life -= dt;
            if (this.life <= 0) this.dead = true;
        }
        draw(ctx) {
            const alpha = Math.max(0, this.life / this.maxLife);
            ctx.globalAlpha = alpha;
            ctx.fillStyle = this.color;
            ctx.fillRect(this.x - this.size / 2, this.y - this.size / 2, this.size, this.size);
            ctx.globalAlpha = 1;
        }
    }

    // --- Floating text ---
    class FloatingText {
        constructor(x, y, text, color, duration) {
            this.x = x;
            this.y = y;
            this.text = text;
            this.color = color;
            this.duration = duration;
            this.maxDuration = duration;
            this.dead = false;
        }
        update(dt) {
            this.y -= 60 * dt;
            this.duration -= dt;
            if (this.duration <= 0) this.dead = true;
        }
        draw(ctx) {
            const alpha = Math.max(0, this.duration / this.maxDuration);
            const scale = 1 + (1 - alpha) * 0.3;
            ctx.save();
            ctx.globalAlpha = alpha;
            ctx.translate(this.x, this.y);
            ctx.scale(scale, scale);
            ctx.font = '700 22px Orbitron';
            ctx.fillStyle = this.color;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.shadowColor = this.color;
            ctx.shadowBlur = 12;
            ctx.fillText(this.text, 0, 0);
            ctx.restore();
        }
    }

    function spawnExplosion(x, y, isBonus) {
        const count = isBonus ? 30 : 18;
        const colors = isBonus
            ? ['#ffd700', '#ff8800', '#ffaa00', '#ffffff']
            : ['#00ff41', '#00cc33', '#88ff88', '#ffffff'];

        for (let i = 0; i < count; i++) {
            const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.5;
            const speed = 80 + Math.random() * 200;
            const life = 0.4 + Math.random() * 0.6;
            const size = 2 + Math.random() * 4;
            const color = colors[Math.floor(Math.random() * colors.length)];
            particles.push(new Particle(x, y, color, speed, angle, life, size));
        }
    }

    function spawnHitText(x, y, points, isBonus) {
        const text = isBonus ? `+${points} БОНУС!` : `+${points}`;
        const color = isBonus ? '#ffd700' : '#00ff41';
        texts.push(new FloatingText(x, y - 30, text, color, 1.2));
    }

    function spawnLevelUp(canvasW, canvasH, level) {
        const text = `УРОВЕНЬ ${level}`;
        texts.push(new FloatingText(canvasW / 2, canvasH / 2, text, '#00ff41', 2.0));
    }

    function triggerShake(amount, duration) {
        shakeAmount = amount;
        shakeDuration = duration;
        shakeTimer = duration;
    }

    function getShakeOffset() {
        if (shakeTimer <= 0) return { x: 0, y: 0 };
        const intensity = (shakeTimer / shakeDuration) * shakeAmount;
        return {
            x: (Math.random() - 0.5) * intensity * 2,
            y: (Math.random() - 0.5) * intensity * 2
        };
    }

    function update(dt) {
        // Update particles
        for (let i = particles.length - 1; i >= 0; i--) {
            particles[i].update(dt);
            if (particles[i].dead) particles.splice(i, 1);
        }
        // Update texts
        for (let i = texts.length - 1; i >= 0; i--) {
            texts[i].update(dt);
            if (texts[i].dead) texts.splice(i, 1);
        }
        // Shake
        if (shakeTimer > 0) shakeTimer -= dt;
    }

    function draw(ctx) {
        for (const p of particles) p.draw(ctx);
        for (const t of texts) t.draw(ctx);
    }

    // FPV-style camera overlay (scanlines + vignette + noise)
    function drawFPVOverlay(ctx, w, h) {
        // Vignette
        const vGrad = ctx.createRadialGradient(w / 2, h / 2, w * 0.25, w / 2, h / 2, w * 0.75);
        vGrad.addColorStop(0, 'transparent');
        vGrad.addColorStop(1, 'rgba(0,0,0,0.6)');
        ctx.fillStyle = vGrad;
        ctx.fillRect(0, 0, w, h);

        // Thin scanlines
        ctx.fillStyle = 'rgba(0, 255, 65, 0.02)';
        for (let y = 0; y < h; y += 3) {
            ctx.fillRect(0, y, w, 1);
        }
    }

    function clear() {
        particles.length = 0;
        texts.length = 0;
        shakeAmount = 0;
        shakeTimer = 0;
    }

    return {
        spawnExplosion,
        spawnHitText,
        spawnLevelUp,
        triggerShake,
        getShakeOffset,
        update,
        draw,
        drawFPVOverlay,
        clear
    };
})();
