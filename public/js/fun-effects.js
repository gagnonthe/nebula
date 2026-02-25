// 🎮 Effets visuels amusants pour le contrôle à distance - Version 2.0+
// 12+ effets améliorés + 10+ nouveaux effets époustouflants!

// Overlay global pour les effets
let effectOverlay = null;
let activeEffectInterval = null;

// Créer l'overlay s'il n'existe pas
function createEffectOverlay() {
    if (!effectOverlay) {
        effectOverlay = document.createElement('div');
        effectOverlay.id = 'fun-effect-overlay';
        effectOverlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100vw;
            height: 100vh;
            z-index: 999999;
            pointer-events: all;
            display: flex;
            align-items: center;
            justify-content: center;
            overflow: hidden;
        `;
        document.body.appendChild(effectOverlay);
    }
    return effectOverlay;
}

// Nettoyer l'overlay
function clearOverlay() {
    if (effectOverlay) {
        effectOverlay.remove();
        effectOverlay = null;
    }
    if (activeEffectInterval) {
        clearInterval(activeEffectInterval);
        activeEffectInterval = null;
    }
    // Nettoyer les animations sur body
    document.body.style.animation = '';
    document.body.style.transform = '';
    document.body.style.filter = '';
    
    // Supprimer tous les styles ajoutés
    const styles = document.querySelectorAll('style[id^="effect-style"]');
    styles.forEach(s => s.remove());
}

// 🎨 Écran de couleur
function screenColor(color = '#000000') {
    clearOverlay();
    const overlay = createEffectOverlay();
    overlay.style.background = color;
    overlay.innerHTML = `
        <button onclick="window.clearFunEffects()" style="
            position: absolute;
            top: 20px;
            right: 20px;
            padding: 12px 24px;
            background: rgba(255,255,255,0.2);
            border: 2px solid rgba(255,255,255,0.5);
            border-radius: 8px;
            color: white;
            font-size: 16px;
            cursor: pointer;
            backdrop-filter: blur(10px);
            transition: all 0.3s;
        " onmouseover="this.style.transform='scale(1.1)'" onmouseout="this.style.transform='scale(1)'">✕ Fermer</button>
    `;
}

// 🖼️ Afficher une image
function displayImage(imageUrl) {
    clearOverlay();
    const overlay = createEffectOverlay();
    overlay.style.background = '#000';
    overlay.innerHTML = `
        <button onclick="window.clearFunEffects()" style="
            position: absolute;
            top: 20px;
            right: 20px;
            padding: 12px 24px;
            background: rgba(255,255,255,0.9);
            border: none;
            border-radius: 8px;
            color: #000;
            font-size: 16px;
            cursor: pointer;
            z-index: 10;
            transition: all 0.3s;
        " onmouseover="this.style.transform='scale(1.1)'" onmouseout="this.style.transform='scale(1)'">✕ Fermer</button>
        <img src="${imageUrl}" style="max-width: 90%; max-height: 90%; object-fit: contain; animation: zoomIn 0.6s ease;">
    `;
    
    const style = document.createElement('style');
    style.id = 'effect-style-image';
    style.textContent = `
        @keyframes zoomIn {
            from { transform: scale(0); opacity: 0; }
            to { transform: scale(1); opacity: 1; }
        }
    `;
    document.head.appendChild(style);
}

// 💬 Message géant
function giantMessage(message, style = 'normal') {
    clearOverlay();
    const overlay = createEffectOverlay();
    
    let fontFamily = 'Arial, sans-serif';
    let color = '#fff';
    let background = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
    let animation = '';
    let fontSize = 'clamp(2rem, 10vw, 8rem)';
    
    if (style === 'comic') {
        fontFamily = 'Comic Sans MS, cursive';
        color = '#FFD700';
        background = 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)';
        animation = 'bounce 1s infinite';
    } else if (style === 'matrix') {
        fontFamily = 'Courier New, monospace';
        color = '#00FF00';
        background = '#000';
        animation = 'glitch-text 0.4s infinite';
    }
    
    overlay.style.background = background;
    overlay.innerHTML = `
        <style id="effect-style-message">
            @keyframes bounce {
                0%, 100% { transform: translateY(0); }
                50% { transform: translateY(-30px); }
            }
            @keyframes glitch-text {
                0%, 100% { text-shadow: 0 0 10px #00FF00; }
                50% { text-shadow: 5px 0 10px #00FF00, -5px 0 10px #FF0000; }
            }
        </style>
        <button onclick="window.clearFunEffects()" style="
            position: absolute;
            top: 20px;
            right: 20px;
            padding: 12px 24px;
            background: rgba(255,255,255,0.2);
            border: 2px solid rgba(255,255,255,0.5);
            border-radius: 8px;
            color: white;
            font-size: 16px;
            cursor: pointer;
        ">✕</button>
        <h1 style="
            font-family: ${fontFamily};
            font-size: ${fontSize};
            color: ${color};
            text-align: center;
            padding: 2rem;
            animation: ${animation};
            font-weight: bold;
            text-shadow: 0 0 20px currentColor;
        ">${message}</h1>
    `;
}

// 🟢 Effet Matrix AMÉLORÉ
function effectMatrix() {
    clearOverlay();
    const overlay = createEffectOverlay();
    overlay.style.background = '#000';
    
    const canvas = document.createElement('canvas');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    canvas.style.display = 'block';
    
    const ctx = canvas.getContext('2d');
    const chars = '01アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワヲン@#$%^&*()';
    const fontSize = 16;
    const columns = canvas.width / fontSize;
    const drops = Array(Math.floor(columns)).fill(1);
    
    function draw() {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.08)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        ctx.fillStyle = '#0F0';
        ctx.font = fontSize + 'px "Courier New", monospace';
        ctx.globalAlpha = 0.8;
        
        for (let i = 0; i < drops.length; i++) {
            const text = chars[Math.floor(Math.random() * chars.length)];
            ctx.fillText(text, i * fontSize, drops[i] * fontSize);
            
            if (drops[i] * fontSize > canvas.height && Math.random() > 0.975) {
                drops[i] = 0;
            }
            drops[i]++;
        }
        ctx.globalAlpha = 1;
    }
    
    activeEffectInterval = setInterval(draw, 33);
    overlay.innerHTML = '';
    overlay.appendChild(canvas);
    overlay.innerHTML += `
        <button onclick="window.clearFunEffects()" style="
            position: absolute;
            top: 20px;
            right: 20px;
            padding: 12px 24px;
            background: rgba(0,255,0,0.2);
            border: 2px solid #0F0;
            border-radius: 8px;
            color: #0F0;
            font-size: 16px;
            cursor: pointer;
        ">✕ SORTIR</button>
    `;
}

// 📺 Effet Glitch AMÉLIORÉ
function effectGlitch() {
    document.body.style.animation = 'glitch-anim-v2 0.2s infinite';
    
    const style = document.createElement('style');
    style.id = 'effect-style-glitch';
    style.textContent = `
        @keyframes glitch-anim-v2 {
            0%, 100% {
                transform: translate(0);
                filter: hue-rotate(0deg) brightness(1);
            }
            20% {
                transform: translate(-8px, 5px);
                filter: hue-rotate(90deg) brightness(1.2);
            }
            40% {
                transform: translate(8px, -5px);
                filter: hue-rotate(180deg) brightness(0.8);
            }
            60% {
                transform: translate(-5px, -8px);
                filter: hue-rotate(270deg) brightness(1.1);
            }
            80% {
                transform: translate(5px, 8px);
                filter: hue-rotate(360deg) brightness(0.9);
            }
        }
    `;
    document.head.appendChild(style);
    
    setTimeout(() => {
        document.body.style.animation = '';
        const s = document.getElementById('effect-style-glitch');
        if (s) s.remove();
    }, 4000);
}

// 📳 Secouer l'écran AMÉLIORÉ
function effectShake() {
    document.body.style.animation = 'shake-v2 0.05s infinite';
    
    const style = document.createElement('style');
    style.id = 'effect-style-shake';
    style.textContent = `
        @keyframes shake-v2 {
            0%, 100% { transform: translateX(0) translateY(0); }
            10% { transform: translateX(-12px) translateY(8px); }
            20% { transform: translateX(12px) translateY(-8px); }
            30% { transform: translateX(-8px) translateY(12px); }
            40% { transform: translateX(8px) translateY(-12px); }
            50% { transform: translateX(-15px) translateY(-8px); }
            60% { transform: translateX(15px) translateY(8px); }
            70% { transform: translateX(-10px) translateY(10px); }
            80% { transform: translateX(10px) translateY(-10px); }
            90% { transform: translateX(-12px) translateY(-12px); }
        }
    `;
    document.head.appendChild(style);
    
    setTimeout(() => {
        document.body.style.animation = '';
        const s = document.getElementById('effect-style-shake');
        if (s) s.remove();
    }, 3000);
}

// 🔄 Rotation 3D AMÉLIORÉE
function effectRotate() {
    document.body.style.animation = 'rotate-3d 3s linear infinite';
    
    const style = document.createElement('style');
    style.id = 'effect-style-rotate';
    style.textContent = `
        @keyframes rotate-3d {
            0% { transform: perspective(1000px) rotateX(0) rotateY(0) rotateZ(0); }
            33% { transform: perspective(1000px) rotateX(360deg) rotateY(0) rotateZ(0); }
            66% { transform: perspective(1000px) rotateX(0) rotateY(360deg) rotateZ(0); }
            100% { transform: perspective(1000px) rotateX(0) rotateY(0) rotateZ(360deg); }
        }
    `;
    document.head.appendChild(style);
    
    setTimeout(() => {
        document.body.style.animation = '';
        document.body.style.transform = '';
        const s = document.getElementById('effect-style-rotate');
        if (s) s.remove();
    }, 5000);
}

// 🌈 Arc-en-ciel AMÉLIORÉ
function effectRainbow() {
    document.body.style.animation = 'rainbow-v2 0.5s linear infinite';
    
    const style = document.createElement('style');
    style.id = 'effect-style-rainbow';
    style.textContent = `
        @keyframes rainbow-v2 {
            0% { filter: hue-rotate(0deg) saturate(1.5) contrast(1.1); }
            25% { filter: hue-rotate(90deg) saturate(1.5) contrast(1.1); }
            50% { filter: hue-rotate(180deg) saturate(1.5) contrast(1.1); }
            75% { filter: hue-rotate(270deg) saturate(1.5) contrast(1.1); }
            100% { filter: hue-rotate(360deg) saturate(1.5) contrast(1.1); }
        }
    `;
    document.head.appendChild(style);
    
    setTimeout(() => {
        document.body.style.animation = '';
        document.body.style.filter = '';
        const s = document.getElementById('effect-style-rainbow');
        if (s) s.remove();
    }, 8000);
}

// 🪩 Disco AMÉLIORÉ 
function effectDisco() {
    clearOverlay();
    const overlay = createEffectOverlay();
    overlay.style.animation = 'disco-v2 0.3s infinite';
    
    const style = document.createElement('style');
    style.id = 'effect-style-disco';
    style.textContent = `
        @keyframes disco-v2 {
            0% { background: #FF0000; }
            12% { background: #FF7F00; }
            24% { background: #FFFF00; }
            36% { background: #00FF00; }
            48% { background: #0000FF; }
            60% { background: #4B0082; }
            72% { background: #9400D3; }
            84% { background: #FF00FF; }
            100% { background: #FF0000; }
        }
        @keyframes spin-disco {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
        }
    `;
    document.head.appendChild(style);
    
    overlay.innerHTML = `
        <button onclick="window.clearFunEffects()" style="
            position: absolute;
            top: 20px;
            right: 20px;
            padding: 12px 24px;
            background: rgba(0,0,0,0.8);
            border: 2px solid white;
            border-radius: 8px;
            color: white;
            font-size: 16px;
            cursor: pointer;
        ">🛑 STOP</button>
        <h1 style="font-size: 6rem; animation: spin-disco 2s linear infinite;">🪩</h1>
    `;
}

// 🌀 Spin AMÉLIORÉ
function effectSpin() {
    document.body.style.animation = 'spin-v2 0.8s ease-in-out 4';
    
    const style = document.createElement('style');
    style.id = 'effect-style-spin';
    style.textContent = `
        @keyframes spin-v2 {
            0% { transform: perspective(800px) rotateZ(0deg) scale(1); }
            25% { transform: perspective(800px) rotateZ(90deg) scale(0.7); }
            50% { transform: perspective(800px) rotateZ(180deg) scale(0.5); }
            75% { transform: perspective(800px) rotateZ(270deg) scale(0.7); }
            100% { transform: perspective(800px) rotateZ(360deg) scale(1); }
        }
    `;
    document.head.appendChild(style);
    
    setTimeout(() => {
        document.body.style.animation = '';
        document.body.style.transform = '';
        const s = document.getElementById('effect-style-spin');
        if (s) s.remove();
    }, 4000);
}

// 🔃 Flip AMÉLIORÉ
function effectFlip() {
    document.body.style.animation = 'flip-v2 0.7s ease-in-out 6';
    
    const style = document.createElement('style');
    style.id = 'effect-style-flip';
    style.textContent = `
        @keyframes flip-v2 {
            0% { transform: perspective(600px) rotateY(0) rotateX(0); }
            50% { transform: perspective(600px) rotateY(180deg) rotateX(45deg); }
            100% { transform: perspective(600px) rotateY(360deg) rotateX(0); }
        }
    `;
    document.head.appendChild(style);
    
    setTimeout(() => {
        document.body.style.animation = '';
        document.body.style.transform = '';
        const s = document.getElementById('effect-style-flip');
        if (s) s.remove();
    }, 4000);
}

// ⛹️ Rebond AMÉLIORÉ
function effectBounce() {
    document.body.style.animation = 'bounce-v2 0.6s cubic-bezier(0.68, -0.55, 0.27, 1.55) 5';
    
    const style = document.createElement('style');
    style.id = 'effect-style-bounce';
    style.textContent = `
        @keyframes bounce-v2 {
            0%, 100% { transform: translateY(0) scale(1); }
            50% { transform: translateY(-80px) scale(1.1); }
        }
    `;
    document.head.appendChild(style);
    
    setTimeout(() => {
        document.body.style.animation = '';
        document.body.style.transform = '';
        const s = document.getElementById('effect-style-bounce');
        if (s) s.remove();
    }, 3000);
}

// ✨ NOUVEAU: Confettis
function effectConfetti() {
    clearOverlay();
    const overlay = createEffectOverlay();
    overlay.style.background = 'transparent';
    overlay.style.pointerEvents = 'none';
    
    const confettis = [];
    for (let i = 0; i < 100; i++) {
        const confetti = document.createElement('div');
        const color = ['#FF0000', '#00FF00', '#0000FF', '#FFD700', '#FF1493', '#00CED1'][Math.floor(Math.random() * 6)];
        confetti.style.cssText = `
            position: absolute;
            width: ${Math.random() * 10 + 5}px;
            height: ${Math.random() * 10 + 5}px;
            background: ${color};
            left: ${Math.random() * 100}%;
            top: -10px;
            border-radius: 50%;
            animation: fall-confetti ${Math.random() * 2 + 2}s linear infinite;
            animation-delay: ${Math.random() * 0.5}s;
        `;
        overlay.appendChild(confetti);
        confettis.push(confetti);
    }
    
    const style = document.createElement('style');
    style.id = 'effect-style-confetti';
    style.textContent = `
        @keyframes fall-confetti {
            to {
                transform: translateY(100vh) rotate(360deg);
                opacity: 0;
            }
        }
    `;
    document.head.appendChild(style);
    
    setTimeout(() => clearOverlay(), 5000);
}

// 💥 NOUVEAU: Explosion
function effectExplosion() {
    clearOverlay();
    const overlay = createEffectOverlay();
    overlay.style.background = '#000';
    
    // Flash blanc initial
    overlay.style.opacity = '1';
    overlay.style.background = '#FFF';
    
    setTimeout(() => {
        overlay.style.transition = 'all 0.1s';
        overlay.style.opacity = '0';
    }, 100);
    
    const style = document.createElement('style');
    style.id = 'effect-style-explosion';
    style.textContent = `
        @keyframes explosion-ring {
            from {
                width: 10px;
                height: 10px;
                opacity: 1;
            }
            to {
                width: 300px;
                height: 300px;
                opacity: 0;
            }
        }
    `;
    document.head.appendChild(style);
    
    for (let i = 0; i < 5; i++) {
        const ring = document.createElement('div');
        ring.style.cssText = `
            position: absolute;
            border: 2px solid #FFD700;
            border-radius: 50%;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            animation: explosion-ring ${0.5 + i * 0.1}s ease-out;
            animation-delay: ${i * 0.05}s;
        `;
        overlay.appendChild(ring);
    }
    
    setTimeout(() => clearOverlay(), 3000);
}

// 🌊 NOUVEAU: Vagues
function effectWaves() {
    document.body.style.animation = 'waves-effect 2s ease-in-out infinite';
    
    const style = document.createElement('style');
    style.id = 'effect-style-waves';
    style.textContent = `
        @keyframes waves-effect {
            0%, 100% { transform: skewY(0deg); }
            25% { transform: skewY(3deg); }
            50% { transform: skewY(0deg); }
            75% { transform: skewY(-3deg); }
        }
    `;
    document.head.appendChild(style);
    
    setTimeout(() => {
        document.body.style.animation = '';
        document.body.style.transform = '';
        const s = document.getElementById('effect-style-waves');
        if (s) s.remove();
    }, 5000);
}

// ⚡ NOUVEAU: Lightning
function effectLightning() {
    clearOverlay();
    const overlay = createEffectOverlay();
    
    function createLightning() {
        overlay.style.background = '#000';
        
        // Flash blanc
        setTimeout(() => {
            overlay.style.background = '#FFF';
            overlay.style.filter = 'brightness(2)';
        }, Math.random() * 100);
        
        setTimeout(() => {
            overlay.style.background = '#000';
            overlay.style.filter = 'brightness(0.3)';
        }, Math.random() * 100 + 100);
    }
    
    overlay.style.background = '#000';
    overlay.innerHTML = `
        <button onclick="window.clearFunEffects()" style="
            position: absolute;
            top: 20px;
            right: 20px;
            padding: 12px 24px;
            background: rgba(255,255,255,0.2);
            border: 2px solid white;
            border-radius: 8px;
            color: white;
            font-size: 16px;
            cursor: pointer;
        ">✕ STOP</button>
    `;
    
    activeEffectInterval = setInterval(createLightning, 800);
    setTimeout(() => clearOverlay(), 6000);
}

// 🎨 NOUVEAU: Pixels
function effectPixels() {
    document.body.style.animation = 'pixels-effect 0.3s steps(4, end) infinite';
    
    const style = document.createElement('style');
    style.id = 'effect-style-pixels';
    style.textContent = `
        @keyframes pixels-effect {
            0%, 100% { filter: blur(0px); }
            50% { filter: blur(8px); }
        }
    `;
    document.head.appendChild(style);
    
    setTimeout(() => {
        document.body.style.animation = '';
        document.body.style.filter = '';
        const s = document.getElementById('effect-style-pixels');
        if (s) s.remove();
    }, 4000);
}

// 🌀 NOUVEAU: Kaleidoscope
function effectKaleidoscope() {
    document.body.style.animation = 'kaleidoscope 4s linear infinite';
    
    const style = document.createElement('style');
    style.id = 'effect-style-kaleidoscope';
    style.textContent = `
        @keyframes kaleidoscope {
            0% { 
                filter: hue-rotate(0deg);
                transform: scale(1) rotate(0deg);
            }
            25% { 
                filter: hue-rotate(90deg);
                transform: scale(1.1) rotate(90deg);
            }
            50% { 
                filter: hue-rotate(180deg);
                transform: scale(1) rotate(180deg);
            }
            75% { 
                filter: hue-rotate(270deg);
                transform: scale(1.1) rotate(270deg);
            }
            100% { 
                filter: hue-rotate(360deg);
                transform: scale(1) rotate(360deg);
            }
        }
    `;
    document.head.appendChild(style);
    
    setTimeout(() => {
        document.body.style.animation = '';
        document.body.style.transform = '';
        document.body.style.filter = '';
        const s = document.getElementById('effect-style-kaleidoscope');
        if (s) s.remove();
    }, 6000);
}

// 💫 NOUVEAU: Pulsation
function effectPulse() {
    document.body.style.animation = 'pulse-effect 0.5s ease-in-out infinite';
    
    const style = document.createElement('style');
    style.id = 'effect-style-pulse';
    style.textContent = `
        @keyframes pulse-effect {
            0%, 100% { 
                transform: scale(1);
                filter: brightness(1);
            }
            50% { 
                transform: scale(1.05);
                filter: brightness(1.3);
            }
        }
    `;
    document.head.appendChild(style);
    
    setTimeout(() => {
        document.body.style.animation = '';
        document.body.style.transform = '';
        document.body.style.filter = '';
        const s = document.getElementById('effect-style-pulse');
        if (s) s.remove();
    }, 5000);
}

// 🌀 NOUVEAU: Whirlpool
function effectWhirlpool() {
    document.body.style.animation = 'whirlpool 2s ease-in-out infinite';
    
    const style = document.createElement('style');
    style.id = 'effect-style-whirlpool';
    style.textContent = `
        @keyframes whirlpool {
            0% { 
                transform: scale(1) rotate(0deg);
                filter: blur(0px);
            }
            50% { 
                transform: scale(0.9) rotate(180deg);
                filter: blur(3px) brightness(0.8);
            }
            100% { 
                transform: scale(1) rotate(360deg);
                filter: blur(0px);
            }
        }
    `;
    document.head.appendChild(style);
    
    setTimeout(() => {
        document.body.style.animation = '';
        document.body.style.transform = '';
        document.body.style.filter = '';
        const s = document.getElementById('effect-style-whirlpool');
        if (s) s.remove();
    }, 6000);
}

// 🔮 NOUVEAU: Psychedelic
function effectPsychedelic() {
    const style = document.createElement('style');
    style.id = 'effect-style-psychedelic';
    style.textContent = `
        @keyframes psychedelic {
            0% { filter: hue-rotate(0deg) brightness(1) contrast(1); }
            25% { filter: hue-rotate(90deg) brightness(1.2) contrast(1.5); }
            50% { filter: hue-rotate(180deg) brightness(0.8) contrast(0.8); }
            75% { filter: hue-rotate(270deg) brightness(1.2) contrast(1.5); }
            100% { filter: hue-rotate(360deg) brightness(1) contrast(1); }
        }
    `;
    document.head.appendChild(style);
    
    document.body.style.animation = 'psychedelic 0.5s linear infinite';
    
    setTimeout(() => {
        document.body.style.animation = '';
        document.body.style.filter = '';
        const s = document.getElementById('effect-style-psychedelic');
        if (s) s.remove();
    }, 6000);
}

// 🌊 NOUVEAU: Tsunami
function effectTsunami() {
    document.body.style.animation = 'tsunami 0.8s ease-in-out infinite';
    
    const style = document.createElement('style');
    style.id = 'effect-style-tsunami';
    style.textContent = `
        @keyframes tsunami {
            0%, 100% { transform: translateY(0); }
            25% { transform: translateY(-40px) skewX(-3deg); }
            50% { transform: translateY(0); }
            75% { transform: translateY(-40px) skewX(3deg); }
        }
    `;
    document.head.appendChild(style);
    
    setTimeout(() => {
        document.body.style.animation = '';
        document.body.style.transform = '';
        const s = document.getElementById('effect-style-tsunami');
        if (s) s.remove();
    }, 5000);
}

// 🌌 NOUVEAU: Cosmic
function effectCosmic() {
    clearOverlay();
    const overlay = createEffectOverlay();
    
    // Gradient animé
    overlay.style.background = 'linear-gradient(45deg, #000, #0a0a1a, #2a0845, #000)';
    overlay.style.backgroundSize = '400% 400%';
    overlay.style.animation = 'cosmic-shift 3s ease infinite';
    
    // Ajouter des étoiles
    for (let i = 0; i < 50; i++) {
        const star = document.createElement('div');
        star.style.cssText = `
            position: absolute;
            width: ${Math.random() * 3}px;
            height: ${Math.random() * 3}px;
            background: white;
            border-radius: 50%;
            left: ${Math.random() * 100}%;
            top: ${Math.random() * 100}%;
            animation: twinkle ${Math.random() * 2 + 1}s infinite;
            animation-delay: ${Math.random() * 2}s;
        `;
        overlay.appendChild(star);
    }
    
    const style = document.createElement('style');
    style.id = 'effect-style-cosmic';
    style.textContent = `
        @keyframes cosmic-shift {
            0%, 100% { background-position: 0% 50%; }
            50% { background-position: 100% 50%; }
        }
        @keyframes twinkle {
            0%, 100% { opacity: 0.3; }
            50% { opacity: 1; }
        }
    `;
    document.head.appendChild(style);
    
    overlay.innerHTML += `
        <button onclick="window.clearFunEffects()" style="
            position: absolute;
            top: 20px;
            right: 20px;
            padding: 12px 24px;
            background: rgba(255,255,255,0.1);
            border: 2px solid white;
            border-radius: 8px;
            color: white;
            font-size: 16px;
            cursor: pointer;
        ">✕ SORTIR</button>
        <h1 style="font-size: 3rem; color: white; text-shadow: 0 0 20px rgba(138, 43, 226, 0.8);">🌌 COSMIC 🌌</h1>
    `;
    
    setTimeout(() => clearOverlay(), 8000);
}

// 💥 Chaos Mode AMÉLIORÉ avec tous les effets!
function effectChaos() {
    const effects = [
        effectGlitch, effectShake, effectRainbow, effectSpin, effectBounce,
        effectFlip, effectWaves, effectLightning, effectConfetti, effectKaleidoscope,
        effectPulse, effectPixels, effectWhirlpool, effectPsychedelic, effectTsunami, effectCosmic
    ];
    let count = 0;
    
    const interval = setInterval(() => {
        const randomEffect = effects[Math.floor(Math.random() * effects.length)];
        randomEffect();
        count++;
        
        if (count >= 12) {
            clearInterval(interval);
        }
    }, 1200);
}

// Exposer les fonctions globalement
window.screenColor = screenColor;
window.displayImage = displayImage;
window.giantMessage = giantMessage;
window.effectMatrix = effectMatrix;
window.effectGlitch = effectGlitch;
window.effectShake = effectShake;
window.effectRotate = effectRotate;
window.effectRainbow = effectRainbow;
window.effectDisco = effectDisco;
window.effectSpin = effectSpin;
window.effectFlip = effectFlip;
window.effectBounce = effectBounce;
window.effectConfetti = effectConfetti;
window.effectExplosion = effectExplosion;
window.effectWaves = effectWaves;
window.effectLightning = effectLightning;
window.effectPixels = effectPixels;
window.effectKaleidoscope = effectKaleidoscope;
window.effectPulse = effectPulse;
window.effectWhirlpool = effectWhirlpool;
window.effectPsychedelic = effectPsychedelic;
window.effectTsunami = effectTsunami;
window.effectCosmic = effectCosmic;
window.effectChaos = effectChaos;
window.clearFunEffects = clearOverlay;
