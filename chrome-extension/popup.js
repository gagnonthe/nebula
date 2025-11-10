// Variables globales
let serverUrl = '';
let deviceId = '';
let deviceName = 'Chrome Extension';
let isConfigured = false;

// Initialisation
document.addEventListener('DOMContentLoaded', async () => {
    await loadConfig();
    setupEventListeners();
    renderQrIfPossible();
    
    if (isConfigured) {
        showMainInterface();
        await registerDevice();
        await loadFiles();
        await loadDevices();
    } else {
        showConfigSection();
    }
});

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
    const selectFileBtn = document.getElementById('selectFile');
    const fileInput = document.getElementById('fileInput');
    const refreshFilesBtn = document.getElementById('refreshFiles');
    
    if (saveConfigBtn) {
        saveConfigBtn.addEventListener('click', saveConfig);
    }
    if (selectFileBtn && fileInput) {
        selectFileBtn.addEventListener('click', () => fileInput.click());
    }
    if (fileInput) {
        fileInput.addEventListener('change', handleFileSelect);
    }
    if (refreshFilesBtn) {
        refreshFilesBtn.addEventListener('click', loadFiles);
    }
    const refreshQrBtn = document.getElementById('refreshQr');
    if (refreshQrBtn) {
        refreshQrBtn.addEventListener('click', renderQrIfPossible);
    }
    const copyUrlBtn = document.getElementById('copyServerUrl');
    if (copyUrlBtn) {
        copyUrlBtn.addEventListener('click', async () => {
            try {
                await navigator.clipboard.writeText(serverUrl);
                alert('URL serveur copiée');
            } catch {}
        });
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

// Sélection de fichier
function handleFileSelect(e) {
    const file = e.target.files[0];
    if (file) {
        const selectedFileDiv = document.getElementById('selectedFile');
        selectedFileDiv.innerHTML = `
            <div>📄 ${file.name}</div>
            <div style="margin-top: 0.5rem;">
                <button class="btn btn-primary" id="uploadBtn">Envoyer</button>
                <button class="btn btn-secondary" id="cancelBtn">Annuler</button>
            </div>
        `;
        selectedFileDiv.classList.add('show');
        
        document.getElementById('uploadBtn').addEventListener('click', () => uploadFile(file));
        document.getElementById('cancelBtn').addEventListener('click', cancelUpload);
    }
}

// Annuler l'upload
function cancelUpload() {
    document.getElementById('fileInput').value = '';
    document.getElementById('selectedFile').classList.remove('show');
}

// Upload de fichier
async function uploadFile(file) {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('deviceId', deviceId);
    formData.append('targetDevice', 'all');
    
    const progressContainer = document.getElementById('uploadProgress');
    const progressFill = document.getElementById('progressFill');
    const progressText = document.getElementById('progressText');
    
    if (progressContainer) {
        progressContainer.classList.add('show');
        progressContainer.style.display = 'block';
    }
    
    try {
        const xhr = new XMLHttpRequest();
        
        xhr.upload.addEventListener('progress', (e) => {
            if (e.lengthComputable && progressFill && progressText) {
                const percent = Math.round((e.loaded / e.total) * 100);
                progressFill.style.width = percent + '%';
                progressText.textContent = percent + '%';
            }
        });
        
        xhr.addEventListener('load', () => {
            if (xhr.status === 200) {
                chrome.notifications.create({
                    type: 'basic',
                    iconUrl: chrome.runtime.getURL('icons/icon48.png'),
                    title: 'Nebula',
                    message: 'Fichier envoyé avec succès!'
                }).catch(err => console.log('Notification error:', err));
                
                cancelUpload();
                loadFiles();
            } else {
                alert('Erreur lors de l\'envoi');
            }
            
            if (progressContainer) {
                progressContainer.style.display = 'none';
                progressContainer.classList.remove('show');
            }
            if (progressFill) progressFill.style.width = '0%';
        });
        
        xhr.addEventListener('error', () => {
            alert('Erreur lors de l\'envoi');
            if (progressContainer) {
                progressContainer.style.display = 'none';
                const refreshQrBtn = document.getElementById('refreshQr');
                if (refreshQrBtn) {
                    refreshQrBtn.addEventListener('click', renderQrIfPossible);
                }
                const copyUrlBtn = document.getElementById('copyServerUrl');
                if (copyUrlBtn) {
                    copyUrlBtn.addEventListener('click', async () => {
                        try {
                            await navigator.clipboard.writeText(serverUrl);
                            alert('URL serveur copiée');
                        } catch {}
                    });
                }
                progressContainer.classList.remove('show');
            }
        });
        
        xhr.open('POST', `${serverUrl}/api/upload`);
        xhr.send(formData);
    } catch (error) {
        console.error('Erreur upload:', error);
        alert('Erreur lors de l\'envoi');
        if (progressContainer) {
            progressContainer.style.display = 'none';
            progressContainer.classList.remove('show');
        }
    }
}

// Rendu du QR code pour appairage
function renderQrIfPossible() {
    const container = document.getElementById('qrContainer');
    if (!container || typeof QRCode === 'undefined') {
        console.warn('QRCode non disponible ou container manquant');
        return;
    }

    container.innerHTML = '';
    const payload = JSON.stringify({
        t: 'nebula',
        server: serverUrl,
        device: deviceId
    });
    new QRCode(container, {
        text: payload,
        width: 128,
        height: 128,
        colorDark: '#111111',
        colorLight: '#ffffff',
        correctLevel: QRCode.CorrectLevel.M
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
