// ============================================
// Targets — Military objects with realistic silhouettes
// ============================================

const Targets = (() => {
    const targets = [];
    let spawnTimer = 0;

    // Target types with different properties and POINT VALUES
    const TYPES = {
        infantry: {
            name: 'Пехота',
            baseW: 32,
            baseH: 48,
            points: 10,
            color: '#ff4444',
            glowColor: 'rgba(255, 68, 68, 0.4)',
        },
        vehicle: {
            name: 'Техника',
            baseW: 64,
            baseH: 36,
            points: 25,
            color: '#ff8800',
            glowColor: 'rgba(255, 136, 0, 0.4)',
        },
        bunker: {
            name: 'Укрепление',
            baseW: 56,
            baseH: 40,
            points: 15,
            color: '#cc6666',
            glowColor: 'rgba(204, 102, 102, 0.4)',
        }
    };

    const typeKeys = Object.keys(TYPES);

    // ==========================================
    // Draw functions for each target type
    // ==========================================

    function drawInfantry(ctx, w, h, color, alpha) {
        // Soldier silhouette — standing figure with helmet + rifle
        const scale = w / 32;
        ctx.save();
        ctx.scale(scale, scale);
        ctx.globalAlpha = alpha;

        // Shadow on ground
        ctx.fillStyle = 'rgba(0,0,0,0.3)';
        ctx.beginPath();
        ctx.ellipse(0, 22, 10, 3, 0, 0, Math.PI * 2);
        ctx.fill();

        // Legs
        ctx.fillStyle = '#2a3a2a';
        ctx.fillRect(-5, 8, 4, 14);
        ctx.fillRect(1, 8, 4, 14);

        // Boots
        ctx.fillStyle = '#1a1a1a';
        ctx.fillRect(-6, 19, 5, 3);
        ctx.fillRect(1, 19, 5, 3);

        // Body / torso (military jacket)
        ctx.fillStyle = '#3a4a3a';
        ctx.fillRect(-6, -2, 12, 11);

        // Tactical vest
        ctx.fillStyle = '#4a5a4a';
        ctx.fillRect(-5, 0, 10, 7);

        // Arms
        ctx.fillStyle = '#3a4a3a';
        ctx.fillRect(-8, -1, 3, 10);
        ctx.fillRect(5, -1, 3, 10);

        // Head
        ctx.fillStyle = '#8a7a6a';
        ctx.beginPath();
        ctx.arc(0, -6, 4, 0, Math.PI * 2);
        ctx.fill();

        // Helmet
        ctx.fillStyle = '#2a3a2a';
        ctx.beginPath();
        ctx.arc(0, -7, 5, Math.PI, 0);
        ctx.fill();
        ctx.fillRect(-5, -7, 10, 2);

        // Rifle (diagonal, held across body)
        ctx.strokeStyle = '#1a1a1a';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(6, 0);
        ctx.lineTo(12, -14);
        ctx.stroke();

        // Rifle stock
        ctx.fillStyle = '#3a2a1a';
        ctx.fillRect(5, -1, 3, 4);

        ctx.restore();
    }

    function drawTank(ctx, w, h, color, alpha) {
        // Tank silhouette — top-down view
        const scale = w / 64;
        ctx.save();
        ctx.scale(scale, scale);
        ctx.globalAlpha = alpha;

        // Shadow
        ctx.fillStyle = 'rgba(0,0,0,0.25)';
        ctx.beginPath();
        ctx.ellipse(0, 2, 30, 16, 0, 0, Math.PI * 2);
        ctx.fill();

        // Tracks (left and right)
        ctx.fillStyle = '#2a2a2a';
        // Left track
        drawRoundedRect(ctx, -28, -14, 12, 28, 3);
        ctx.fill();
        // Right track
        drawRoundedRect(ctx, 16, -14, 12, 28, 3);
        ctx.fill();

        // Track details (treads)
        ctx.strokeStyle = '#3a3a3a';
        ctx.lineWidth = 1;
        for (let i = -12; i <= 12; i += 4) {
            ctx.beginPath();
            ctx.moveTo(-28, i);
            ctx.lineTo(-16, i);
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(16, i);
            ctx.lineTo(28, i);
            ctx.stroke();
        }

        // Hull body (main)
        ctx.fillStyle = '#4a5a3a';
        drawRoundedRect(ctx, -16, -12, 32, 24, 2);
        ctx.fill();

        // Hull top plate
        ctx.fillStyle = '#5a6a4a';
        drawRoundedRect(ctx, -14, -10, 28, 20, 2);
        ctx.fill();

        // Engine deck (rear)
        ctx.fillStyle = '#3a4a2a';
        ctx.fillRect(-12, 4, 24, 6);
        // Engine grilles
        ctx.strokeStyle = '#2a3a1a';
        ctx.lineWidth = 0.8;
        for (let i = -8; i <= 8; i += 3) {
            ctx.beginPath();
            ctx.moveTo(i, 5);
            ctx.lineTo(i, 9);
            ctx.stroke();
        }

        // Turret (circular)
        ctx.fillStyle = '#5a6a4a';
        ctx.beginPath();
        ctx.ellipse(0, -2, 9, 8, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#6a7a5a';
        ctx.beginPath();
        ctx.ellipse(0, -2, 7, 6, 0, 0, Math.PI * 2);
        ctx.fill();

        // Barrel (main gun)
        ctx.fillStyle = '#3a3a3a';
        ctx.fillRect(-1.5, -22, 3, 20);

        // Barrel tip (muzzle brake)
        ctx.fillStyle = '#2a2a2a';
        ctx.fillRect(-2.5, -24, 5, 3);

        // Hatch on turret
        ctx.strokeStyle = '#4a5a3a';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(3, -1, 2.5, 0, Math.PI * 2);
        ctx.stroke();

        ctx.restore();
    }

    function drawBunker(ctx, w, h, color, alpha) {
        // Fortified position / building — top-down view
        const scale = w / 56;
        ctx.save();
        ctx.scale(scale, scale);
        ctx.globalAlpha = alpha;

        // Shadow
        ctx.fillStyle = 'rgba(0,0,0,0.2)';
        ctx.fillRect(-24, -16, 48, 34);

        // Sandbag wall perimeter
        ctx.fillStyle = '#6a5a4a';
        drawRoundedRect(ctx, -24, -16, 48, 32, 3);
        ctx.fill();

        // Inner area (darker)
        ctx.fillStyle = '#4a3a2a';
        drawRoundedRect(ctx, -20, -12, 40, 24, 2);
        ctx.fill();

        // Roof / concrete top
        ctx.fillStyle = '#5a5a5a';
        drawRoundedRect(ctx, -16, -10, 32, 20, 2);
        ctx.fill();

        // Concrete texture lines
        ctx.strokeStyle = '#4a4a4a';
        ctx.lineWidth = 0.5;
        ctx.beginPath();
        ctx.moveTo(-14, -4);
        ctx.lineTo(14, -4);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(-14, 2);
        ctx.lineTo(14, 2);
        ctx.stroke();

        // Firing slit (embrasure)
        ctx.fillStyle = '#1a1a1a';
        ctx.fillRect(-10, -12, 8, 2);
        ctx.fillRect(2, -12, 8, 2);

        // Sandbag details (top)
        ctx.fillStyle = '#7a6a5a';
        for (let x = -22; x <= 16; x += 8) {
            drawRoundedRect(ctx, x, -16, 7, 4, 1);
            ctx.fill();
        }

        // Flag / antenna
        ctx.strokeStyle = '#4a4a4a';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(12, -10);
        ctx.lineTo(12, -22);
        ctx.stroke();

        // Small flag
        ctx.fillStyle = '#aa3333';
        ctx.beginPath();
        ctx.moveTo(12, -22);
        ctx.lineTo(18, -19);
        ctx.lineTo(12, -17);
        ctx.fill();

        ctx.restore();
    }

    function drawRoundedRect(ctx, x, y, w, h, r) {
        ctx.beginPath();
        ctx.moveTo(x + r, y);
        ctx.lineTo(x + w - r, y);
        ctx.quadraticCurveTo(x + w, y, x + w, y + r);
        ctx.lineTo(x + w, y + h - r);
        ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
        ctx.lineTo(x + r, y + h);
        ctx.quadraticCurveTo(x, y + h, x, y + h - r);
        ctx.lineTo(x, y + r);
        ctx.quadraticCurveTo(x, y, x + r, y);
        ctx.closePath();
    }

    // ==========================================
    // Target class
    // ==========================================

    class Target {
        constructor(x, y, type, config) {
            const t = TYPES[type];
            this.type = type;
            this.x = x;
            this.y = y;
            this.w = t.baseW * config.targetScale;
            this.h = t.baseH * config.targetScale;
            this.color = t.color;
            this.glowColor = t.glowColor;
            this.points = t.points;
            this.name = t.name;
            this.lifetime = config.targetLifetime / 1000;
            this.maxLifetime = this.lifetime;
            this.dead = false;
            this.hit = false;
            this.spawnTime = 0;
            this.spawnDuration = 0.4;

            // Movement
            this.moving = Math.random() < config.moveChance;
            this.vx = 0;
            this.vy = 0;
            if (this.moving) {
                const angle = Math.random() * Math.PI * 2;
                const speed = config.targetSpeed * (type === 'vehicle' ? 1.2 : type === 'infantry' ? 0.8 : 0.3);
                this.vx = Math.cos(angle) * speed;
                this.vy = Math.sin(angle) * speed;
            }
        }

        update(dt, canvasW, canvasH) {
            this.spawnTime += dt;
            this.lifetime -= dt;

            if (this.lifetime <= 0) {
                this.dead = true;
                return;
            }

            if (this.moving) {
                this.x += this.vx * dt;
                this.y += this.vy * dt;

                const pad = 50;
                if (this.x < pad) { this.x = pad; this.vx = Math.abs(this.vx); }
                if (this.x > canvasW - pad) { this.x = canvasW - pad; this.vx = -Math.abs(this.vx); }
                if (this.y < pad) { this.y = pad; this.vy = Math.abs(this.vy); }
                if (this.y > canvasH - pad) { this.y = canvasH - pad; this.vy = -Math.abs(this.vy); }
            }
        }

        draw(ctx) {
            const spawnProgress = Math.min(1, this.spawnTime / this.spawnDuration);
            const fadeProgress = Math.min(1, this.lifetime / 0.5);
            const alpha = spawnProgress * fadeProgress;
            const scale = 0.3 + spawnProgress * 0.7;

            ctx.save();
            ctx.translate(this.x, this.y);
            ctx.scale(scale, scale);

            // Targeting reticle around object
            this.drawTargetReticle(ctx, alpha);

            // Draw the actual military object
            if (this.type === 'infantry') {
                drawInfantry(ctx, this.w, this.h, this.color, alpha);
            } else if (this.type === 'vehicle') {
                drawTank(ctx, this.w, this.h, this.color, alpha);
            } else {
                drawBunker(ctx, this.w, this.h, this.color, alpha);
            }

            // Target label + points
            ctx.globalAlpha = alpha * 0.7;
            ctx.font = '600 9px Rajdhani';
            ctx.fillStyle = this.color;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'top';
            const labelY = this.h * 0.5 + 12;
            ctx.fillText(`${this.name} [+${this.points}]`, 0, labelY);

            // Lifetime bar under label
            const barW = 40;
            const barX = -barW / 2;
            const barY = labelY + 12;
            const lifeRatio = this.lifetime / this.maxLifetime;

            ctx.fillStyle = 'rgba(255,255,255,0.1)';
            ctx.fillRect(barX, barY, barW, 3);

            ctx.fillStyle = lifeRatio > 0.3 ? this.color : '#ff0000';
            ctx.fillRect(barX, barY, barW * lifeRatio, 3);

            ctx.restore();
        }

        drawTargetReticle(ctx, alpha) {
            const radius = Math.max(this.w, this.h) * 0.7;
            ctx.globalAlpha = alpha * 0.4;
            ctx.strokeStyle = this.color;
            ctx.lineWidth = 1;

            // Dashed circle
            ctx.setLineDash([4, 4]);
            ctx.beginPath();
            ctx.arc(0, 0, radius, 0, Math.PI * 2);
            ctx.stroke();
            ctx.setLineDash([]);

            // Corner brackets
            ctx.globalAlpha = alpha * 0.6;
            ctx.lineWidth = 1.5;
            const bSize = radius * 0.3;
            const corners = [
                { x: -radius, y: -radius },
                { x: radius, y: -radius },
                { x: -radius, y: radius },
                { x: radius, y: radius },
            ];
            for (const c of corners) {
                const dx = c.x > 0 ? -bSize : bSize;
                const dy = c.y > 0 ? -bSize : bSize;
                ctx.beginPath();
                ctx.moveTo(c.x + dx, c.y);
                ctx.lineTo(c.x, c.y);
                ctx.lineTo(c.x, c.y + dy);
                ctx.stroke();
            }

            // Glow effect
            ctx.globalAlpha = alpha * 0.15;
            ctx.fillStyle = this.glowColor;
            ctx.beginPath();
            ctx.arc(0, 0, radius, 0, Math.PI * 2);
            ctx.fill();
        }

        containsPoint(px, py) {
            const dx = px - this.x;
            const dy = py - this.y;
            const radius = Math.max(this.w, this.h) * 0.65;
            return (dx * dx + dy * dy) <= (radius * radius);
        }
    }

    // ==========================================
    // Spawning and management
    // ==========================================

    function spawn(canvasW, canvasH, config) {
        const pad = 70;
        const x = pad + Math.random() * (canvasW - pad * 2);
        const y = pad + Math.random() * (canvasH - pad * 2);
        const type = typeKeys[Math.floor(Math.random() * typeKeys.length)];
        targets.push(new Target(x, y, type, config));
    }

    function update(dt, canvasW, canvasH, config) {
        spawnTimer += dt;
        const interval = config.spawnInterval / 1000;

        if (spawnTimer >= interval && targets.length < config.maxTargets) {
            spawn(canvasW, canvasH, config);
            spawnTimer = 0;
        }

        for (let i = targets.length - 1; i >= 0; i--) {
            targets[i].update(dt, canvasW, canvasH);
            if (targets[i].dead) targets.splice(i, 1);
        }
    }

    function draw(ctx) {
        for (const t of targets) t.draw(ctx);
    }

    function checkHit(px, py) {
        for (let i = targets.length - 1; i >= 0; i--) {
            if (targets[i].containsPoint(px, py)) {
                const t = targets[i];
                t.dead = true;
                t.hit = true;
                return t;
            }
        }
        return null;
    }

    function clear() {
        targets.length = 0;
        spawnTimer = 0;
    }

    function getCount() {
        return targets.length;
    }

    function hasAny() {
        return targets.length > 0;
    }

    return { spawn, update, draw, checkHit, clear, getCount, hasAny };
})();
