// ============================================================
// INK & AETHER - Main Game Engine
// ============================================================

// ─── Touch Detection ───
if ('ontouchstart' in window || navigator.maxTouchPoints > 0) {
    document.body.classList.add('touch-device');
}

// ─── Game State ───
const state = {
    scene: 'title',
    completed: new Set(),
    currentIsland: null,
    audioCtx: null,
    audioEnabled: false,
    constellation: {
        stars: [],
        connections: [],
        selectedStar: null,
        hoveredStar: null,
        animating: false,
        completed: false
    }
};

// ─── DOM Refs ───
const $ = id => document.getElementById(id);
const scenes = {
    title: $('title-screen'),
    prologue: $('prologue-screen'),
    world: $('world-screen'),
    game: $('game-screen'),
    ending: $('ending-screen')
};

// ─── Scene Management ───
function switchScene(name) {
    const overlay = $('transition-overlay');
    overlay.classList.add('active');
    
    // Cancel constellation animation if leaving game
    if (state.scene === 'game' && animFrame) {
        cancelAnimationFrame(animFrame);
        animFrame = null;
    }
    
    setTimeout(() => {
        Object.values(scenes).forEach(s => s.classList.remove('active'));
        scenes[name].classList.add('active');
        state.scene = name;
        
        if (name === 'prologue') startPrologue();
        if (name === 'world') renderWorld();
        if (name === 'game') startConstellation();
        if (name === 'ending') startEnding();
        if (name === 'title') resetTitleAnimations();
        
        setTimeout(() => overlay.classList.remove('active'), 100);
    }, 1200);
}

// ─── Cursor ───
(function initCursor() {
    const dot = $('cursor-dot');
    const glow = $('cursor-glow');
    let x = 0, y = 0, tx = 0, ty = 0;
    
    document.addEventListener('mousemove', e => { tx = e.clientX; ty = e.clientY; });
    
    function update() {
        x += (tx - x) * 0.15;
        y += (ty - y) * 0.15;
        dot.style.left = x + 'px'; dot.style.top = y + 'px';
        glow.style.left = x + 'px'; glow.style.top = y + 'px';
        requestAnimationFrame(update);
    }
    update();
    
    document.querySelectorAll('button, .island-node').forEach(el => {
        el.addEventListener('mouseenter', () => document.body.classList.add('hovering'));
        el.addEventListener('mouseleave', () => document.body.classList.remove('hovering'));
    });
})();

// ─── Title Parallax ───
(function initTitleParallax() {
    const titleContainer = document.querySelector('.title-container');
    if (!titleContainer) return;
    
    document.addEventListener('mousemove', e => {
        if (state.scene !== 'title') return;
        const x = (e.clientX / window.innerWidth - 0.5) * 2;
        const y = (e.clientY / window.innerHeight - 0.5) * 2;
        titleContainer.style.transform = `perspective(1000px) rotateY(${x * 3}deg) rotateX(${-y * 3}deg)`;
    });
})();

// ─── Audio Engine ───
function initAudio() {
    if (state.audioEnabled) return;
    try {
        state.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        state.audioEnabled = true;
        playAmbient();
    } catch(e) { /* Audio not supported */ }
}

function playAmbient() {
    if (!state.audioCtx) return;
    const ctx = state.audioCtx;
    
    // Deep drone
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.frequency.value = 55;
    osc1.type = 'sine';
    gain1.gain.value = 0.03;
    osc1.connect(gain1).connect(ctx.destination);
    osc1.start();
    
    // Higher harmonic
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.frequency.value = 110;
    osc2.type = 'triangle';
    gain2.gain.value = 0.01;
    osc2.connect(gain2).connect(ctx.destination);
    osc2.start();
    
    // LFO for movement
    const lfo = ctx.createOscillator();
    const lfoGain = ctx.createGain();
    lfo.frequency.value = 0.1;
    lfoGain.gain.value = 5;
    lfo.connect(lfoGain).connect(osc1.frequency);
    lfo.start();
}

