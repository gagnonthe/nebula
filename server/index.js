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

// Créer le dossier uploads s'il n'existe pas (sécurisé)
try {
  if (!fs.existsSync(UPLOAD_DIR)) {
    fs.mkdirSync(UPLOAD_DIR, { recursive: true });
    console.log('✅ Dossier uploads/ créé:', UPLOAD_DIR);
  } else {
    console.log('✅ Dossier uploads/ existe déjà:', UPLOAD_DIR);
  }
} catch (err) {
  console.error('❌ ERREUR création dossier uploads:', err);
  process.exit(1); // Arrêter le serveur si on ne peut pas créer le dossier
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
const texts = new Map(); // { id, title, content, size, uploadedAt, uploadedBy }
const links = new Map(); // { id, title, url, uploadedAt, uploadedBy }
const deviceSessions = new Map();
const shareLinks = new Map();

// Stats tracking
let totalUploads = 0;

// Routes API
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Server is running' });
});

// =============================
// Text & Link resources
// =============================

// Create a text note
app.post('/api/text', (req, res) => {
  try {
    const { content, title, deviceId } = req.body || {};
    if (!content || typeof content !== 'string' || content.trim().length === 0) {
      return res.status(400).json({ error: 'Content is required' });
    }

    const id = uuidv4();
    const now = new Date();
    const size = Buffer.byteLength(content, 'utf8');
    const note = {
      id,
      title: (title && title.trim()) || content.trim().split('\n')[0].slice(0, 80),
      content,
      size,
      mimetype: 'text/plain',
      uploadedAt: now,
      uploadedBy: deviceId || 'anonymous'
    };

    texts.set(id, note);
    io.emit('text-added', { id, title: note.title, size: note.size, uploadedAt: note.uploadedAt });
    return res.json({ success: true, id });
  } catch (err) {
    console.error('Create text error:', err);
    return res.status(500).json({ error: 'Failed to create text' });
  }
});

// List texts
app.get('/api/texts', (req, res) => {
  const list = Array.from(texts.values()).sort((a, b) => new Date(b.uploadedAt) - new Date(a.uploadedAt));
  res.json({ texts: list });
});

// Delete text
app.delete('/api/texts/:id', (req, res) => {
  const { id } = req.params;
  if (!texts.has(id)) return res.status(404).json({ error: 'Text not found' });
  texts.delete(id);
  io.emit('text-deleted', { id });
  res.json({ success: true });
});

// Create a link
app.post('/api/link', (req, res) => {
  try {
    const { url, title, deviceId } = req.body || {};
    try {
      new URL(url);
    } catch {
      return res.status(400).json({ error: 'Valid URL is required' });
    }

    const id = uuidv4();
    const now = new Date();
    const hostname = new URL(url).hostname;
    const link = {
      id,
      title: (title && title.trim()) || hostname,
      url,
      uploadedAt: now,
      uploadedBy: deviceId || 'anonymous'
    };

    links.set(id, link);
    io.emit('link-added', { id, title: link.title, url: link.url, uploadedAt: link.uploadedAt });
    return res.json({ success: true, id });
  } catch (err) {
    console.error('Create link error:', err);
    return res.status(500).json({ error: 'Failed to create link' });
  }
});

// List links
app.get('/api/links', (req, res) => {
  const list = Array.from(links.values()).sort((a, b) => new Date(b.uploadedAt) - new Date(a.uploadedAt));
  res.json({ links: list });
});

