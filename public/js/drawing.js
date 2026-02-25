// 🎨 Système de dessin collaboratif en temps réel

class DrawingBoard {
    constructor(canvasId = 'drawingCanvas') {
        this.canvas = document.getElementById(canvasId);
        if (!this.canvas) {
            this.createCanvas();
        }
        
        this.ctx = this.canvas.getContext('2d');
        this.isDrawing = false;
        this.lastX = 0;
        this.lastY = 0;
        
        // Paramètres de dessin
        this.color = '#000000';
        this.brushSize = 5;
        this.opacity = 1;
        this.tool = 'pen'; // pen, eraser, line, circle, rect
        
        // Pour les lignes/formes
        this.startX = 0;
        this.startY = 0;
        this.tempImageData = null;
        
        // Socket pour collaboration
        this.socket = null;
        
        // Historique pour Undo
        this.history = [];
        this.maxHistory = 20;
        
        this.init();
    }
    
    createCanvas() {
        const container = document.createElement('div');
        container.id = 'drawingContainer';
        container.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100vw;
            height: 100vh;
            z-index: 998;
            background: white;
            display: none;
        `;
        
        const canvas = document.createElement('canvas');
        canvas.id = 'drawingCanvas';
        canvas.style.cssText = `
            display: block;
            cursor: crosshair;
            touch-action: none;
        `;
        
        const toolbar = document.createElement('div');
        toolbar.id = 'drawingToolbar';
        toolbar.style.cssText = `
            position: absolute;
            top: 10px;
            left: 10px;
            background: rgba(0,0,0,0.8);
            padding: 15px;
            border-radius: 10px;
            color: white;
            z-index: 1000;
            display: flex;
            gap: 10px;
            flex-wrap: wrap;
            max-width: 600px;
        `;
        
        container.appendChild(canvas);
        container.appendChild(toolbar);
        document.body.appendChild(container);
        
        this.canvas = canvas;
        this.container = container;
        this.toolbar = toolbar;
    }
    
    init() {
        this.resizeCanvas();
        this.setupToolbar();
        this.setupEventListeners();
        this.saveHistory();
    }
    
    resizeCanvas() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
        this.ctx.lineCap = 'round';
        this.ctx.lineJoin = 'round';
        this.ctx.fillStyle = 'white';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    }
    
    setupToolbar() {
        const tools = [
            { id: 'pen', icon: '✏️', label: 'Crayon' },
            { id: 'eraser', icon: '🧹', label: 'Gomme' },
            { id: 'line', icon: '📏', label: 'Ligne' },
            { id: 'circle', icon: '⭕', label: 'Cercle' },
            { id: 'rect', icon: '▭', label: 'Rectangle' }
        ];
        
        tools.forEach(tool => {
            const btn = document.createElement('button');
            btn.innerHTML = tool.icon;
            btn.title = tool.label;
            btn.style.cssText = `
                padding: 10px 12px;
                background: ${tool.id === 'pen' ? '#4CAF50' : '#555'};
                border: none;
                border-radius: 5px;
                color: white;
                cursor: pointer;
                font-size: 16px;
                transition: all 0.2s;
            `;
            btn.onmouseover = () => btn.style.background = '#4CAF50';
            btn.onmouseout = () => btn.style.background = tool.id === this.tool ? '#4CAF50' : '#555';
            btn.onclick = () => this.selectTool(tool.id, btn);
            this.toolbar.appendChild(btn);
        });
        
        // Séparateur
        const sep1 = document.createElement('div');
        sep1.style.cssText = 'width: 1px; background: #888; margin: 0 5px;';
        this.toolbar.appendChild(sep1);
        
        // Couleur
        const colorLabel = document.createElement('label');
        colorLabel.innerHTML = '🎨 ';
        colorLabel.style.cssText = 'display: flex; align-items: center; gap: 5px;';
        const colorInput = document.createElement('input');
        colorInput.type = 'color';
        colorInput.value = this.color;
        colorInput.style.cssText = 'width: 40px; height: 40px; border: none; border-radius: 5px; cursor: pointer;';
        colorInput.onchange = (e) => this.setColor(e.target.value);
        colorLabel.appendChild(colorInput);
        this.toolbar.appendChild(colorLabel);
        
        // Taille du pinceau
        const sizeLabel = document.createElement('label');
        sizeLabel.innerHTML = '📏 ';
        sizeLabel.style.cssText = 'display: flex; align-items: center; gap: 5px;';
        const sizeInput = document.createElement('input');
        sizeInput.type = 'range';
        sizeInput.min = '1';
        sizeInput.max = '50';
        sizeInput.value = this.brushSize;
        sizeInput.style.cssText = 'width: 80px;';
        sizeInput.onchange = (e) => this.setBrushSize(e.target.value);
        sizeLabel.appendChild(sizeInput);
        const sizeDisplay = document.createElement('span');
        sizeDisplay.textContent = this.brushSize;
        sizeDisplay.style.cssText = 'min-width: 25px;';
        sizeLabel.appendChild(sizeDisplay);
        sizeInput.onchange = (e) => {
            this.setBrushSize(e.target.value);
            sizeDisplay.textContent = e.target.value;
        };
        this.toolbar.appendChild(sizeLabel);
        
        // Séparateur
        const sep2 = document.createElement('div');
        sep2.style.cssText = 'width: 1px; background: #888; margin: 0 5px;';
        this.toolbar.appendChild(sep2);
        
        // Boutons d'action
        const undoBtn = document.createElement('button');
        undoBtn.innerHTML = '↶ Undo';
        undoBtn.style.cssText = `padding: 10px 12px; background: #FF9800; border: none; border-radius: 5px; color: white; cursor: pointer; font-size: 14px;`;
        undoBtn.onclick = () => this.undo();
        this.toolbar.appendChild(undoBtn);
        
        const clearBtn = document.createElement('button');
        clearBtn.innerHTML = '🗑️ Effacer';
        clearBtn.style.cssText = `padding: 10px 12px; background: #f44336; border: none; border-radius: 5px; color: white; cursor: pointer; font-size: 14px;`;
        clearBtn.onclick = () => this.clear();
        this.toolbar.appendChild(clearBtn);
        
        const closeBtn = document.createElement('button');
        closeBtn.innerHTML = '✕ Fermer';
        closeBtn.style.cssText = `padding: 10px 12px; background: #333; border: none; border-radius: 5px; color: white; cursor: pointer; font-size: 14px;`;
        closeBtn.onclick = () => this.hide();
        this.toolbar.appendChild(closeBtn);
    }
    
