// ============================================================
// INK & AETHER - Background Canvas Effects
// ============================================================

(function() {
    const canvas = document.getElementById('bg-canvas');
    const ctx = canvas.getContext('2d');
    
    let width, height, dpr;
    let mouseX = 0, mouseY = 0;
    let targetMouseX = 0, targetMouseY = 0;
    
    // ─── Resize ───
    function resize() {
        dpr = Math.min(window.devicePixelRatio, 2);
        width = window.innerWidth;
        height = window.innerHeight;
        canvas.width = width * dpr;
        canvas.height = height * dpr;
        canvas.style.width = width + 'px';
        canvas.style.height = height + 'px';
        ctx.scale(dpr, dpr);
        initStars();
        initNebulae();
    }
    
    // ─── Stars ───
    const STAR_LAYERS = 3;
    const stars = [];
    
    class Star {
        constructor(layer) {
            this.layer = layer;
            this.reset();
        }
        
        reset() {
            this.x = Math.random() * width;
            this.y = Math.random() * height;
            const sizeBase = [0.5, 1.2, 2.5][this.layer];
            this.size = sizeBase + Math.random() * sizeBase;
            this.brightness = 0.3 + Math.random() * 0.7;
            this.twinkleSpeed = 0.5 + Math.random() * 2;
            this.twinkleOffset = Math.random() * Math.PI * 2;
            this.parallaxFactor = [0.02, 0.05, 0.12][this.layer];
            this.color = this.getColor();
        }
        
        getColor() {
            const colors = [
                '220, 230, 255',
                '230, 220, 200',
                '201, 162, 39'
            ];
            return colors[this.layer];
        }
        
        update(time) {
            const twinkle = Math.sin(time * this.twinkleSpeed + this.twinkleOffset) * 0.5 + 0.5;
            this.currentAlpha = this.brightness * (0.6 + twinkle * 0.4);
            
            // Parallax
            this.drawX = this.x + (mouseX - width * 0.5) * this.parallaxFactor;
            this.drawY = this.y + (mouseY - height * 0.5) * this.parallaxFactor;
        }
        
        draw(ctx) {
            const x = ((this.drawX % width) + width) % width;
            const y = ((this.drawY % height) + height) % height;
            
            ctx.beginPath();
            ctx.arc(x, y, this.size, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(${this.color}, ${this.currentAlpha * 0.8})`;
            ctx.fill();
            
            // Glow for larger stars
            if (this.size > 1.5) {
                ctx.beginPath();
                ctx.arc(x, y, this.size * 3, 0, Math.PI * 2);
                const grad = ctx.createRadialGradient(x, y, 0, x, y, this.size * 3);
                grad.addColorStop(0, `rgba(${this.color}, ${this.currentAlpha * 0.15})`);
                grad.addColorStop(1, `rgba(${this.color}, 0)`);
                ctx.fillStyle = grad;
                ctx.fill();
            }
        }
    }
    
    function initStars() {
        stars.length = 0;
        const counts = [120, 60, 20];
        for (let l = 0; l < STAR_LAYERS; l++) {
            for (let i = 0; i < counts[l]; i++) {
                stars.push(new Star(l));
            }
        }
    }
    
    // ─── Shooting Stars ───
    const shootingStars = [];
    
    class ShootingStar {
        constructor() {
            this.reset();
        }
        
        reset() {
            this.x = Math.random() * width * 0.5;
            this.y = Math.random() * height * 0.3;
            this.angle = Math.PI * 0.25 + Math.random() * 0.3;
            this.speed = 8 + Math.random() * 6;
            this.length = 50 + Math.random() * 80;
            this.life = 0;
            this.maxLife = 20 + Math.random() * 20;
            this.active = false;
            this.wait = 100 + Math.random() * 400;
        }
        
        update() {
            if (!this.active) {
                this.wait--;
                if (this.wait <= 0) {
                    this.active = true;
                    this.x = Math.random() * width * 0.3;
                    this.y = Math.random() * height * 0.3;
                }
                return;
            }
            
            this.x += Math.cos(this.angle) * this.speed;
            this.y += Math.sin(this.angle) * this.speed;
            this.life++;
            
            if (this.life > this.maxLife || this.x > width || this.y > height) {
                this.reset();
            }
        }
        
        draw(ctx) {
            if (!this.active) return;
            
            const tailX = this.x - Math.cos(this.angle) * this.length;
            const tailY = this.y - Math.sin(this.angle) * this.length;
            const alpha = Math.max(0, 1 - this.life / this.maxLife);
            
            const grad = ctx.createLinearGradient(tailX, tailY, this.x, this.y);
            grad.addColorStop(0, `rgba(230, 224, 208, 0)`);
            grad.addColorStop(0.5, `rgba(230, 224, 208, ${alpha * 0.3})`);
            grad.addColorStop(1, `rgba(255, 255, 255, ${alpha})`);
            
            ctx.beginPath();
            ctx.moveTo(tailX, tailY);
            ctx.lineTo(this.x, this.y);
            ctx.strokeStyle = grad;
            ctx.lineWidth = 1.5;
            ctx.lineCap = 'round';
            ctx.stroke();
            
            // Head glow
            ctx.beginPath();
            ctx.arc(this.x, this.y, 2, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
            ctx.fill();
        }
    }
    
    for (let i = 0; i < 3; i++) {
        shootingStars.push(new ShootingStar());
    }
    
    // ─── Ink Particles ───
    const inkParticles = [];
    const MAX_INK = 40;
    
    class InkParticle {
        constructor() {
            this.reset();
        }
        
        reset() {
            this.x = Math.random() * width;
            this.y = height + Math.random() * 50;
            this.size = 1 + Math.random() * 3;
            this.speedY = 0.2 + Math.random() * 0.5;
            this.drift = (Math.random() - 0.5) * 0.3;
            this.phase = Math.random() * Math.PI * 2;
            this.life = 0;
            this.maxLife = 600 + Math.random() * 600;
            this.opacity = 0;
            this.fadeIn = 60 + Math.random() * 60;
        }
        
        update() {
            this.life++;
            this.y -= this.speedY;
            this.x += Math.sin(this.life * 0.01 + this.phase) * 0.5 + this.drift;
            
            if (this.life < this.fadeIn) {
                this.opacity = this.life / this.fadeIn * 0.15;
            } else if (this.life > this.maxLife - this.fadeIn) {
                this.opacity = (this.maxLife - this.life) / this.fadeIn * 0.15;
            }
            
            if (this.life >= this.maxLife || this.y < -10) {
                this.reset();
            }
        }
        
        draw(ctx) {
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(80, 90, 110, ${this.opacity})`;
            ctx.fill();
        }
    }
    
    function initInk() {
        inkParticles.length = 0;
        for (let i = 0; i < MAX_INK; i++) {
            const p = new InkParticle();
            p.y = Math.random() * height;
            p.life = Math.random() * p.maxLife;
            inkParticles.push(p);
        }
    }
    
    // ─── Nebula Clouds ───
    let nebulae = [];
    
    function initNebulae() {
        nebulae = [];
        const count = 4;
        for (let i = 0; i < count; i++) {
            nebulae.push({
                x: Math.random() * width,
                y: Math.random() * height,
                radius: 200 + Math.random() * 300,
                color: i % 2 === 0 ? '30, 40, 70' : '20, 30, 50',
                alpha: 0.03 + Math.random() * 0.04,
                phase: Math.random() * Math.PI * 2
            });
        }
    }
    
    function drawNebulae(time) {
        for (const n of nebulae) {
            const x = n.x + Math.sin(time * 0.0003 + n.phase) * 30;
            const y = n.y + Math.cos(time * 0.0002 + n.phase) * 20;
            
            const grad = ctx.createRadialGradient(x, y, 0, x, y, n.radius);
            grad.addColorStop(0, `rgba(${n.color}, ${n.alpha})`);
            grad.addColorStop(0.5, `rgba(${n.color}, ${n.alpha * 0.5})`);
            grad.addColorStop(1, `rgba(${n.color}, 0)`);
            
            ctx.fillStyle = grad;
            ctx.fillRect(0, 0, width, height);
        }
    }
    
    // ─── Mouse Tracking ───
    document.addEventListener('mousemove', (e) => {
        targetMouseX = e.clientX;
        targetMouseY = e.clientY;
    });
    
    // Smooth mouse
    function updateMouse() {
        mouseX += (targetMouseX - mouseX) * 0.05;
        mouseY += (targetMouseY - mouseY) * 0.05;
    }
    
    // ─── Main Loop ───
    function animate(time) {
        ctx.clearRect(0, 0, width, height);
        
        updateMouse();
        
        // Background gradient
        const bgGrad = ctx.createRadialGradient(width * 0.5, height * 0.4, 0, width * 0.5, height * 0.4, width * 0.8);
        bgGrad.addColorStop(0, 'rgba(12, 17, 32, 0.5)');
        bgGrad.addColorStop(1, 'rgba(6, 8, 16, 0)');
        ctx.fillStyle = bgGrad;
        ctx.fillRect(0, 0, width, height);
        
        // Nebulae
        drawNebulae(time);
        
        // Ink particles
        for (const p of inkParticles) {
            p.update();
            p.draw(ctx);
        }
        
        // Stars
        for (const star of stars) {
            star.update(time * 0.001);
            star.draw(ctx);
        }
        
        // Shooting stars
        for (const s of shootingStars) {
            s.update();
            s.draw(ctx);
        }
        
        requestAnimationFrame(animate);
    }
    
    // ─── Init ───
    resize();
    initInk();
    window.addEventListener('resize', resize);
    requestAnimationFrame(animate);
    
    // Export for game.js
    window.BG = { mouseX: () => mouseX, mouseY: () => mouseY };
})();
