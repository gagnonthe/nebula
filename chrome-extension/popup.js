// Variables globales
let serverUrl = '';
let deviceId = '';
let deviceName = 'Chrome Extension';
let isConfigured = false;

// Initialisation
document.addEventListener('DOMContentLoaded', async () => {
    await loadConfig();
    setupEventListeners();
    
    if (isConfigured) {
        showMainInterface();
        await registerDevice();
        await loadFiles();
        await loadDevices();
    } else {
        showConfigSection();
    }
    
    // Ajouter le gestionnaire pour le bouton du site
    const openWebsiteBtn = document.getElementById('openWebsite');
    if (openWebsiteBtn) {
        openWebsiteBtn.addEventListener('click', () => {
            chrome.tabs.create({ url: 'https://nebula-a50x.onrender.com/' });
        });
    }
    
    // Ajouter le gestionnaire pour le bouton QR code
    const showQRBtn = document.getElementById('showQRCode');
    if (showQRBtn) {
        showQRBtn.addEventListener('click', showQRCodeModal);
    }
    
    // Fermer le modal QR code
    const closeQRBtn = document.getElementById('closeQRModal');
    if (closeQRBtn) {
        closeQRBtn.addEventListener('click', closeQRCodeModal);
    }
    
    // Fermer le modal en cliquant sur le fond
    const qrModal = document.getElementById('qrModal');
    if (qrModal) {
        qrModal.addEventListener('click', (e) => {
            if (e.target === qrModal) {
                closeQRCodeModal();
            }
        });
    }
});

// Afficher le modal avec le QR code
function showQRCodeModal() {
    const modal = document.getElementById('qrModal');
    const qrcodeContainer = document.getElementById('qrcode');
    
    // Vider le conteneur
    qrcodeContainer.innerHTML = '';
    
    // Générer le QR code
    const qrcode = new QRCode(qrcodeContainer, {
        text: 'https://nebula-a50x.onrender.com/',
        width: 200,
        height: 200,
        colorDark: '#111827',
        colorLight: '#ffffff',
        correctLevel: QRCode.CorrectLevel.H
    });
    
    // Afficher le modal
    modal.classList.remove('hidden');
}

// Fermer le modal QR code
function closeQRCodeModal() {
    const modal = document.getElementById('qrModal');
    modal.classList.add('hidden');
}

// Charger la configuration
async function loadConfig() {
    return new Promise((resolve) => {
        chrome.storage.sync.get(['serverUrl', 'deviceId'], (result) => {
            serverUrl = result.serverUrl || 'https://nebula-a50x.onrender.com';
            deviceId = result.deviceId || generateDeviceId();
            isConfigured = !!serverUrl;
            
            // Sauvegarder l'URL par défaut si elle n'existe pas
            if (!result.serverUrl) {
                chrome.storage.sync.set({ serverUrl });
            }
            
            if (serverUrl) {
                document.getElementById('serverUrl').value = serverUrl;
            }
            
            resolve();
        });
    });
}

// Générer un ID d'appareil
function generateDeviceId() {
    const id = 'chrome_' + Math.random().toString(36).substr(2, 9);
    chrome.storage.sync.set({ deviceId: id });
    return id;
}

// Configuration des événements
function setupEventListeners() {
    const saveConfigBtn = document.getElementById('saveConfig');
    const selectFilesBtn = document.getElementById('selectFiles');
    const selectFolderBtn = document.getElementById('selectFolder');
    const fileInput = document.getElementById('fileInput');
    const refreshFilesBtn = document.getElementById('refreshFiles');
    
    if (saveConfigBtn) {
        saveConfigBtn.addEventListener('click', saveConfig);
    }
    
    if (selectFilesBtn && fileInput) {
        selectFilesBtn.addEventListener('click', () => {
            fileInput.removeAttribute('webkitdirectory');
            fileInput.removeAttribute('directory');
            fileInput.setAttribute('multiple', 'multiple');
            fileInput.click();
        });
    }
    
    if (selectFolderBtn && fileInput) {
        selectFolderBtn.addEventListener('click', () => {
            fileInput.setAttribute('webkitdirectory', 'webkitdirectory');
            fileInput.setAttribute('directory', 'directory');
            fileInput.click();
        });
    }
    
    if (fileInput) {
        fileInput.addEventListener('change', handleFileSelect);
    }
    
    if (refreshFilesBtn) {
        refreshFilesBtn.addEventListener('click', loadFiles);
    }
}