function playTone(freq, duration, type = 'sine', vol = 0.05) {
    if (!state.audioCtx) return;
    const ctx = state.audioCtx;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.frequency.value = freq;
    osc.type = type;
    gain.gain.setValueAtTime(vol, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
    osc.connect(gain).connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + duration);
}

function playStarSound() { playTone(440 + Math.random() * 200, 0.3, 'sine', 0.03); }
function playConnectSound() { playTone(330, 0.4, 'triangle', 0.03); }
function playSuccessSound() {
    [523, 659, 784, 1047].forEach((f, i) => setTimeout(() => playTone(f, 0.5, 'sine', 0.04), i * 150));
}
function playErrorSound() { playTone(150, 0.3, 'sawtooth', 0.02); }

// ─── Title Screen ───
$('start-btn').addEventListener('click', () => {
    initAudio();
    switchScene('prologue');
});

// ─── Prologue ───
function startPrologue() {
    const lines = document.querySelectorAll('.prologue-line');
    const btn = $('prologue-continue');
    btn.classList.add('hidden');
    
    lines.forEach(l => l.classList.remove('visible'));
    
    let delay = 500;
    lines.forEach((line, i) => {
        setTimeout(() => {
            line.classList.add('visible');
            if (state.audioEnabled) playTone(200 + i * 30, 0.5, 'sine', 0.015);
        }, delay);
        delay += 1800;
    });
    
    setTimeout(() => {
        btn.classList.remove('hidden');
        btn.classList.add('fade-in');
    }, delay + 500);
}

$('prologue-continue').addEventListener('click', () => switchScene('world'));

// ─── World Map ───
function renderWorld() {
    const container = $('islands-container');
    container.innerHTML = '';
    
    let unlocked = true;
    ISLANDS.forEach((island, i) => {
        const node = document.createElement('div');
        const isCompleted = state.completed.has(island.id);
        const isLocked = !unlocked;
        
        node.className = `island-node ${isCompleted ? 'completed' : ''} ${isLocked ? 'locked' : ''}`;
        node.style.transitionDelay = (i * 0.15) + 's';
        node.style.setProperty('--delay', i * 0.5);
        node.innerHTML = `
            <div class="island-glow"></div>
            <div class="island-shape">
                <span class="island-icon">${island.icon}</span>
            </div>
            <span class="island-name">${island.name}</span>
        `;
        
        if (!isLocked) {
            node.addEventListener('click', () => {
                state.currentIsland = island;
                playConnectSound();
                switchScene('game');
            });
            node.addEventListener('mouseenter', () => document.body.classList.add('hovering'));
            node.addEventListener('mouseleave', () => document.body.classList.remove('hovering'));
        }
        
        container.appendChild(node);
        
        // Staggered reveal
        setTimeout(() => node.classList.add('visible'), 100 + i * 100);
        
        if (!isCompleted) unlocked = false;
    });
    
    // Progress
    const progress = (state.completed.size / ISLANDS.length) * 100;
    $('world-progress').style.width = progress + '%';
    $('progress-count').textContent = `${state.completed.size} / ${ISLANDS.length}`;
}

// ─── Constellation Game ───
let cCanvas, cCtx, cDpr, cW, cH;
let animFrame;

function initCCanvas() {
    cCanvas = $('constellation-canvas');
    cCtx = cCanvas.getContext('2d');
    resizeCCanvas();
    window.addEventListener('resize', resizeCCanvas);
}

function resizeCCanvas() {
    cDpr = Math.min(window.devicePixelRatio, 2);
    cW = window.innerWidth;
    cH = window.innerHeight;
    cCanvas.width = cW * cDpr;
    cCanvas.height = cH * cDpr;
    cCanvas.style.width = cW + 'px';
    cCanvas.style.height = cH + 'px';
    cCtx.scale(cDpr, cDpr);
}