// Delete link
app.delete('/api/links/:id', (req, res) => {
  const { id } = req.params;
  if (!links.has(id)) return res.status(404).json({ error: 'Link not found' });
  links.delete(id);
  io.emit('link-deleted', { id });
  res.json({ success: true });
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

// Générer un code d'accès aléatoire (4 chiffres)
function generateAccessCode() {
  return Math.floor(1000 + Math.random() * 9000).toString();
}

// Upload de fichier(s) avec support ZIP pour dossiers
app.post('/api/upload', upload.array('files', 500), async (req, res) => {
  console.log('📥 [UPLOAD] Requête reçue');
  console.log('📥 [UPLOAD] Headers:', JSON.stringify(req.headers, null, 2));
  console.log('📥 [UPLOAD] Body keys:', Object.keys(req.body));
  console.log('📥 [UPLOAD] Files:', req.files ? req.files.length : 0);
  
  try {
    const uploadedFiles = req.files;
    
    if (!uploadedFiles || uploadedFiles.length === 0) {
      console.log('❌ [UPLOAD] Aucun fichier reçu');
      return res.status(400).json({ error: 'No files uploaded' });
    }
    
    console.log('✅ [UPLOAD] Fichiers reçus:', uploadedFiles.map(f => ({ name: f.originalname, size: f.size })));

    const { deviceId, targetDevice, folderName, isFolder, isPrivate, accessCode } = req.body;
    
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
          originalFileCount: uploadedFiles.length,
          isPrivate: isPrivate === 'true',
          accessCode: isPrivate === 'true' ? (accessCode || generateAccessCode()) : null
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
      
      // Récupérer les chemins relatifs depuis le JSON
      const relativePaths = req.body.relativePaths ? JSON.parse(req.body.relativePaths) : [];
      
      // Ajouter chaque fichier au ZIP avec son chemin relatif
      uploadedFiles.forEach((file, index) => {
        const relativePath = relativePaths[index] || file.originalname;
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
        path: file.path,
        isPrivate: isPrivate === 'true',
        accessCode: isPrivate === 'true' ? (accessCode || generateAccessCode()) : null
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
    console.error('❌ [UPLOAD] Erreur serveur:', error);
    console.error('❌ [UPLOAD] Stack:', error.stack);
    res.status(500).json({ 
      error: 'Upload failed', 
      message: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// Route alternative pour upload SINGLE file (pour raccourcis iOS qui envoient 'file' au singulier)
// Utilise upload.any() pour accepter n'importe quel nom de champ
app.post('/api/upload-single', upload.any(), async (req, res) => {
  console.log('📥 [UPLOAD-SINGLE] Requête reçue');
  console.log('📥 [UPLOAD-SINGLE] Headers:', JSON.stringify(req.headers, null, 2));
  console.log('📥 [UPLOAD-SINGLE] Body keys:', Object.keys(req.body));
  console.log('📥 [UPLOAD-SINGLE] req.files (DIAGNOSTIC):', req.files);
  console.log('📥 [UPLOAD-SINGLE] req.files détails:', req.files ? req.files.map(f => ({ fieldname: f.fieldname, originalname: f.originalname, size: f.size })) : 'Aucun');
  
  try {
    // Avec upload.any(), les fichiers sont dans req.files (array)
    const uploadedFile = req.files && req.files.length > 0 ? req.files[0] : null;
    
    if (!uploadedFile) {
      console.log('❌ [UPLOAD-SINGLE] Aucun fichier reçu');
      console.log('❌ [UPLOAD-SINGLE] req.files:', req.files);
      console.log('❌ [UPLOAD-SINGLE] req.body:', req.body);
      return res.status(400).json({ 
        error: 'No file uploaded',
        hint: 'Aucun fichier détecté. Vérifiez que le formulaire contient bien un fichier.',
        receivedFiles: req.files ? req.files.length : 0
      });
    }
    
    console.log('✅ [UPLOAD-SINGLE] Fichier reçu via champ:', uploadedFile.fieldname);
    console.log('✅ [UPLOAD-SINGLE] Nom du fichier:', uploadedFile.originalname, uploadedFile.size, 'bytes');
    
    const { deviceId, targetDevice, isPrivate, accessCode } = req.body;
    const fileId = uuidv4();
    
    totalUploads++;
    
    const fileData = {
      id: fileId,
      filename: uploadedFile.originalname,
      storedName: uploadedFile.filename,
      size: uploadedFile.size,
      mimetype: uploadedFile.mimetype,
      uploadedBy: deviceId || 'ios-shortcut',
      targetDevice: targetDevice || 'all',
      uploadedAt: new Date(),
      path: uploadedFile.path,
      isPrivate: isPrivate === 'true',
      accessCode: isPrivate === 'true' ? (accessCode || generateAccessCode()) : null
    };

    files.set(fileId, fileData);
    
    console.log('✅ [UPLOAD-SINGLE] Fichier enregistré:', fileId);

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
      downloadUrl: `/api/download/${fileId}`,
      accessCode: fileData.accessCode || null
    });
  } catch (error) {
    console.error('❌ [UPLOAD-SINGLE] Erreur serveur:', error);
    console.error('❌ [UPLOAD-SINGLE] Stack:', error.stack);
    res.status(500).json({ 
      error: 'Upload failed', 
      message: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// ==================== ROUTE POUR UPLOAD iOS ====================
// Middleware de diagnostic pour capturer les données brutes AVANT Multer
app.post('/api/upload-ios', (req, res, next) => {
  console.log('📱 [iOS-UPLOAD] ===== DIAGNOSTIC COMPLET =====');
  console.log('📱 [iOS-UPLOAD] Content-Type:', req.get('content-type'));
  console.log('📱 [iOS-UPLOAD] Content-Length:', req.get('content-length'));
  console.log('📱 [iOS-UPLOAD] Tous les headers:', JSON.stringify(req.headers, null, 2));
  console.log('📱 [iOS-UPLOAD] URL:', req.url);
  console.log('📱 [iOS-UPLOAD] Method:', req.method);
  
  // Capturer les données brutes pour debug
  let rawData = '';
  req.on('data', chunk => {
    rawData += chunk.toString().slice(0, 500); // Limiter à 500 chars
  });
  
  req.on('end', () => {
    if (rawData) {
      console.log('📱 [iOS-UPLOAD] Données brutes reçues (premiers 500 chars):', rawData);
    }
  });
  
  // Appeler le middleware Multer
  next();
}, 
// Multer avec upload.any() pour maximum de flexibilité
upload.any(),
async (req, res) => {
  console.log('📱 [iOS-UPLOAD] Après Multer:');
  console.log('📱 [iOS-UPLOAD] req.files:', req.files);
  if (req.files && req.files.length > 0) {
    console.log('📱 [iOS-UPLOAD] Détails fichiers:', req.files.map(f => ({
      fieldname: f.fieldname,
      originalname: f.originalname,
      encoding: f.encoding,
      mimetype: f.mimetype,
      size: f.size,
      destination: f.destination,
      filename: f.filename
    })));
  }
  console.log('📱 [iOS-UPLOAD] req.body:', req.body);
  
  try {
    const uploadedFile = req.files && req.files.length > 0 ? req.files[0] : null;
    
    if (!uploadedFile) {
      console.log('❌ [iOS-UPLOAD] ERREUR: Aucun fichier reçu');
      return res.status(400).json({ 
        error: 'No file uploaded',
        debug: {
          filesReceived: req.files ? req.files.length : 0,
          bodyKeys: Object.keys(req.body),
          contentType: req.get('content-type')
        }
      });
    }
    
    console.log('✅ [iOS-UPLOAD] Fichier détecté:', uploadedFile.originalname);
    
    const { deviceId, targetDevice, isPrivate, accessCode } = req.body;
    const fileId = uuidv4();
    
    totalUploads++;
    
    const fileData = {
      id: fileId,
      filename: uploadedFile.originalname,
      storedName: uploadedFile.filename,
      size: uploadedFile.size,
      mimetype: uploadedFile.mimetype,
      uploadedBy: deviceId || 'ios-shortcut',
      targetDevice: targetDevice || 'all',
      uploadedAt: new Date(),
      path: uploadedFile.path,
      isPrivate: isPrivate === 'true',
      accessCode: isPrivate === 'true' ? (accessCode || generateAccessCode()) : null
    };

    files.set(fileId, fileData);
    
    console.log('✅ [iOS-UPLOAD] Fichier enregistré:', fileId);

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
      downloadUrl: `/api/download/${fileId}`,
      accessCode: fileData.accessCode || null,
      debug: {
        uploadedViaField: uploadedFile.fieldname,
        message: 'File uploaded successfully via iOS shortcut'
      }
    });
  } catch (error) {
    console.error('❌ [iOS-UPLOAD] Erreur serveur:', error);
    console.error('❌ [iOS-UPLOAD] Stack:', error.stack);
    res.status(500).json({ 
      error: 'Upload failed', 
      message: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// Gestionnaire d'erreur Multer global (doit être APRÈS toutes les routes)
app.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    console.error('❌ [MULTER] Erreur Multer:', err.code, err.message);
    console.error('❌ [MULTER] Champ problématique:', err.field);
    console.error('❌ [MULTER] URL:', req.url);
    console.error('❌ [MULTER] Headers:', JSON.stringify(req.headers, null, 2));
    
    // Si c'est une erreur de champ inattendu, proposer les solutions
    if (err.code === 'LIMIT_UNEXPECTED_FILE' || err.code === 'LIMIT_UNEXPECTED_FILES') {
      return res.status(400).json({ 
        error: 'Unexpected file field',
        code: err.code,
        message: `Le serveur n'attendait pas de fichier avec le champ "${err.field}". Essaie avec:`,
        solutions: [
          'Route alternative: POST /api/upload-ios (plus flexible)',
          'Ou change le nom du champ dans ton Raccourci iOS pour qu\'il s\'appelle "files" (pluriel)'
        ],
        receivedField: err.field
      });
    }
    
    return res.status(400).json({ 
      error: 'Multer error',
      code: err.code,
      message: err.message,
      hint: err.field ? `Champ problématique: ${err.field}` : 'Vérifiez le nom du champ'
    });
  } else if (err) {
    console.error('❌ [ERROR] Erreur middleware:', err);
    return res.status(500).json({ 
      error: 'Server error',
      message: err.message
    });
  }
  next();
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
  const { code } = req.query;
  const file = files.get(fileId);

  if (!file) {
    return res.status(404).json({ error: 'File not found' });
  }

  // Vérifier si le fichier est privé et demander le code
  if (file.isPrivate && file.accessCode) {
    if (!code || code !== file.accessCode) {
      return res.status(403).json({ error: 'Access code required', requiresCode: true });
    }
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

  socket.on('admin-command', (payload = {}, ack) => {
    const { targetDeviceId, command } = payload || {};

    if (!command || !command.action) {
      if (typeof ack === 'function') {
        ack({ ok: false, error: 'Commande invalide' });
      }
      return;
    }

    if (!targetDeviceId || targetDeviceId === 'all') {
      io.emit('device-command', { command, from: 'admin' });
      if (typeof ack === 'function') {
        ack({ ok: true, deliveredTo: 'all' });
      }
      return;
    }

    const target = deviceSessions.get(targetDeviceId);
    if (target && target.socketId) {
      io.to(target.socketId).emit('device-command', { command, from: 'admin' });
      if (typeof ack === 'function') {
        ack({ ok: true, deliveredTo: targetDeviceId });
      }
      return;
    }

    if (typeof ack === 'function') {
      ack({ ok: false, error: 'Appareil non connecté' });
    }
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

  // Get all files for admin
  app.get('/api/admin/files', (req, res) => {
    const filesList = [];
    files.forEach((file, fileId) => {
      filesList.push({
        id: fileId,
        name: file.filename,
        size: file.size,
        uploadDate: file.uploadedAt,
        deviceId: file.uploadedBy
      });
    });
    res.json({
      files: filesList.sort((a, b) => new Date(b.uploadDate) - new Date(a.uploadDate))
    });
  });

  // Get all texts for admin
  app.get('/api/admin/texts', (req, res) => {
    const textsList = [];
    texts.forEach((text, textId) => {
      textsList.push({
        id: textId,
        title: text.title,
        content: text.content,
        createdAt: text.createdAt
      });
    });
    res.json({
      texts: textsList.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    });
  });

  // Get all links for admin
  app.get('/api/admin/links', (req, res) => {
    const linksList = [];
    links.forEach((link, linkId) => {
      linksList.push({
        id: linkId,
        title: link.title,
        url: link.url,
        createdAt: link.createdAt
      });
    });
    res.json({
      links: linksList.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    });
  });

  // Delete all texts
  app.post('/api/admin/cleanup/texts', (req, res) => {
    const deleted = texts.size;
    texts.clear();
    io.emit('all-texts-deleted');
    res.json({ deleted });
  });

  // Delete all links
  app.post('/api/admin/cleanup/links', (req, res) => {
    const deleted = links.size;
    links.clear();
    io.emit('all-links-deleted');
    res.json({ deleted });
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
      type: 'file',
      fileId,
      createdAt: Date.now(),
      expiresAt,
      downloads: 0
    });
  
    res.json({ shareId });
  });

  // Generate share link for text
  app.post('/api/share-text/:textId', (req, res) => {
    const { textId } = req.params;
    const { expiration } = req.body;
    const note = texts.get(textId);
    if (!note) return res.status(404).json({ error: 'Text not found' });

    const shareId = uuidv4().substring(0, 8);
    let expiresAt = null;
    if (expiration && expiration !== 'never') {
      const hours = parseInt(expiration);
      expiresAt = Date.now() + (hours * 60 * 60 * 1000);
    }
    shareLinks.set(shareId, { type: 'text', textId, createdAt: Date.now(), expiresAt, downloads: 0 });
    res.json({ shareId });
  });

  // Generate share link for link
  app.post('/api/share-link/:linkId', (req, res) => {
    const { linkId } = req.params;
    const { expiration } = req.body;
    const link = links.get(linkId);
    if (!link) return res.status(404).json({ error: 'Link not found' });

    const shareId = uuidv4().substring(0, 8);
    let expiresAt = null;
    if (expiration && expiration !== 'never') {
      const hours = parseInt(expiration);
      expiresAt = Date.now() + (hours * 60 * 60 * 1000);
    }
    shareLinks.set(shareId, { type: 'link', linkId, createdAt: Date.now(), expiresAt, downloads: 0 });
    res.json({ shareId });
  });

  // Access shared file - Preview page
  app.get('/share/:shareId', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/share.html'));
  });

  // Get share info
  app.get('/api/share/:shareId/info', (req, res) => {
    const { shareId } = req.params;
    const shareLink = shareLinks.get(shareId);
  
    if (!shareLink) {
      return res.status(404).json({ error: 'Lien de partage introuvable ou expiré' });
    }
  
    if (shareLink.expiresAt && Date.now() > shareLink.expiresAt) {
      shareLinks.delete(shareId);
      return res.status(410).json({ error: 'Ce lien de partage a expiré' });
    }
    
    // Backwards compatibility: old entries without type are files
    const type = shareLink.type || 'file';
    if (type === 'file') {
      const file = files.get(shareLink.fileId);
      if (!file) {
        shareLinks.delete(shareId);
        return res.status(404).json({ error: 'Fichier introuvable' });
      }
      return res.json({
        resourceType: 'file',
        filename: file.filename,
        size: file.size,
        uploadedAt: file.uploadedAt,
        downloads: shareLink.downloads,
        expiresAt: shareLink.expiresAt,
        mimeType: file.mimetype
      });
    }

    if (type === 'text') {
      const note = texts.get(shareLink.textId);
      if (!note) {
        shareLinks.delete(shareId);
        return res.status(404).json({ error: 'Texte introuvable' });
      }
      return res.json({
        resourceType: 'text',
        title: note.title,
        content: note.content,
        size: note.size,
        uploadedAt: note.uploadedAt,
        downloads: shareLink.downloads,
        expiresAt: shareLink.expiresAt,
        mimeType: 'text/plain'
      });
    }

    if (type === 'link') {
      const l = links.get(shareLink.linkId);
      if (!l) {
        shareLinks.delete(shareId);
        return res.status(404).json({ error: 'Lien introuvable' });
      }
      return res.json({
        resourceType: 'link',
        title: l.title,
        url: l.url,
        uploadedAt: l.uploadedAt,
        downloads: shareLink.downloads,
        expiresAt: shareLink.expiresAt
      });
    }

    return res.status(400).json({ error: 'Type de ressource invalide' });
  });

  // Download shared resource
  app.get('/api/share/:shareId/download', (req, res) => {
    const { shareId } = req.params;
    const shareLink = shareLinks.get(shareId);
  
    if (!shareLink) {
      return res.status(404).send('Lien de partage introuvable ou expiré');
    }
  
    if (shareLink.expiresAt && Date.now() > shareLink.expiresAt) {
      shareLinks.delete(shareId);
      return res.status(410).send('Ce lien de partage a expiré');
    }
    
    // Backwards compatibility
    const type = shareLink.type || 'file';
    if (type === 'file') {
      const file = files.get(shareLink.fileId);
      if (!file) {
        shareLinks.delete(shareId);
        return res.status(404).send('Fichier introuvable');
      }
      shareLink.downloads++;
      return res.download(file.path, file.filename, (err) => {
        if (err) {
          console.error('Error downloading file:', err);
        }
      });
    }

    if (type === 'text') {
      const note = texts.get(shareLink.textId);
      if (!note) {
        shareLinks.delete(shareId);
        return res.status(404).send('Texte introuvable');
      }
      shareLink.downloads++;
      res.setHeader('Content-Type', 'text/plain; charset=utf-8');
      res.setHeader('Content-Disposition', 'attachment; filename="note.txt"');
      return res.send(note.content);
    }

    if (type === 'link') {
      const l = links.get(shareLink.linkId);
      if (!l) {
        shareLinks.delete(shareId);
        return res.status(404).send('Lien introuvable');
      }
      // Provide a small text file with the URL
      shareLink.downloads++;
      res.setHeader('Content-Type', 'text/plain; charset=utf-8');
      res.setHeader('Content-Disposition', 'attachment; filename="link.txt"');
      return res.send(`URL: ${l.url}\n`);
    }

    return res.status(400).send('Type de ressource invalide');
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