    setupEventListeners() {
        // Souris
        this.canvas.addEventListener('mousedown', (e) => this.startDrawing(e));
        this.canvas.addEventListener('mousemove', (e) => this.draw(e));
        this.canvas.addEventListener('mouseup', () => this.stopDrawing());
        this.canvas.addEventListener('mouseout', () => this.stopDrawing());
        
        // Touch
        this.canvas.addEventListener('touchstart', (e) => this.startDrawing(e.touches[0]));
        this.canvas.addEventListener('touchmove', (e) => { e.preventDefault(); this.draw(e.touches[0]); });
        this.canvas.addEventListener('touchend', () => this.stopDrawing());
    }
    
    getMousePos(e) {
        const rect = this.canvas.getBoundingClientRect();
        return {
            x: e.clientX - rect.left,
            y: e.clientY - rect.top
        };
    }
    
    startDrawing(e) {
        this.isDrawing = true;
        const pos = this.getMousePos(e);
        this.lastX = pos.x;
        this.lastY = pos.y;
        this.startX = pos.x;
        this.startY = pos.y;
        
        // Sauvegarder l'état pour les formes
        if (this.tool !== 'pen' && this.tool !== 'eraser') {
            this.tempImageData = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
        }
        
        // Sauvegarder dans l'historique
        this.saveHistory();
    }
    
    draw(e) {
        if (!this.isDrawing) return;
        
        const pos = this.getMousePos(e);
        
        if (this.tool === 'pen') {
            this.drawLine(this.lastX, this.lastY, pos.x, pos.y, this.color, this.brushSize);
            this.broadcast('draw-line', {
                x0: this.lastX, y0: this.lastY,
                x1: pos.x, y1: pos.y,
                color: this.color,
                size: this.brushSize
            });
        } else if (this.tool === 'eraser') {
            this.ctx.clearRect(pos.x - this.brushSize/2, pos.y - this.brushSize/2, this.brushSize, this.brushSize);
            this.broadcast('draw-erase', {
                x: pos.x, y: pos.y, size: this.brushSize
            });
        } else if (this.tool === 'line') {
            this.ctx.putImageData(this.tempImageData, 0, 0);
            this.drawLine(this.startX, this.startY, pos.x, pos.y, this.color, this.brushSize);
        } else if (this.tool === 'circle') {
            this.ctx.putImageData(this.tempImageData, 0, 0);
            this.drawCircle(this.startX, this.startY, pos.x, pos.y);
        } else if (this.tool === 'rect') {
            this.ctx.putImageData(this.tempImageData, 0, 0);
            this.drawRect(this.startX, this.startY, pos.x, pos.y);
        }
        
        this.lastX = pos.x;
        this.lastY = pos.y;
    }
    
