// Service worker pour l'extension Chrome
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
});

// Se connecter au serveur Socket.IO pour recevoir les notifications en temps réel
function connectToServer(serverUrl, deviceId) {
  if (socket) {
    socket.disconnect();
  }
  
  try {
    // Charger Socket.IO depuis le CDN
    importScripts('https://cdn.socket.io/4.5.4/socket.io.min.js');
    
    socket = io(serverUrl, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: MAX_RECONNECT_ATTEMPTS,
      reconnectionDelay: 1000
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

// Écouter les messages depuis le popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === 'RECONNECT') {
    // Reconnecter au serveur avec les nouvelles infos
    chrome.storage.sync.get(['serverUrl', 'deviceId'], (result) => {
      if (result.serverUrl) {
        connectToServer(result.serverUrl, result.deviceId);
      }
    });
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