function startConstellation() {
    const island = state.currentIsland;
    if (!island) return;
    
    $('island-name').textContent = island.name;
    updateGameHint();
    
    // Reset constellation state
    state.constellation = {
        stars: island.constellation.stars.map((s, i) => ({
            id: i,
            x: s.x * cW,
            y: s.y * cH,
            r: 8,
            hovered: false,
            selected: false,
            connected: false,
            glowPhase: Math.random() * Math.PI * 2
        })),
        connections: [],
        targetConnections: island.constellation.connections,
        selectedStar: null,
        hoveredStar: null,
        animating: false,
        completed: false,
        inkTrails: [],
        wrongTrails: [],
        particles: []
    };
    
    const panel = $('narrative-panel');
    panel.classList.remove('visible');
    panel.classList.add('hidden');
    
    if (animFrame) cancelAnimationFrame(animFrame);
    animateConstellation();
}

function animateConstellation() {
    cCtx.clearRect(0, 0, cW, cH);
    const time = Date.now();
    const cs = state.constellation;
    
    // Draw ghost constellation (faint outline)
    cCtx.save();
    cCtx.strokeStyle = 'rgba(201, 162, 39, 0.08)';
    cCtx.lineWidth = 1;
    cCtx.setLineDash([5, 10]);
    for (const [a, b] of cs.targetConnections) {
        const sa = cs.stars[a], sb = cs.stars[b];
        cCtx.beginPath();
        cCtx.moveTo(sa.x, sa.y);
        cCtx.lineTo(sb.x, sb.y);
        cCtx.stroke();
    }
    cCtx.restore();
    
    // Draw all player connections
    for (const conn of cs.connections) {
        const sa = cs.stars[conn.a], sb = cs.stars[conn.b];
        const isCorrect = cs.targetConnections.some(tc =>
            (tc[0] === conn.a && tc[1] === conn.b) || (tc[0] === conn.b && tc[1] === conn.a)
        );
        
        const color = isCorrect ? '201, 162, 39' : '180, 70, 50';
        const alpha = isCorrect 
            ? 0.4 + Math.sin(time * 0.002 + conn.a) * 0.1
            : 0.25;
        
        const grad = cCtx.createLinearGradient(sa.x, sa.y, sb.x, sb.y);
        grad.addColorStop(0, `rgba(${color}, ${alpha})`);
        grad.addColorStop(1, `rgba(${color}, ${alpha})`);
        
        cCtx.beginPath();
        cCtx.moveTo(sa.x, sa.y);
        cCtx.lineTo(sb.x, sb.y);
        cCtx.strokeStyle = grad;
        cCtx.lineWidth = isCorrect ? 2.5 : 1.5;
        cCtx.lineCap = 'round';
        cCtx.stroke();
        
        // Glow on correct lines
        if (isCorrect) {
            cCtx.beginPath();
            cCtx.moveTo(sa.x, sa.y);
            cCtx.lineTo(sb.x, sb.y);
            cCtx.strokeStyle = `rgba(201, 162, 39, 0.06)`;
            cCtx.lineWidth = 14;
            cCtx.stroke();
        }
    }
    
    // Draw active ink trails (correct)
    for (const trail of cs.inkTrails) {
        const progress = Math.min(1, (time - trail.start) / trail.duration);
        const cx = trail.sx + (trail.ex - trail.sx) * progress;
        const cy = trail.sy + (trail.ey - trail.sy) * progress;
        
        cCtx.beginPath();
        cCtx.moveTo(trail.sx, trail.sy);
        cCtx.lineTo(cx, cy);
        cCtx.strokeStyle = `rgba(201, 162, 39, ${0.6 * (1 - progress)})`;
        cCtx.lineWidth = 2.5;
        cCtx.stroke();
        
        if (progress >= 1) {
            cs.inkTrails = cs.inkTrails.filter(t => t !== trail);
        }
    }
    
    // Draw wrong connection flashes
    for (const trail of cs.wrongTrails) {
        const progress = Math.min(1, (time - trail.start) / trail.duration);
        const cx = trail.sx + (trail.ex - trail.sx) * progress;
        const cy = trail.sy + (trail.ey - trail.sy) * progress;
        
        cCtx.beginPath();
        cCtx.moveTo(trail.sx, trail.sy);
        cCtx.lineTo(cx, cy);
        cCtx.strokeStyle = `rgba(200, 80, 60, ${0.5 * (1 - progress)})`;
        cCtx.lineWidth = 2;
        cCtx.stroke();
        
        // Red flash at end
        if (progress > 0.7) {
            cCtx.beginPath();
            cCtx.arc(trail.ex, trail.ey, 12 * (1 - progress) * 3, 0, Math.PI * 2);
            cCtx.fillStyle = `rgba(200, 80, 60, ${0.3 * (1 - progress)})`;
            cCtx.fill();
        }
        
        if (progress >= 1) {
            cs.wrongTrails = cs.wrongTrails.filter(t => t !== trail);
        }
    }
    
    // Success particles
    for (const p of cs.particles) {
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.02;
        p.life -= 0.01;
        p.radius *= 0.99;
        
        if (p.life > 0) {
            cCtx.beginPath();
            cCtx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
            cCtx.fillStyle = `rgba(201, 162, 39, ${p.life})`;
            cCtx.fill();
        }
    }
    cs.particles = cs.particles.filter(p => p.life > 0);
    
    // Draw stars
    for (const star of cs.stars) {
        const glow = Math.sin(time * 0.003 + star.glowPhase) * 0.3 + 0.7;
        const isSelected = star.selected;
        const isHovered = star.hovered;
        const isConnected = star.connected;
        
        const baseR = star.r + (isHovered ? 3 : 0) + (isSelected ? 2 : 0);
        const alpha = isConnected ? 1 : 0.7;
        
        // Completion pulse multiplier
        const completionPulse = cs.completed ? 1 + Math.sin(time * 0.004) * 0.3 : 1;
        
        // Outer glow
        const glowR = baseR * (isSelected ? 6 : isHovered ? 4 : 2.5) * completionPulse;
        const glowGrad = cCtx.createRadialGradient(star.x, star.y, 0, star.x, star.y, glowR);
        const color = isConnected ? '90, 138, 181' : '201, 162, 39';
        const glowAlpha = cs.completed ? 0.4 : 0.2;
        glowGrad.addColorStop(0, `rgba(${color}, ${glowAlpha * alpha * glow})`);
        glowGrad.addColorStop(1, `rgba(${color}, 0)`);
        cCtx.fillStyle = glowGrad;
        cCtx.fillRect(star.x - glowR, star.y - glowR, glowR * 2, glowR * 2);
        
        // Star body
        cCtx.beginPath();
        cCtx.arc(star.x, star.y, baseR * (cs.completed ? 1.2 : 1), 0, Math.PI * 2);
        cCtx.fillStyle = isConnected ? `rgba(140, 190, 230, ${alpha})` : `rgba(230, 220, 200, ${alpha})`;
        cCtx.fill();
        
        // Inner highlight
        cCtx.beginPath();
        cCtx.arc(star.x - 2, star.y - 2, baseR * 0.4, 0, Math.PI * 2);
        cCtx.fillStyle = `rgba(255, 255, 255, ${0.5 * alpha})`;
        cCtx.fill();
        
        // Ring for selected
        if (isSelected) {
            cCtx.beginPath();
            cCtx.arc(star.x, star.y, baseR + 6, 0, Math.PI * 2);
            cCtx.strokeStyle = `rgba(201, 162, 39, ${0.5 + Math.sin(time * 0.005) * 0.3})`;
            cCtx.lineWidth = 1.5;
            cCtx.stroke();
        }
    }
    
    // Completion overlay glow
    if (cs.completed) {
        const pulse = 0.15 + Math.sin(time * 0.003) * 0.05;
        const centerX = cs.stars.reduce((sum, s) => sum + s.x, 0) / cs.stars.length;
        const centerY = cs.stars.reduce((sum, s) => sum + s.y, 0) / cs.stars.length;
        const maxDist = Math.max(...cs.stars.map(s => Math.sqrt((s.x - centerX)**2 + (s.y - centerY)**2)));
        
        const grad = cCtx.createRadialGradient(centerX, centerY, 0, centerX, centerY, maxDist + 100);
        grad.addColorStop(0, `rgba(201, 162, 39, ${pulse})`);
        grad.addColorStop(0.5, `rgba(90, 138, 181, ${pulse * 0.5})`);
        grad.addColorStop(1, 'rgba(6, 8, 16, 0)');
        cCtx.fillStyle = grad;
        cCtx.fillRect(0, 0, cW, cH);
    }
    
    animFrame = requestAnimationFrame(animateConstellation);
}

