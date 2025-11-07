const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
require('dotenv').config();

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: process.env.ALLOWED_ORIGINS || '*',
    methods: ['GET', 'POST']
  }
});

const PORT = process.env.PORT || 3000;
const UPLOAD_DIR = path.join(__dirname, '../uploads');

// Créer le dossier uploads s'il n'existe pas
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

// Configuration de stockage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, UPLOAD_DIR);
  },
  filename: (req, file, cb) => {
    const uniqueName = `${uuidv4()}-${file.originalname}`;
    cb(null, uniqueName);
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE) || 104857600 // 100MB par défaut (au lieu de 10MB)
  }
});

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../public')));

// Base de données en mémoire (à remplacer par une vraie DB en production)
const files = new Map();
const deviceSessions = new Map();

// Routes API
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Server is running' });
});

// Enregistrer un appareil
app.post('/api/device/register', (req, res) => {
  const { deviceId, deviceName, deviceType } = req.body;
  
  if (!deviceId) {
    return res.status(400).json({ error: 'Device ID required' });
  }

  deviceSessions.set(deviceId, {
    deviceId,
    deviceName: deviceName || 'Unknown Device',
    deviceType: deviceType || 'unknown',
    lastSeen: new Date()
  });

  res.json({ 
    success: true, 
    deviceId,
    message: 'Device registered successfully' 
  });
});

// Upload de fichier
app.post('/api/upload', upload.single('file'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const { deviceId, targetDevice } = req.body;
    const fileId = uuidv4();
    
    const fileData = {
      id: fileId,
      filename: req.file.originalname,
      storedName: req.file.filename,
      size: req.file.size,
      mimetype: req.file.mimetype,
      uploadedBy: deviceId || 'anonymous',
      targetDevice: targetDevice || 'all',
      uploadedAt: new Date(),
      path: req.file.path
    };

    files.set(fileId, fileData);

    // Notifier via WebSocket
    io.emit('file-uploaded', {
      fileId,
      filename: fileData.filename,
      size: fileData.size,
      uploadedBy: fileData.uploadedBy,
      targetDevice: fileData.targetDevice
    });

    res.json({
      success: true,
      fileId,
      filename: fileData.filename,
      downloadUrl: `/api/download/${fileId}`
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: 'Upload failed' });
  }
});

// Liste des fichiers
app.get('/api/files', (req, res) => {
  const { deviceId } = req.query;
  
  let fileList = Array.from(files.values());
  
  // Filtrer par appareil cible si spécifié
  if (deviceId) {
    fileList = fileList.filter(f => 
      f.targetDevice === 'all' || 
      f.targetDevice === deviceId ||
      f.uploadedBy === deviceId
    );
  }

  res.json({
    files: fileList.map(f => ({
      id: f.id,
      filename: f.filename,
      size: f.size,
      mimetype: f.mimetype,
      uploadedAt: f.uploadedAt,
      uploadedBy: f.uploadedBy
    }))
  });
});

// Télécharger un fichier
app.get('/api/download/:fileId', (req, res) => {
  const { fileId } = req.params;
  const file = files.get(fileId);

  if (!file) {
    return res.status(404).json({ error: 'File not found' });
  }

  if (!fs.existsSync(file.path)) {
    return res.status(404).json({ error: 'File not found on disk' });
  }

  res.download(file.path, file.filename);
});

// Supprimer un fichier
app.delete('/api/files/:fileId', (req, res) => {
  const { fileId } = req.params;
  const file = files.get(fileId);

  if (!file) {
    return res.status(404).json({ error: 'File not found' });
  }

  // Supprimer le fichier du disque
  if (fs.existsSync(file.path)) {
    fs.unlinkSync(file.path);
  }

  files.delete(fileId);

  // Notifier via WebSocket
  io.emit('file-deleted', { fileId });

  res.json({ success: true, message: 'File deleted' });
});

// Liste des appareils connectés
app.get('/api/devices', (req, res) => {
  const deviceList = Array.from(deviceSessions.values());
  res.json({ devices: deviceList });
});

// WebSocket connection
io.on('connection', (socket) => {
  console.log('New client connected:', socket.id);

  socket.on('register-device', (data) => {
    const { deviceId, deviceName, deviceType } = data;
    socket.deviceId = deviceId;
    
    deviceSessions.set(deviceId, {
      deviceId,
      deviceName,
      deviceType,
      socketId: socket.id,
      lastSeen: new Date()
    });

    io.emit('device-connected', { deviceId, deviceName, deviceType });
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
    
    if (socket.deviceId) {
      deviceSessions.delete(socket.deviceId);
      io.emit('device-disconnected', { deviceId: socket.deviceId });
    }
  });
});

// Nettoyer les vieux fichiers toutes les heures
setInterval(() => {
  const now = new Date();
  const ONE_HOUR = 60 * 60 * 1000;

  files.forEach((file, fileId) => {
    if (now - file.uploadedAt > ONE_HOUR) {
      if (fs.existsSync(file.path)) {
        fs.unlinkSync(file.path);
      }
      files.delete(fileId);
      io.emit('file-deleted', { fileId });
    }
  });
}, 60 * 60 * 1000);

server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📁 Upload directory: ${UPLOAD_DIR}`);
});
