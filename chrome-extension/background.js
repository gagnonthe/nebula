// Service worker pour l'extension Chrome
chrome.runtime.onInstalled.addListener(() => {
  console.log('Extension File Share installée');
});

// Gérer les notifications
chrome.notifications.onClicked.addListener((notificationId) => {
  // Ouvrir le popup quand on clique sur la notification
  chrome.action.openPopup();
});

// Écouter les messages depuis le popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === 'FILE_UPLOADED') {
    // Afficher une notification
    chrome.notifications.create({
      type: 'basic',
      iconUrl: 'icons/icon48.png',
      title: 'Nouveau fichier',
      message: `Fichier reçu: ${request.filename}`
    });
  }
  
  sendResponse({ success: true });
  return true;
});

// Vérifier périodiquement les nouveaux fichiers (optionnel)
chrome.alarms.create('checkFiles', { periodInMinutes: 5 });

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === 'checkFiles') {
    // Vérifier s'il y a de nouveaux fichiers
    checkForNewFiles();
  }
});

async function checkForNewFiles() {
  try {
    const { serverUrl, deviceId, lastCheck } = await chrome.storage.sync.get([
      'serverUrl',
      'deviceId',
      'lastCheck'
    ]);
    
    if (!serverUrl || !deviceId) return;
    
    const response = await fetch(`${serverUrl}/api/files?deviceId=${deviceId}`);
    const data = await response.json();
    
    // Vérifier les nouveaux fichiers depuis la dernière vérification
    const now = Date.now();
    const newFiles = data.files.filter(file => {
      const uploadTime = new Date(file.uploadedAt).getTime();
      return uploadTime > (lastCheck || 0) && file.uploadedBy !== deviceId;
    });
    
    if (newFiles.length > 0) {
      chrome.notifications.create({
        type: 'basic',
        iconUrl: 'icons/icon48.png',
        title: 'Nouveaux fichiers',
        message: `${newFiles.length} nouveau(x) fichier(s) disponible(s)`
      });
    }
    
    chrome.storage.sync.set({ lastCheck: now });
  } catch (error) {
    console.error('Erreur vérification fichiers:', error);
  }
}