// Constellation interaction
cCanvas = $('constellation-canvas');

function getMousePos(e) {
    const rect = cCanvas.getBoundingClientRect();
    return {
        x: (e.clientX - rect.left) * (cCanvas.width / rect.width / cDpr),
        y: (e.clientY - rect.top) * (cCanvas.height / rect.height / cDpr)
    };
}

function getHoveredStar(pos) {
    const cs = state.constellation;
    for (const star of cs.stars) {
        const dx = pos.x - star.x;
        const dy = pos.y - star.y;
        if (Math.sqrt(dx * dx + dy * dy) < 25) return star;
    }
    return null;
}

cCanvas.addEventListener('mousemove', e => {
    const pos = getMousePos(e);
    const cs = state.constellation;
    if (!cs || cs.completed) return;
    
    // Clear previous hover
    cs.stars.forEach(s => s.hovered = false);
    cs.hoveredStar = null;
    
    const hovered = getHoveredStar(pos);
    if (hovered) {
        hovered.hovered = true;
        cs.hoveredStar = hovered;
        document.body.classList.add('hovering');
    } else {
        document.body.classList.remove('hovering');
    }
});

cCanvas.addEventListener('mouseleave', () => {
    const cs = state.constellation;
    if (!cs) return;
    cs.stars.forEach(s => s.hovered = false);
    cs.hoveredStar = null;
    document.body.classList.remove('hovering');
});