    stopDrawing() {
        if (!this.isDrawing) return;
        this.isDrawing = false;
        
        // Broadcast les formes finales
        if (this.tool === 'line') {
            this.broadcast('draw-line', {
                x0: this.startX, y0: this.startY,
                x1: this.lastX, y1: this.lastY,
                color: this.color,
                size: this.brushSize
            });
        } else if (this.tool === 'circle') {
            const radius = Math.sqrt(Math.pow(this.lastX - this.startX, 2) + Math.pow(this.lastY - this.startY, 2));
            this.broadcast('draw-circle', {
                x: this.startX, y: this.startY,
                radius: radius,
                color: this.color,
                size: this.brushSize
            });
        } else if (this.tool === 'rect') {
            this.broadcast('draw-rect', {
                x: this.startX, y: this.startY,
                width: this.lastX - this.startX,
                height: this.lastY - this.startY,
                color: this.color,
                size: this.brushSize
            });
        }
    }
    
    drawLine(x0, y0, x1, y1, color, size) {
        this.ctx.strokeStyle = color;
        this.ctx.lineWidth = size;
        this.ctx.beginPath();
        this.ctx.moveTo(x0, y0);
        this.ctx.lineTo(x1, y1);
        this.ctx.stroke();
    }
    
    drawCircle(x1, y1, x2, y2) {
        this.ctx.strokeStyle = this.color;
        this.ctx.lineWidth = this.brushSize;
        const radius = Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
        this.ctx.beginPath();
        this.ctx.arc(x1, y1, radius, 0, 2 * Math.PI);
        this.ctx.stroke();
    }
    
    drawRect(x1, y1, x2, y2) {
        this.ctx.strokeStyle = this.color;
        this.ctx.lineWidth = this.brushSize;
        this.ctx.strokeRect(x1, y1, x2 - x1, y2 - y1);
    }
    
    selectTool(toolId, btnElement) {
        this.tool = toolId;
        // Update UI
        document.querySelectorAll('#drawingToolbar button').forEach((btn, idx) => {
            if (idx < 5) { // Premiers 5 boutons sont les outils
                btn.style.background = btn === btnElement ? '#4CAF50' : '#555';
            }
        });
    }
    
    setColor(color) {
        this.color = color;
    }
    
    setBrushSize(size) {
        this.brushSize = parseInt(size);
    }
    
    saveHistory() {
        const imageData = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
        this.history.push(imageData);
        if (this.history.length > this.maxHistory) {
            this.history.shift();
        }
    }
    
    undo() {
        if (this.history.length > 1) {
            this.history.pop(); // Enlever l'état actuel
            const previousState = this.history[this.history.length - 1];
            this.ctx.putImageData(previousState, 0, 0);
        }
    }
    
    clear() {
        if (confirm('Êtes-vous sûr de vouloir effacer le dessin?')) {
            this.ctx.fillStyle = 'white';
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
            this.saveHistory();
            this.broadcast('draw-clear', {});
        }
    }
    
    show() {
        this.container.style.display = 'block';
        this.resizeCanvas();
    }
    
    hide() {
        this.container.style.display = 'none';
    }
    
    broadcast(action, data) {
        if (this.socket && this.socket.connected) {
            this.socket.emit('drawing-action', { action, data });
        }
    }
    
    receiveDrawing(action, data) {
        switch(action) {
            case 'draw-line':
                this.drawLine(data.x0, data.y0, data.x1, data.y1, data.color, data.size);
                break;
            case 'draw-erase':
                this.ctx.clearRect(data.x - data.size/2, data.y - data.size/2, data.size, data.size);
                break;
            case 'draw-circle':
                this.ctx.strokeStyle = data.color;
                this.ctx.lineWidth = data.size;
                this.ctx.beginPath();
                this.ctx.arc(data.x, data.y, data.radius, 0, 2 * Math.PI);
                this.ctx.stroke();
                break;
            case 'draw-rect':
                this.ctx.strokeStyle = data.color;
                this.ctx.lineWidth = data.size;
                this.ctx.strokeRect(data.x, data.y, data.width, data.height);
                break;
            case 'draw-clear':
                this.ctx.fillStyle = 'white';
                this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
                break;
        }
    }
    
    setSocket(socket) {
        this.socket = socket;
    }
}

// Initialiser le board de dessin
let drawingBoard = null;

function initDrawingBoard(socket) {
    drawingBoard = new DrawingBoard();
    drawingBoard.setSocket(socket);
    return drawingBoard;
}

function showDrawingBoard() {
    if (!drawingBoard) {
        drawingBoard = new DrawingBoard();
    }
    drawingBoard.show();
}

function hideDrawingBoard() {
    if (drawingBoard) {
        drawingBoard.hide();
    }
}
