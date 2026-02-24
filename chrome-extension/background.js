// Service worker pour l'extension Chrome
// Charger Socket.IO une seule fois au début
importScripts('lib/socket.io.min.js');

// Event handlers pour le service worker (requis au début du script)
self.addEventListener('beforeunload', () => {
  console.log('Service worker unloading');
});

self.addEventListener('offline', () => {
  console.log('Network offline');
});

let socket = null;
let reconnectAttempts = 0;
const MAX_RECONNECT_ATTEMPTS = 5;

chrome.runtime.onInstalled.addListener(() => {
  console.log('Extension Nebula installée');
  
  // Définir l'URL par défaut du serveur
  chrome.storage.sync.get(['serverUrl', 'deviceId'], (result) => {
    if (!result.serverUrl) {
      chrome.storage.sync.set({ 
        serverUrl: 'https://nebula-a50x.onrender.com'
      });
    }
    
    // Se connecter au serveur Socket.IO
    if (result.serverUrl) {
      connectToServer(result.serverUrl, result.deviceId);
    }
  });
  
  // Créer les menus contextuels
  createContextMenus();
});

// Se connecter au serveur Socket.IO pour recevoir les notifications en temps réel
function connectToServer(serverUrl, deviceId) {
  if (socket) {
    socket.disconnect();
  }
  
  try {
    socket = io(serverUrl, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: MAX_RECONNECT_ATTEMPTS,
      reconnectionDelay: 1000,
      // Désactiver les fonctionnalités qui utilisent beforeunload/offline
      autoUnref: false,
      closeOnBeforeunload: false
    });
    
    socket.on('connect', () => {
      console.log('Connecté au serveur Nebula');
      reconnectAttempts = 0;
      
      // S'enregistrer comme appareil
      if (deviceId) {
        socket.emit('register-device', {
          deviceId: deviceId,
          deviceName: 'Chrome Extension',
          deviceType: 'desktop'
        });
      }
    });
    
    socket.on('disconnect', () => {
      console.log('Déconnecté du serveur Nebula');
    });
    
    // Écouter les nouveaux fichiers uploadés
    socket.on('file-uploaded', (data) => {
      console.log('Nouveau fichier reçu:', data);
      
      // Ne pas notifier si c'est nous qui avons uploadé
      if (data.uploadedBy !== deviceId) {
        chrome.notifications.create({
          type: 'basic',
          iconUrl: chrome.runtime.getURL('icons/icon48.png'),
          title: 'Nebula - Nouveau fichier',
          message: `📄 ${data.filename}\n${formatFileSize(data.size)}`
        }).catch(err => console.log('Notification error:', err));
      }
    });
    
    socket.on('connect_error', (error) => {
      console.error('Erreur de connexion:', error);
      reconnectAttempts++;
      
      if (reconnectAttempts >= MAX_RECONNECT_ATTEMPTS) {
        console.log('Nombre maximum de tentatives de reconnexion atteint');
      }
    });
    
  } catch (error) {
    console.error('Erreur lors de la connexion Socket.IO:', error);
  }
}

// Formater la taille du fichier
function formatFileSize(bytes) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}

// Gérer les notifications
chrome.notifications.onClicked.addListener((notificationId) => {
  // Ouvrir le popup quand on clique sur la notification
  chrome.action.openPopup();
});

// Uploader un PDF depuis son URL (fichier local ou distant)
async function uploadPDFFromURL(pdfUrl, filename) {
  try {
    console.log('[Nebula BG] Upload PDF depuis:', pdfUrl);
    
    // Récupérer la configuration
    const config = await chrome.storage.sync.get(['serverUrl', 'deviceId']);
    const serverUrl = config.serverUrl || 'https://nebula-a50x.onrender.com';
    const deviceId = config.deviceId;
    
    if (!serverUrl || !deviceId) {
      throw new Error('Extension non configurée');
    }
    
    // Télécharger le PDF (fonctionne pour file:// et http(s):// dans le background)
    const response = await fetch(pdfUrl);
    if (!response.ok) {
      throw new Error('Impossible de lire le fichier PDF');
    }
    
    const blob = await response.blob();
    const file = new File([blob], filename, { type: 'application/pdf' });
    
    console.log('[Nebula BG] Fichier prêt:', filename, formatFileSize(blob.size));
    
    // Créer le FormData
    const formData = new FormData();
    formData.append('files', file);
    formData.append('deviceId', deviceId);
    formData.append('targetDevice', 'all');
    
    // Envoyer au serveur
    const uploadResponse = await fetch(`${serverUrl}/api/upload`, {
      method: 'POST',
      body: formData
    });
    
    if (!uploadResponse.ok) {
      const errorText = await uploadResponse.text();
      throw new Error(`Erreur serveur: ${errorText}`);
    }
    
    console.log('[Nebula BG] ✅ PDF uploadé avec succès');
    
    // Notification de succès
    chrome.notifications.create({
      type: 'basic',
      iconUrl: chrome.runtime.getURL('icons/icon48.png'),
      title: 'Nebula - PDF partagé',
      message: `✅ ${filename} a été partagé avec succès !`
    }).catch(err => console.log('Notification error:', err));
    
    return { success: true, filename };
    
  } catch (error) {
    console.error('[Nebula BG] Erreur upload PDF:', error);
    return { success: false, error: error.message };
  }
}

