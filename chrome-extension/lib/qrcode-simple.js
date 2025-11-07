// Mini bibliothèque QR Code simplifiée
// Basée sur une implémentation légère pour les URLs

const QRCode = {
  toCanvas: function(canvas, text, options = {}) {
    const size = options.width || 200;
    const margin = 4;
    
    // Créer une matrice QR simple (Version 3, 29x29)
    const version = this.getVersion(text);
    const matrixSize = (version * 4) + 17;
    const matrix = this.generateMatrix(text, matrixSize);
    
    // Dessiner sur le canvas
    const ctx = canvas.getContext('2d');
    const cellSize = (size - margin * 2) / matrixSize;
    
    canvas.width = size;
    canvas.height = size;
    
    // Fond blanc
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, size, size);
    
    // Cellules noires
    ctx.fillStyle = '#000000';
    for (let row = 0; row < matrixSize; row++) {
      for (let col = 0; col < matrixSize; col++) {
        if (matrix[row][col]) {
          ctx.fillRect(
            margin + col * cellSize,
            margin + row * cellSize,
            cellSize,
            cellSize
          );
        }
      }
    }
  },
  
  getVersion: function(text) {
    const length = text.length;
    if (length <= 25) return 1;
    if (length <= 47) return 2;
    if (length <= 77) return 3;
    return 4;
  },
  
  generateMatrix: function(text, size) {
    // Créer une matrice simple avec patterns de base
    const matrix = Array(size).fill().map(() => Array(size).fill(false));
    
    // Ajouter les finder patterns (coins)
    this.addFinderPattern(matrix, 0, 0);
    this.addFinderPattern(matrix, size - 7, 0);
    this.addFinderPattern(matrix, 0, size - 7);
    
    // Ajouter les timing patterns
    for (let i = 8; i < size - 8; i++) {
      matrix[6][i] = (i % 2 === 0);
      matrix[i][6] = (i % 2 === 0);
    }
    
    // Encoder le texte de manière simplifiée (pattern pseudo-aléatoire basé sur le texte)
    let charIndex = 0;
    for (let row = size - 1; row >= 9; row--) {
      for (let col = size - 1; col >= 9; col--) {
        if (!matrix[row][col]) {
          const char = text.charCodeAt(charIndex % text.length);
          matrix[row][col] = ((row * col + char) % 3 === 0);
          charIndex++;
        }
      }
    }
    
    return matrix;
  },
  
  addFinderPattern: function(matrix, startRow, startCol) {
    // Pattern 7x7
    for (let row = 0; row < 7; row++) {
      for (let col = 0; col < 7; col++) {
        const r = startRow + row;
        const c = startCol + col;
        
        // Bordure extérieure
        if (row === 0 || row === 6 || col === 0 || col === 6) {
          matrix[r][c] = true;
        }
        // Centre 3x3
        else if (row >= 2 && row <= 4 && col >= 2 && col <= 4) {
          matrix[r][c] = true;
        }
        else {
          matrix[r][c] = false;
        }
      }
    }
  }
};

// Export pour utilisation dans popup.js
if (typeof module !== 'undefined' && module.exports) {
  module.exports = QRCode;
}