// Sauvegarder la configuration
async function saveConfig() {
    const url = document.getElementById('serverUrl').value.trim();
    
    if (!url) {
        alert('Veuillez entrer l\'URL du serveur');
        return;
    }
    
    // Vérifier la connexion
    try {
        const response = await fetch(`${url}/api/health`);
        if (!response.ok) {
            throw new Error('Serveur non accessible');
        }
        
        serverUrl = url;
        chrome.storage.sync.set({ serverUrl: url });
        
        isConfigured = true;
        showMainInterface();
        await registerDevice();
        await loadFiles();
        await loadDevices();
        
        updateStatus(true);
    } catch (error) {
        alert('Impossible de se connecter au serveur. Vérifiez l\'URL.');
        console.error(error);
    }
}

// Afficher la section de configuration
function showConfigSection() {
    const configSection = document.getElementById('configSection');
    const uploadSection = document.getElementById('uploadSection');
    const filesSection = document.getElementById('filesSection');
    const devicesSection = document.getElementById('devicesSection');
    
    if (configSection) configSection.classList.remove('hidden');
    if (uploadSection) uploadSection.classList.add('hidden');
    if (filesSection) filesSection.classList.add('hidden');
    if (devicesSection) devicesSection.classList.add('hidden');
}

// Afficher l'interface principale
function showMainInterface() {
    const configSection = document.getElementById('configSection');
    const uploadSection = document.getElementById('uploadSection');
    const filesSection = document.getElementById('filesSection');
    const devicesSection = document.getElementById('devicesSection');
    
    if (configSection) configSection.classList.add('hidden');
    if (uploadSection) uploadSection.classList.remove('hidden');
    if (filesSection) filesSection.classList.remove('hidden');
    if (devicesSection) devicesSection.classList.remove('hidden');
}

// Mettre à jour le statut
function updateStatus(online) {
    const statusDot = document.getElementById('statusDot');
    const statusText = document.querySelector('.status-text');
    
    if (statusDot && statusText) {
        if (online) {
            statusDot.classList.add('online');
            statusText.classList.add('online');
            statusText.textContent = 'Connecté';
        } else {
            statusDot.classList.remove('online');
            statusText.classList.remove('online');
            statusText.textContent = 'Déconnecté';
        }
    }
}