// Écouter les messages depuis le popup et les content scripts
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === 'RECONNECT') {
    // Reconnecter au serveur avec les nouvelles infos
    chrome.storage.sync.get(['serverUrl', 'deviceId'], (result) => {
      if (result.serverUrl) {
        connectToServer(result.serverUrl, result.deviceId);
      }
    });
  }
  
  if (request.type === 'PDF_UPLOADED') {
    // Notification pour le PDF uploadé depuis le viewer
    chrome.notifications.create({
      type: 'basic',
      iconUrl: chrome.runtime.getURL('icons/icon48.png'),
      title: 'Nebula - PDF partagé',
      message: `✅ ${request.filename} a été partagé avec succès !`
    }).catch(err => console.log('Notification error:', err));
  }
  
  if (request.type === 'UPLOAD_PDF_FROM_URL') {
    // Uploader un PDF depuis son URL (fichier local ou distant)
    uploadPDFFromURL(request.pdfUrl, request.filename)
      .then(result => {
        sendResponse(result);
      })
      .catch(error => {
        sendResponse({ success: false, error: error.message });
      });
    return true; // Garder le canal ouvert pour la réponse asynchrone
  }
  
  sendResponse({ success: true });
  return true;
});

// Démarrer la connexion au démarrage de l'extension
chrome.storage.sync.get(['serverUrl', 'deviceId'], (result) => {
  if (result.serverUrl) {
    connectToServer(result.serverUrl, result.deviceId);
  }
});

// ===== MENUS CONTEXTUELS =====

// Créer les menus contextuels
function createContextMenus() {
  // Menu pour les images
  chrome.contextMenus.create({
    id: 'nebula-share-image',
    title: '🚀 Partager sur Nebula',
    contexts: ['image']
  });
  
  // Menu pour les liens
  chrome.contextMenus.create({
    id: 'nebula-share-link',
    title: '🚀 Partager le lien sur Nebula',
    contexts: ['link']
  });
  
  // Menu pour la sélection de texte
  chrome.contextMenus.create({
    id: 'nebula-share-text',
    title: '🚀 Partager le texte sur Nebula',
    contexts: ['selection']
  });
}

// Gérer les clics sur les menus contextuels
chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  const { menuItemId, srcUrl, linkUrl, selectionText } = info;
  
  try {
    // Récupérer la config
    const result = await chrome.storage.sync.get(['serverUrl', 'deviceId']);
    const serverUrl = result.serverUrl || 'https://nebula-a50x.onrender.com';
    const deviceId = result.deviceId;
    
    if (!serverUrl || !deviceId) {
      chrome.notifications.create({
        type: 'basic',
        iconUrl: chrome.runtime.getURL('icons/icon48.png'),
        title: 'Nebula - Configuration requise',
        message: '⚠️ Veuillez configurer l\'extension d\'abord'
      });
      return;
    }
    
    if (menuItemId === 'nebula-share-image' && srcUrl) {
      await shareImage(srcUrl, serverUrl, deviceId);
    } else if (menuItemId === 'nebula-share-link' && linkUrl) {
      await shareLink(linkUrl, serverUrl, deviceId);
    } else if (menuItemId === 'nebula-share-text' && selectionText) {
      await shareText(selectionText, serverUrl, deviceId);
    }
  } catch (error) {
    console.error('Erreur lors du partage:', error);
    chrome.notifications.create({
      type: 'basic',
      iconUrl: chrome.runtime.getURL('icons/icon48.png'),
      title: 'Nebula - Erreur',
      message: '❌ Erreur lors du partage: ' + error.message
    });
  }
});

