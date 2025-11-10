const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const archiver = require('archiver');
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
    fileSize: parseInt(process.env.MAX_FILE_SIZE) || 1073741824 // 1GB par défaut
  }
});

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../public')));

// Base de données en mémoire (à remplacer par une vraie DB en production)
const files = new Map();
const deviceSessions = new Map();
const shareLinks = new Map();

// Stats tracking
let totalUploads = 0;

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

// Upload de fichier(s) avec support ZIP pour dossiers
app.post('/api/upload', upload.array('files', 500), async (req, res) => {
  try {
    const uploadedFiles = req.files;
    
    if (!uploadedFiles || uploadedFiles.length === 0) {
      return res.status(400).json({ error: 'No files uploaded' });
    }

    const { deviceId, targetDevice, folderName, isFolder } = req.body;
    
    totalUploads++;
    
    // Si c'est un dossier, créer un ZIP
    if (isFolder === 'true' && uploadedFiles.length > 1) {
      const zipFileName = `${folderName || 'folder'}_${Date.now()}.zip`;
      const zipFilePath = path.join(UPLOAD_DIR, zipFileName);
      const fileId = uuidv4();
      
      // Créer l'archive ZIP
      const output = fs.createWriteStream(zipFilePath);
      const archive = archiver('zip', { zlib: { level: 9 } });
      
      output.on('close', () => {
        console.log(`ZIP créé: ${archive.pointer()} bytes`);
        
        // Sauvegarder les métadonnées du ZIP
        const fileData = {
          id: fileId,
          filename: zipFileName,
          storedName: zipFileName,
          size: archive.pointer(),
          mimetype: 'application/zip',
          uploadedBy: deviceId || 'anonymous',
          targetDevice: targetDevice || 'all',
          uploadedAt: new Date(),
          path: zipFilePath,
          isZip: true,
          originalFileCount: uploadedFiles.length
        };
        
        files.set(fileId, fileData);
        
        // Supprimer les fichiers individuels temporaires
        uploadedFiles.forEach(file => {
          fs.unlink(file.path, err => {
            if (err) console.error('Erreur suppression fichier temp:', err);
          });
        });
        
        // Notifier via WebSocket
        io.emit('file-uploaded', {
          fileId,
          filename: fileData.filename,
          size: fileData.size,
          uploadedBy: fileData.uploadedBy,
          targetDevice: fileData.targetDevice,
          isZip: true
        });
        
        res.json({
          success: true,
          fileId,
          filename: fileData.filename,
          downloadUrl: `/api/download/${fileId}`,
          isZip: true,
          fileCount: uploadedFiles.length
        });
      });
      
      archive.on('error', (err) => {
        console.error('Erreur création ZIP:', err);
        res.status(500).json({ error: 'ZIP creation failed' });
      });
      
      archive.pipe(output);
      
      // Ajouter chaque fichier au ZIP avec son chemin relatif
      uploadedFiles.forEach(file => {
        const relativePath = req.body[`relativePath_${file.originalname}`] || file.originalname;
        archive.file(file.path, { name: relativePath });
      });
      
      await archive.finalize();
      
    } else {
      // Upload fichier(s) individuel(s) sans ZIP
      const fileId = uuidv4();
      const file = uploadedFiles[0];
      
      const fileData = {
        id: fileId,
        filename: file.originalname,
        storedName: file.filename,
        size: file.size,
        mimetype: file.mimetype,
        uploadedBy: deviceId || 'anonymous',
        targetDevice: targetDevice || 'all',
        uploadedAt: new Date(),
        path: file.path
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
    }
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

  // Admin API endpoints
  app.get('/api/admin/stats', (req, res) => {
    let totalSize = 0;
    const filesList = [];
  
    files.forEach((file, fileId) => {
      totalSize += file.size;
      filesList.push({
        id: fileId,
        name: file.filename,
        size: file.size,
        uploadDate: file.uploadedAt,
        deviceId: file.uploadedBy
      });
    });
  
    const devicesList = [];
    deviceSessions.forEach((device, deviceId) => {
      devicesList.push({
        id: deviceId,
        name: device.deviceName,
        type: device.deviceType,
        lastSeen: device.lastSeen
      });
    });
  
    res.json({
      totalFiles: files.size,
      totalSize: totalSize,
      totalDevices: deviceSessions.size,
      totalUploads: totalUploads,
      files: filesList.sort((a, b) => new Date(b.uploadDate) - new Date(a.uploadDate)),
      devices: devicesList
    });
  });

  // Delete old files (7+ days)
  app.post('/api/admin/cleanup/old', (req, res) => {
    const now = Date.now();
    const SEVEN_DAYS = 7 * 24 * 60 * 60 * 1000;
    let deleted = 0;
  
    files.forEach((file, fileId) => {
      if (now - new Date(file.uploadedAt).getTime() > SEVEN_DAYS) {
        try {
          if (fs.existsSync(file.path)) {
            fs.unlinkSync(file.path);
          }
          files.delete(fileId);
          io.emit('file-deleted', { fileId });
          deleted++;
        } catch (error) {
          console.error('Error deleting file:', error);
        }
      }
    });
  
    res.json({ deleted });
  });

  // Delete all files
  app.post('/api/admin/cleanup/all', (req, res) => {
    let deleted = 0;
  
    files.forEach((file, fileId) => {
      try {
        if (fs.existsSync(file.path)) {
          fs.unlinkSync(file.path);
        }
        files.delete(fileId);
        deleted++;
      } catch (error) {
        console.error('Error deleting file:', error);
      }
    });
  
    io.emit('all-files-deleted');
    res.json({ deleted });
  });

  // Generate share link
  app.post('/api/share/:fileId', (req, res) => {
    const { fileId } = req.params;
    const { expiration } = req.body;
  
    const file = files.get(fileId);
    if (!file) {
      return res.status(404).json({ error: 'File not found' });
    }
  
    const shareId = uuidv4().substring(0, 8);
    let expiresAt = null;
  
    if (expiration && expiration !== 'never') {
      const hours = parseInt(expiration);
      expiresAt = Date.now() + (hours * 60 * 60 * 1000);
    }
  
    shareLinks.set(shareId, {
      fileId,
      createdAt: Date.now(),
      expiresAt,
      downloads: 0
    });
  
    res.json({ shareId });
  });

  // Access shared file
  app.get('/share/:shareId', (req, res) => {
    const { shareId } = req.params;
    const shareLink = shareLinks.get(shareId);
  
    if (!shareLink) {
      return res.status(404).send('Lien de partage introuvable ou expiré');
    }
  
    if (shareLink.expiresAt && Date.now() > shareLink.expiresAt) {
      shareLinks.delete(shareId);
      return res.status(410).send('Ce lien de partage a expiré');
    }
  
    const file = files.get(shareLink.fileId);
    if (!file) {
      shareLinks.delete(shareId);
      return res.status(404).send('Fichier introuvable');
    }
  
    shareLink.downloads++;
  
    res.download(file.path, file.filename, (err) => {
      if (err) {
        console.error('Error downloading file:', err);
      }
    });
  });

  // Cleanup expired share links (every hour)
  setInterval(() => {
    const now = Date.now();
    shareLinks.forEach((link, shareId) => {
      if (link.expiresAt && now > link.expiresAt) {
        shareLinks.delete(shareId);
      }
    });
  }, 60 * 60 * 1000);

server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📁 Upload directory: ${UPLOAD_DIR}`);
});