function handleCanvasClick(clientX, clientY) {
    const cs = state.constellation;
    if (!cs || cs.completed || cs.animating) return;
    
    const rect = cCanvas.getBoundingClientRect();
    const pos = {
        x: (clientX - rect.left) * (cCanvas.width / rect.width / cDpr),
        y: (clientY - rect.top) * (cCanvas.height / rect.height / cDpr)
    };
    
    const clicked = getHoveredStar(pos);
    if (!clicked) return;
    
    if (!cs.selectedStar) {
        cs.selectedStar = clicked;
        clicked.selected = true;
        playStarSound();
    } else if (clicked === cs.selectedStar) {
        cs.selectedStar.selected = false;
        cs.selectedStar = null;
    } else {
        const a = cs.selectedStar.id;
        const b = clicked.id;
        
        const exists = cs.connections.some(c => 
            (c.a === a && c.b === b) || (c.a === b && c.b === a)
        );
        
        if (!exists) {
            const isTarget = cs.targetConnections.some(tc => 
                (tc[0] === a && tc[1] === b) || (tc[0] === b && tc[1] === a)
            );
            
            cs.inkTrails.push({
                sx: cs.selectedStar.x, sy: cs.selectedStar.y,
                ex: clicked.x, ey: clicked.y,
                start: Date.now(), duration: 400
            });
            
            setTimeout(() => {
                cs.connections.push({ a, b });
                cs.selectedStar.connected = true;
                clicked.connected = true;
                
                if (isTarget) {
                    playConnectSound();
                    for (let i = 0; i < 8; i++) {
                        cs.particles.push({
                            x: clicked.x, y: clicked.y,
                            vx: (Math.random() - 0.5) * 3,
                            vy: (Math.random() - 0.5) * 3 - 1,
                            radius: 2 + Math.random() * 3,
                            life: 1
                        });
                    }
                } else {
                    playErrorSound();
                    cs.wrongTrails.push({
                        sx: cs.selectedStar.x, sy: cs.selectedStar.y,
                        ex: clicked.x, ey: clicked.y,
                        start: Date.now(), duration: 500
                    });
                }
                
                updateGameHint();
                checkConstellationComplete();
            }, 200);
        }
        
        cs.selectedStar.selected = false;
        cs.selectedStar = null;
    }
}