// Partager une image
async function shareImage(imageUrl, serverUrl, deviceId) {
  try {
    // Notification de début
    chrome.notifications.create({
      type: 'basic',
      iconUrl: chrome.runtime.getURL('icons/icon48.png'),
      title: 'Nebula',
      message: '📥 Téléchargement de l\'image...'
    });
    
    // Télécharger l'image avec mode no-cors pour éviter les erreurs CORS
    const response = await fetch(imageUrl, {
      mode: 'cors',
      credentials: 'omit'
    });
    
    if (!response.ok) {
      throw new Error(`Erreur HTTP: ${response.status}`);
    }
    
    let blob = await response.blob();
    
    // Vérifier que c'est bien une image
    if (!blob.type.startsWith('image/')) {
      // Si le type n'est pas détecté, essayer de le deviner depuis l'URL
      const ext = imageUrl.split('.').pop().split('?')[0].toLowerCase();
      const mimeTypes = {
        'jpg': 'image/jpeg',
        'jpeg': 'image/jpeg',
        'png': 'image/png',
        'gif': 'image/gif',
        'webp': 'image/webp',
        'svg': 'image/svg+xml'
      };
      const detectedType = mimeTypes[ext] || 'image/jpeg';
      blob = new Blob([blob], { type: detectedType });
    }
    
    // Extraire le nom du fichier de l'URL
    const urlParts = imageUrl.split('/');
    let filename = urlParts[urlParts.length - 1].split('?')[0];
    
    // Si pas d'extension, en ajouter une
    if (!filename.includes('.')) {
      const ext = blob.type.split('/')[1] || 'jpg';
      filename = `image_${Date.now()}.${ext}`;
    }
    
    // Créer un File object
    const file = new File([blob], filename, { type: blob.type });
    
    // Créer le FormData avec le bon nom de champ
    const formData = new FormData();
    formData.append('files', file); // 'files' pas 'file' !
    formData.append('deviceId', deviceId);
    formData.append('targetDevice', 'all');
    
    // Uploader
    const uploadResponse = await fetch(`${serverUrl}/api/upload`, {
      method: 'POST',
      body: formData
    });
    
    if (!uploadResponse.ok) {
      const errorText = await uploadResponse.text();
      throw new Error(`Upload failed (${uploadResponse.status}): ${errorText}`);
    }
    
    const result = await uploadResponse.json();
    console.log('Upload réussi:', result);
    
    // Notification de succès
    chrome.notifications.create({
      type: 'basic',
      iconUrl: chrome.runtime.getURL('icons/icon48.png'),
      title: 'Nebula',
      message: `✅ Image partagée: ${filename}`
    });
  } catch (error) {
    console.error('Erreur partage image:', error);
    
    // Message d'erreur plus explicite selon le type d'erreur
    let errorMessage = '❌ Erreur lors du partage';
    
    if (error.message.includes('CORS') || error.message.includes('NetworkError')) {
      errorMessage = '❌ Image protégée (CORS). Essayez de télécharger l\'image d\'abord.';
    } else if (error.message.includes('HTTP')) {
      errorMessage = `❌ Impossible de télécharger l'image: ${error.message}`;
    } else if (error.message.includes('Upload failed')) {
      errorMessage = '❌ Échec de l\'envoi au serveur Nebula';
    } else {
      errorMessage = `❌ ${error.message}`;
    }
    
    // Notification d'erreur détaillée
    chrome.notifications.create({
      type: 'basic',
      iconUrl: chrome.runtime.getURL('icons/icon48.png'),
      title: 'Nebula - Erreur',
      message: errorMessage
    });
    
    throw error;
  }
}

// Partager un lien
async function shareLink(linkUrl, serverUrl, deviceId) {
  try {
    const response = await fetch(`${serverUrl}/api/link`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: linkUrl, deviceId })
    });
    
    if (!response.ok) {
      throw new Error('Erreur lors du partage du lien');
    }
    
    chrome.notifications.create({
      type: 'basic',
      iconUrl: chrome.runtime.getURL('icons/icon48.png'),
      title: 'Nebula',
      message: '✅ Lien partagé avec succès'
    });
  } catch (error) {
    console.error('Erreur partage lien:', error);
    throw error;
  }
}

// Partager du texte
async function shareText(text, serverUrl, deviceId) {
  try {
    const response = await fetch(`${serverUrl}/api/text`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: text, deviceId })
    });
    
    if (!response.ok) {
      throw new Error('Erreur lors du partage du texte');
    }
    
    chrome.notifications.create({
      type: 'basic',
      iconUrl: chrome.runtime.getURL('icons/icon48.png'),
      title: 'Nebula',
      message: '✅ Texte partagé avec succès'
    });
  } catch (error) {
    console.error('Erreur partage texte:', error);
    throw error;
  }
}
