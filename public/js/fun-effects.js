// 🎮 Effets visuels amusants pour le contrôle à distance

// Overlay global pour les effets
let effectOverlay = null;

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
    // Nettoyer les animations sur body
    document.body.style.animation = '';
    document.body.style.transform = '';
    document.body.style.filter = '';
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
        ">✕ Fermer</button>
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
        ">✕ Fermer</button>
        <img src="${imageUrl}" style="max-width: 90%; max-height: 90%; object-fit: contain;">
    `;
}

// 💬 Message géant
function giantMessage(message, style = 'normal') {
    clearOverlay();
    const overlay = createEffectOverlay();
    
    let fontFamily = 'Arial, sans-serif';
    let color = '#fff';
    let background = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
    let animation = '';
    
    if (style === 'comic') {
        fontFamily = 'Comic Sans MS, cursive';
        color = '#FFD700';
        background = 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)';
        animation = 'bounce 1s infinite';
    } else if (style === 'matrix') {
        fontFamily = 'Courier New, monospace';
        color = '#00FF00';
        background = '#000';
        animation = 'glitch 0.5s infinite';
    }
    
    overlay.style.background = background;
    overlay.innerHTML = `
        <style>
            @keyframes bounce {
                0%, 100% { transform: translateY(0); }
                50% { transform: translateY(-20px); }
            }
            @keyframes glitch {
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
            font-size: clamp(2rem, 10vw, 8rem);
            color: ${color};
            text-align: center;
            padding: 2rem;
            animation: ${animation};
            font-weight: bold;
            text-shadow: 0 0 20px currentColor;
        ">${message}</h1>
    `;
}

// 🟢 Effet Matrix
function effectMatrix() {
    clearOverlay();
    const overlay = createEffectOverlay();
    overlay.style.background = '#000';
    
    const canvas = document.createElement('canvas');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    canvas.style.display = 'block';
    
    const ctx = canvas.getContext('2d');
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789@#$%^&*()';
    const fontSize = 14;
    const columns = canvas.width / fontSize;
    const drops = Array(Math.floor(columns)).fill(1);
    
    function draw() {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.05)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        ctx.fillStyle = '#0F0';
        ctx.font = fontSize + 'px monospace';
        
        for (let i = 0; i < drops.length; i++) {
            const text = chars[Math.floor(Math.random() * chars.length)];
            ctx.fillText(text, i * fontSize, drops[i] * fontSize);
            
            if (drops[i] * fontSize > canvas.height && Math.random() > 0.975) {
                drops[i] = 0;
            }
            drops[i]++;
        }
    }
    
    const interval = setInterval(draw, 33);
    overlay.dataset.interval = interval;
    
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

// 📺 Effet Glitch
function effectGlitch() {
    document.body.style.animation = 'glitch-anim 0.3s infinite';
    
    const style = document.createElement('style');
    style.id = 'glitch-style';
    style.textContent = `
        @keyframes glitch-anim {
            0%, 100% {
                transform: translate(0);
                filter: hue-rotate(0deg);
            }
            20% {
                transform: translate(-5px, 5px);
                filter: hue-rotate(90deg);
            }
            40% {
                transform: translate(5px, -5px);
                filter: hue-rotate(180deg);
            }
            60% {
                transform: translate(-5px, -5px);
                filter: hue-rotate(270deg);
            }
            80% {
                transform: translate(5px, 5px);
                filter: hue-rotate(360deg);
            }
        }
    `;
    document.head.appendChild(style);
    
    setTimeout(() => {
        document.body.style.animation = '';
        const s = document.getElementById('glitch-style');
        if (s) s.remove();
    }, 5000);
}

// 📳 Secouer l'écran
function effectShake() {
    document.body.style.animation = 'shake 0.5s infinite';
    
    const style = document.createElement('style');
    style.id = 'shake-style';
    style.textContent = `
        @keyframes shake {
            0%, 100% { transform: translateX(0); }
            10%, 30%, 50%, 70%, 90% { transform: translateX(-10px); }
            20%, 40%, 60%, 80% { transform: translateX(10px); }
        }
    `;
    document.head.appendChild(style);
    
    setTimeout(() => {
        document.body.style.animation = '';
        const s = document.getElementById('shake-style');
        if (s) s.remove();
    }, 3000);
}

// 🔄 Rotation
function effectRotate() {
    document.body.style.animation = 'rotate-360 2s linear infinite';
    
    const style = document.createElement('style');
    style.id = 'rotate-style';
    style.textContent = `
        @keyframes rotate-360 {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
        }
    `;
    document.head.appendChild(style);
    
    setTimeout(() => {
        document.body.style.animation = '';
        document.body.style.transform = '';
        const s = document.getElementById('rotate-style');
        if (s) s.remove();
    }, 5000);
}

// 🌈 Arc-en-ciel
function effectRainbow() {
    document.body.style.animation = 'rainbow 2s linear infinite';
    
    const style = document.createElement('style');
    style.id = 'rainbow-style';
    style.textContent = `
        @keyframes rainbow {
            0% { filter: hue-rotate(0deg); }
            100% { filter: hue-rotate(360deg); }
        }
    `;
    document.head.appendChild(style);
    
    setTimeout(() => {
        document.body.style.animation = '';
        document.body.style.filter = '';
        const s = document.getElementById('rainbow-style');
        if (s) s.remove();
    }, 10000);
}

// 🪩 Disco
function effectDisco() {
    clearOverlay();
    const overlay = createEffectOverlay();
    overlay.style.animation = 'disco 0.5s infinite';
    
    const style = document.createElement('style');
    style.id = 'disco-style';
    style.textContent = `
        @keyframes disco {
            0% { background: #FF0000; }
            14% { background: #FF7F00; }
            28% { background: #FFFF00; }
            42% { background: #00FF00; }
            57% { background: #0000FF; }
            71% { background: #4B0082; }
            85% { background: #9400D3; }
            100% { background: #FF0000; }
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
        ">🛑 STOP DISCO</button>
        <h1 style="font-size: 5rem;">🪩</h1>
    `;
}

// 🌀 Spin
function effectSpin() {
    document.body.style.animation = 'spin 1s ease-in-out 3';
    
    const style = document.createElement('style');
    style.id = 'spin-style';
    style.textContent = `
        @keyframes spin {
            0% { transform: rotate(0deg) scale(1); }
            50% { transform: rotate(180deg) scale(0.5); }
            100% { transform: rotate(360deg) scale(1); }
        }
    `;
    document.head.appendChild(style);
    
    setTimeout(() => {
        document.body.style.animation = '';
        document.body.style.transform = '';
        const s = document.getElementById('spin-style');
        if (s) s.remove();
    }, 3000);
}

// 🔃 Flip
function effectFlip() {
    document.body.style.animation = 'flip 0.6s ease-in-out 5';
    
    const style = document.createElement('style');
    style.id = 'flip-style';
    style.textContent = `
        @keyframes flip {
            0% { transform: perspective(400px) rotateY(0); }
            100% { transform: perspective(400px) rotateY(360deg); }
        }
    `;
    document.head.appendChild(style);
    
    setTimeout(() => {
        document.body.style.animation = '';
        document.body.style.transform = '';
        const s = document.getElementById('flip-style');
        if (s) s.remove();
    }, 3000);
}

// ⛹️ Rebond
function effectBounce() {
    document.body.style.animation = 'bounce-screen 0.5s ease-in-out 6';
    
    const style = document.createElement('style');
    style.id = 'bounce-style';
    style.textContent = `
        @keyframes bounce-screen {
            0%, 100% { transform: translateY(0); }
            50% { transform: translateY(-50px); }
        }
    `;
    document.head.appendChild(style);
    
    setTimeout(() => {
        document.body.style.animation = '';
        document.body.style.transform = '';
        const s = document.getElementById('bounce-style');
        if (s) s.remove();
    }, 3000);
}

// 💥 Chaos Mode
function effectChaos() {
    // Combinaison de plusieurs effets aléatoires
    const effects = [effectGlitch, effectShake, effectRainbow, effectSpin, effectBounce];
    let count = 0;
    
    const interval = setInterval(() => {
        const randomEffect = effects[Math.floor(Math.random() * effects.length)];
        randomEffect();
        count++;
        
        if (count >= 5) {
            clearInterval(interval);
        }
    }, 2000);
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
window.effectChaos = effectChaos;
window.clearFunEffects = clearOverlay;