// Enregistrer l'appareil
async function registerDevice() {
    try {
        const response = await fetch(`${serverUrl}/api/device/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                deviceId,
                deviceName,
                deviceType: 'desktop'
            })
        });
        
        if (response.ok) {
            updateStatus(true);
        }
    } catch (error) {
        console.error('Erreur enregistrement:', error);
        updateStatus(false);
    }
}

// Sélection de fichier(s)
function handleFileSelect(e) {
    const files = Array.from(e.target.files);
    
    if (files.length === 0) return;
    
    const selectedFilesDiv = document.getElementById('selectedFiles');
    const totalSize = files.reduce((sum, f) => sum + f.size, 0);
    const totalSizeMB = (totalSize / 1024 / 1024).toFixed(2);
    
    let fileListHTML = '<div style="max-height:120px; overflow-y:auto; margin-bottom:8px;">';
    files.forEach((file, index) => {
        const sizeMB = (file.size / 1024 / 1024).toFixed(2);
        fileListHTML += `<div style="font-size:11px; padding:4px 0; border-bottom:1px solid #e5e7eb;">
            📄 ${file.webkitRelativePath || file.name} (${sizeMB} MB)
        </div>`;
    });
    fileListHTML += '</div>';
    
    selectedFilesDiv.innerHTML = `
        <div style="font-weight:600; margin-bottom:8px;">
            ${files.length} fichier(s) sélectionné(s) • Total: ${totalSizeMB} MB
        </div>
        ${fileListHTML}
        <div style="display:flex; gap:8px; margin-top:8px;">
            <button class="btn btn-primary" id="uploadBtn" style="flex:1;">📤 Envoyer tout</button>
            <button class="btn btn-secondary" id="cancelBtn" style="flex:1;">❌ Annuler</button>
        </div>
    `;
    selectedFilesDiv.classList.remove('hidden');
    selectedFilesDiv.classList.add('show');
    
    document.getElementById('uploadBtn').addEventListener('click', () => uploadMultipleFiles(files));
    document.getElementById('cancelBtn').addEventListener('click', cancelUpload);
}

// Upload multiple files
async function uploadMultipleFiles(files) {
    const progressContainer = document.getElementById('uploadProgress');
    const progressFill = document.getElementById('progressFill');
    const progressText = document.getElementById('progressText');
    
    if (progressContainer) {
        progressContainer.classList.remove('hidden');
        progressContainer.style.display = 'block';
    }
    
    // Détecter si c'est un dossier (tous les fichiers ont webkitRelativePath)
    const isFolder = files.length > 1 && files[0].webkitRelativePath;
    const folderName = isFolder ? files[0].webkitRelativePath.split('/')[0] : null;
    
    if (isFolder) {
        // Upload en tant que ZIP
        if (progressText) {
            progressText.textContent = `Création du ZIP pour "${folderName}"...`;
        }
        
        try {
            await uploadAsZip(files, folderName, (percent) => {
                if (progressFill) progressFill.style.width = percent + '%';
                if (progressText) progressText.textContent = `ZIP: ${percent}%`;
            });
            
            chrome.notifications.create({
                type: 'basic',
                iconUrl: chrome.runtime.getURL('icons/icon48.png'),
                title: 'Nebula',
                message: `Dossier "${folderName}" envoyé (${files.length} fichiers en ZIP)`
            }).catch(err => console.log('Notification error:', err));
        } catch (error) {
            console.error('Erreur upload ZIP:', error);
            alert('Erreur lors de l\'envoi du dossier');
        }
    } else {
        // Upload fichiers individuels
        let uploadedCount = 0;
        const totalFiles = files.length;
        
        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            
            if (progressText) {
                progressText.textContent = `Envoi ${i + 1}/${totalFiles}: ${file.name}`;
            }
            
            try {
                await uploadFile(file, (percent) => {
                    const overallPercent = Math.round(((i + percent / 100) / totalFiles) * 100);
                    if (progressFill) progressFill.style.width = overallPercent + '%';
                });
                uploadedCount++;
            } catch (error) {
                console.error('Erreur upload:', file.name, error);
            }
        }
        
        chrome.notifications.create({
            type: 'basic',
            iconUrl: chrome.runtime.getURL('icons/icon48.png'),
            title: 'Nebula',
            message: `${uploadedCount}/${totalFiles} fichier(s) envoyé(s) avec succès!`
        }).catch(err => console.log('Notification error:', err));
    }
    
    cancelUpload();
    loadFiles();
}

// Upload comme ZIP (pour dossiers)
async function uploadAsZip(files, folderName, progressCallback) {
    return new Promise((resolve, reject) => {
        const formData = new FormData();
        
        // Ajouter tous les fichiers
        files.forEach((file, index) => {
            formData.append('files', file);
            // Ajouter le chemin relatif pour chaque fichier
            formData.append(`relativePath_${file.name}`, file.webkitRelativePath || file.name);
        });
        
        formData.append('deviceId', deviceId);
        formData.append('targetDevice', 'all');
        formData.append('isFolder', 'true');
        formData.append('folderName', folderName);
        
        const xhr = new XMLHttpRequest();
        
        xhr.upload.addEventListener('progress', (e) => {
            if (e.lengthComputable && progressCallback) {
                const percent = Math.round((e.loaded / e.total) * 100);
                progressCallback(percent);
            }
        });
        
        xhr.addEventListener('load', () => {
            if (xhr.status === 200) {
                resolve();
            } else {
                reject(new Error('Upload failed'));
            }
        });
        
        xhr.addEventListener('error', () => {
            reject(new Error('Network error'));
        });
        
        xhr.open('POST', `${serverUrl}/api/upload`);
        xhr.send(formData);
    });
}

// Annuler l'upload
function cancelUpload() {
    document.getElementById('fileInput').value = '';
    const selectedFilesDiv = document.getElementById('selectedFiles');
    if (selectedFilesDiv) {
        selectedFilesDiv.classList.add('hidden');
        selectedFilesDiv.classList.remove('show');
    }
}

// Upload de fichier (single - appelé par uploadMultipleFiles)
async function uploadFile(file, progressCallback) {
    return new Promise((resolve, reject) => {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('deviceId', deviceId);
        formData.append('targetDevice', 'all');
        
        const xhr = new XMLHttpRequest();
        
        xhr.upload.addEventListener('progress', (e) => {
            if (e.lengthComputable && progressCallback) {
                const percent = Math.round((e.loaded / e.total) * 100);
                progressCallback(percent);
            }
        });
        
        xhr.addEventListener('load', () => {
            if (xhr.status === 200) {
                resolve();
            } else {
                reject(new Error('Upload failed'));
            }
        });
        
        xhr.addEventListener('error', () => {
            reject(new Error('Network error'));
        });
        
        xhr.open('POST', `${serverUrl}/api/upload`);
        xhr.send(formData);
    });
}

// Charger les fichiers
async function loadFiles() {
    try {
        const response = await fetch(`${serverUrl}/api/files?deviceId=${deviceId}`);
        const data = await response.json();
        const filesList = document.getElementById('filesList');
        
        if (data.files.length === 0) {
            filesList.innerHTML = '<p class="empty-state">Aucun fichier disponible</p>';
            return;
        }
        
        filesList.innerHTML = data.files.map(file => `
            <div class="file-item">
                <div class="file-name">${getFileIcon(file.mimetype)} ${file.filename}</div>
                <div class="file-meta">
                    ${formatFileSize(file.size)} • ${formatDate(file.uploadedAt)}
                </div>
                <div class="file-actions">
                    <button class="btn btn-primary" data-file-id="${file.id}" data-filename="${file.filename}">
                        Télécharger
                    </button>
                    ${file.uploadedBy === deviceId ? `
                        <button class="btn btn-danger" data-delete-id="${file.id}">
                            Supprimer
                        </button>
                    ` : ''}
                </div>
            </div>
        `).join('');
        
        // Ajouter les événements
        filesList.querySelectorAll('[data-file-id]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const fileId = e.target.dataset.fileId;
                const filename = e.target.dataset.filename;
                downloadFile(fileId, filename);
            });
        });
        
        filesList.querySelectorAll('[data-delete-id]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const fileId = e.target.dataset.deleteId;
                deleteFile(fileId);
            });
        });
    } catch (error) {
        console.error('Erreur chargement fichiers:', error);
    }
}

// Télécharger un fichier
function downloadFile(fileId, filename) {
    chrome.downloads.download({
        url: `${serverUrl}/api/download/${fileId}`,
        filename: filename,
        saveAs: true
    });
}

// Supprimer un fichier
async function deleteFile(fileId) {
    if (!confirm('Voulez-vous vraiment supprimer ce fichier?')) {
        return;
    }
    
    try {
        const response = await fetch(`${serverUrl}/api/files/${fileId}`, {
            method: 'DELETE'
        });
        
        if (response.ok) {
            loadFiles();
        } else {
            alert('Erreur lors de la suppression');
        }
    } catch (error) {
        console.error('Erreur suppression:', error);
        alert('Erreur lors de la suppression');
    }
}

// Charger les appareils
async function loadDevices() {
    try {
        const response = await fetch(`${serverUrl}/api/devices`);
        const data = await response.json();
        
        const devicesList = document.getElementById('devicesList');
        
        if (data.devices.length === 0) {
            devicesList.innerHTML = '<p class="empty-state">Aucun appareil</p>';
            return;
        }
        
        devicesList.innerHTML = data.devices.map(device => `
            <div class="device-item">
                <div class="device-icon">${device.deviceType === 'mobile' ? '📱' : '💻'}</div>
                <div class="device-info">
                    <div class="device-name">
                        ${device.deviceName}
                        ${device.deviceId === deviceId ? '(Vous)' : ''}
                    </div>
                    <div class="device-type">${device.deviceType}</div>
                </div>
            </div>
        `).join('');
    } catch (error) {
        console.error('Erreur chargement appareils:', error);
    }
}

// Utilitaires
function getFileIcon(mimetype) {
    if (!mimetype) return '📄';
    if (mimetype.startsWith('image/')) return '🖼️';
    if (mimetype.startsWith('video/')) return '🎥';
    if (mimetype.startsWith('audio/')) return '🎵';
    if (mimetype.includes('pdf')) return '📕';
    if (mimetype.includes('zip') || mimetype.includes('rar')) return '📦';
    return '📄';
}

function formatFileSize(bytes) {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}

function formatDate(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now - date;
    
    if (diff < 60000) return 'À l\'instant';
    if (diff < 3600000) return Math.floor(diff / 60000) + ' min';
    if (diff < 86400000) return Math.floor(diff / 3600000) + ' h';
    return date.toLocaleDateString('fr-FR');
}