cCanvas.addEventListener('click', e => {
    handleCanvasClick(e.clientX, e.clientY);
});

cCanvas.addEventListener('touchstart', e => {
    e.preventDefault();
    if (e.touches.length > 0) {
        handleCanvasClick(e.touches[0].clientX, e.touches[0].clientY);
    }
}, { passive: false });

function countCorrectConnections() {
    const cs = state.constellation;
    let correct = 0;
    for (const tc of cs.targetConnections) {
        const hasConn = cs.connections.some(c =>
            (c.a === tc[0] && c.b === tc[1]) || (c.a === tc[1] && c.b === tc[0])
        );
        if (hasConn) correct++;
    }
    return correct;
}

function updateGameHint() {
    const island = state.currentIsland;
    if (!island) return;
    const correct = countCorrectConnections();
    const total = island.constellation.connections.length;
    const hintEl = $('game-hint');
    if (correct === total) {
        hintEl.textContent = 'Constellation complete! ✦';
        hintEl.style.color = 'var(--gold)';
    } else {
        hintEl.textContent = `Connections found: ${correct} / ${total}`;
        hintEl.style.color = 'var(--muted)';
    }
}

function checkConstellationComplete() {
    const cs = state.constellation;
    const island = state.currentIsland;
    const correct = countCorrectConnections();
    const total = island.constellation.connections.length;
    
    if (correct >= total) {
        cs.completed = true;
        playSuccessSound();
        
        // Big particle explosion at every star
        for (const star of cs.stars) {
            for (let i = 0; i < 6; i++) {
                cs.particles.push({
                    x: star.x, y: star.y,
                    vx: (Math.random() - 0.5) * 6,
                    vy: (Math.random() - 0.5) * 6,
                    radius: 2 + Math.random() * 4,
                    life: 2
                });
            }
        }
        
        // Show narrative after particles settle
        setTimeout(() => showNarrative(island.narrative), 2000);
    }
}

function showNarrative(narrative) {
    const panel = $('narrative-panel');
    $('narrative-title').textContent = narrative.title;
    $('narrative-text').textContent = narrative.text;
    panel.classList.remove('hidden');
    panel.classList.add('visible');
}

$('narrative-close').addEventListener('click', () => {
    $('narrative-panel').classList.remove('visible');
    state.completed.add(state.currentIsland.id);
    
    if (state.completed.size >= ISLANDS.length) {
        setTimeout(() => switchScene('ending'), 500);
    } else {
        setTimeout(() => switchScene('world'), 500);
    }
});

$('back-to-world').addEventListener('click', () => {
    if (animFrame) cancelAnimationFrame(animFrame);
    switchScene('world');
});

// ─── Ending ───
function startEnding() {
    const lines = document.querySelectorAll('.ending-line');
    const btn = $('restart-btn');
    btn.classList.add('hidden');
    
    lines.forEach(l => l.classList.remove('visible'));
    
    let delay = 500;
    lines.forEach((line, i) => {
        setTimeout(() => {
            line.classList.add('visible');
            if (state.audioEnabled) playTone(300 + i * 40, 0.6, 'sine', 0.02);
        }, delay);
        delay += 2000;
    });
    
    setTimeout(() => {
        btn.classList.remove('hidden');
        btn.classList.add('fade-in');
    }, delay + 500);
}

$('restart-btn').addEventListener('click', () => {
    state.completed.clear();
    state.currentIsland = null;
    switchScene('title');
});

function resetTitleAnimations() {
    const titleLines = document.querySelectorAll('.title-line, .title-ampersand');
    const subtitle = document.querySelector('.subtitle');
    const divider = document.querySelector('.title-divider');
    const flavor = document.querySelector('.flavor-text');
    const btn = document.querySelector('#start-btn');
    
    titleLines.forEach(el => {
        el.style.animation = 'none';
        void el.offsetHeight;
        el.style.animation = '';
    });
    
    [subtitle, divider, flavor, btn].forEach(el => {
        if (el) {
            el.style.animation = 'none';
            void el.offsetHeight;
            el.style.animation = '';
        }
    });
}

// ─── Init ───
initCCanvas();
