// Configuration
const API_URL = window.location.origin;
let socket;
let deviceId = localStorage.getItem('deviceId') || generateDeviceId();
let deviceName = localStorage.getItem('deviceName') || getDeviceName();

// Générer un ID d'appareil unique
function generateDeviceId() {
    const id = 'device_' + Math.random().toString(36).substr(2, 9);
    localStorage.setItem('deviceId', id);
    return id;
}

// Obtenir le nom de l'appareil
function getDeviceName() {
    const ua = navigator.userAgent;
    let name = 'Unknown Device';
    
    if (/iPhone/.test(ua)) name = 'iPhone';
    else if (/iPad/.test(ua)) name = 'iPad';
    else if (/Android/.test(ua)) name = 'Android';
    else if (/Windows/.test(ua)) name = 'Windows PC';
    else if (/Mac/.test(ua)) name = 'Mac';
    
    localStorage.setItem('deviceName', name);
    return name;
}

// Obtenir le type d'appareil
function getDeviceType() {
    const ua = navigator.userAgent;
    if (/iPhone|iPad|Android/.test(ua)) return 'mobile';
    return 'desktop';
}

// Initialisation
document.addEventListener('DOMContentLoaded', async () => {
    // Enregistrer le service worker
    if ('serviceWorker' in navigator) {
        try {
            await navigator.serviceWorker.register('/sw.js');
            console.log('Service Worker enregistré');
        } catch (error) {
            console.error('Erreur Service Worker:', error);
        }
    }

    // Initialiser WebSocket
    initWebSocket();

    // Enregistrer l'appareil
    await registerDevice();

    // Charger les fichiers
    await loadFiles();

    // Charger les appareils
    await loadDevices();

    // Configuration de l'upload
    setupUpload();
});

// WebSocket
function initWebSocket() {
    socket = io(API_URL);

    socket.on('connect', () => {
        console.log('WebSocket connecté');
        updateStatus(true);
        socket.emit('register-device', {
            deviceId,
            deviceName,
            deviceType: getDeviceType()
        });
    });

    socket.on('disconnect', () => {
        console.log('WebSocket déconnecté');
        updateStatus(false);
    });

    socket.on('file-uploaded', (data) => {
        console.log('Nouveau fichier:', data);
        showNotification('Nouveau fichier disponible: ' + data.filename, 'success');
        loadFiles();
    });

    socket.on('file-deleted', (data) => {
        console.log('Fichier supprimé:', data.fileId);
        loadFiles();
    });

    socket.on('device-connected', (data) => {
        console.log('Appareil connecté:', data);
        loadDevices();
    });

    socket.on('device-disconnected', (data) => {
        console.log('Appareil déconnecté:', data);
        loadDevices();
    });
}

// Mettre à jour le statut de connexion
function updateStatus(connected) {
    const statusBadge = document.getElementById('device-status');
    if (connected) {
        statusBadge.textContent = '🟢 Connecté';
        statusBadge.classList.add('connected');
    } else {
        statusBadge.textContent = '🔴 Déconnecté';
        statusBadge.classList.remove('connected');
    }
}

// Enregistrer l'appareil
async function registerDevice() {
    try {
        const response = await fetch(`${API_URL}/api/device/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                deviceId,
                deviceName,
                deviceType: getDeviceType()
            })
        });
        const data = await response.json();
        console.log('Appareil enregistré:', data);
    } catch (error) {
        console.error('Erreur enregistrement:', error);
    }
}

// Configuration de l'upload
function setupUpload() {
    const fileInput = document.getElementById('fileInput');
    const uploadArea = document.getElementById('uploadArea');
    const selectFilesBtn = document.getElementById('selectFiles');
    const selectFolderBtn = document.getElementById('selectFolder');

    if (!fileInput || !uploadArea) {
        console.error('Éléments d\'upload non trouvés');
        return;
    }

    // Bouton fichiers
    if (selectFilesBtn) {
        selectFilesBtn.addEventListener('click', () => {
            fileInput.removeAttribute('webkitdirectory');
            fileInput.removeAttribute('directory');
            fileInput.setAttribute('multiple', 'multiple');
            fileInput.click();
        });
    }

    // Bouton dossier
    if (selectFolderBtn) {
        selectFolderBtn.addEventListener('click', () => {
            fileInput.setAttribute('webkitdirectory', 'webkitdirectory');
            fileInput.setAttribute('directory', 'directory');
            fileInput.click();
        });
    }

    fileInput.addEventListener('change', handleFileSelect);

    // Drag & Drop
    uploadArea.addEventListener('dragover', (e) => {
        e.preventDefault();
        uploadArea.classList.add('dragover');
    });

    uploadArea.addEventListener('dragleave', () => {
        uploadArea.classList.remove('dragover');
    });

    uploadArea.addEventListener('drop', (e) => {
        e.preventDefault();
        uploadArea.classList.remove('dragover');
        const files = Array.from(e.dataTransfer.files);
        if (files.length > 0) {
            uploadMultipleFiles(files);
        }
    });
}

// Sélection de fichier(s)
function handleFileSelect(e) {
    const files = Array.from(e.target.files);
    if (files.length > 0) {
        uploadMultipleFiles(files);
    }
}

// Upload multiple files
async function uploadMultipleFiles(files) {
    const progressContainer = document.getElementById('uploadProgress');
    const progressFill = document.getElementById('progressFill');
    const progressText = document.getElementById('progressText');
    
    if (progressContainer) {
        progressContainer.classList.remove('hidden');
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
            
            showNotification(`📁 Dossier "${folderName}" envoyé (${files.length} fichiers en ZIP)`, 'success');
        } catch (error) {
            console.error('Erreur upload ZIP:', error);
            showNotification('❌ Erreur lors de l\'envoi du dossier', 'error');
        }
    } else {
        // Upload fichiers individuels
        let uploadedCount = 0;
        const totalFiles = files.length;
        
        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            
            if (progressText) {
                progressText.textContent = `Envoi ${i + 1}/${totalFiles}: ${file.webkitRelativePath || file.name}`;
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
        
        showNotification(`${uploadedCount}/${totalFiles} fichier(s) envoyé(s) avec succès!`, 'success');
    }
    
    if (progressContainer) {
        progressContainer.classList.add('hidden');
    }
    if (progressFill) progressFill.style.width = '0%';
    
    // Réinitialiser input
    document.getElementById('fileInput').value = '';
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
        
        xhr.open('POST', `${API_URL}/api/upload`);
        xhr.send(formData);
    });
}

// Upload de fichier (single - pour fichiers individuels seulement)
async function uploadFile(file, progressCallback) {
    return new Promise((resolve, reject) => {
        const formData = new FormData();
        formData.append('files', file);
        formData.append('deviceId', deviceId);
        formData.append('targetDevice', 'all');
        formData.append('isFolder', 'false');
        
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
        
        xhr.open('POST', `${API_URL}/api/upload`);
        xhr.send(formData);
    });
}

// Charger les fichiers
async function loadFiles() {
    try {
        const response = await fetch(`${API_URL}/api/files?deviceId=${deviceId}`);
        const data = await response.json();
        
        const filesList = document.getElementById('filesList');
        
        if (data.files.length === 0) {
            filesList.innerHTML = '<p class="empty-state">Aucun fichier disponible</p>';
            return;
        }

        filesList.innerHTML = data.files.map(file => `
            <div class="file-item">
                <div class="file-info">
                    <div class="file-icon">${getFileIcon(file.mimetype)}</div>
                    <div class="file-details">
                        <h3>${file.filename}</h3>
                        <div class="file-meta">
                            ${formatFileSize(file.size)} • ${formatDate(file.uploadedAt)}
                        </div>
                    </div>
                </div>
                <div class="file-actions">
                    <button class="btn btn-primary" onclick="downloadFile('${file.id}', '${file.filename}')">
                        Télécharger
                    </button>
                    ${file.uploadedBy === deviceId ? `
                        <button class="btn btn-danger" onclick="deleteFile('${file.id}')">
                            Supprimer
                        </button>
                    ` : ''}
                </div>
            </div>
        `).join('');
    } catch (error) {
        console.error('Erreur chargement fichiers:', error);
    }
}

// Télécharger un fichier
async function downloadFile(fileId, filename) {
    try {
        window.location.href = `${API_URL}/api/download/${fileId}`;
        showNotification('Téléchargement démarré', 'success');
    } catch (error) {
        console.error('Erreur téléchargement:', error);
        showNotification('Erreur lors du téléchargement', 'error');
    }
}

// Supprimer un fichier
async function deleteFile(fileId) {
    if (!confirm('Voulez-vous vraiment supprimer ce fichier?')) {
        return;
    }

    try {
        const response = await fetch(`${API_URL}/api/files/${fileId}`, {
            method: 'DELETE'
        });
        
        if (response.ok) {
            showNotification('Fichier supprimé', 'success');
            loadFiles();
        } else {
            showNotification('Erreur lors de la suppression', 'error');
        }
    } catch (error) {
        console.error('Erreur suppression:', error);
        showNotification('Erreur lors de la suppression', 'error');
    }
}

// Charger les appareils
async function loadDevices() {
    try {
        const response = await fetch(`${API_URL}/api/devices`);
        const data = await response.json();
        
        const devicesList = document.getElementById('devicesList');
        
        if (data.devices.length === 0) {
            devicesList.innerHTML = '<p class="empty-state">Aucun appareil connecté</p>';
            return;
        }

        devicesList.innerHTML = data.devices.map(device => `
            <div class="device-item">
                <div class="device-icon">${device.deviceType === 'mobile' ? '📱' : '💻'}</div>
                <div class="device-details">
                    <h3>${device.deviceName} ${device.deviceId === deviceId ? '(Vous)' : ''}</h3>
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
    if (mimetype.includes('text')) return '📝';
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

function showNotification(message, type = 'success') {
    const notification = document.getElementById('notification');
    notification.textContent = message;
    notification.className = `notification ${type}`;
    notification.classList.remove('hidden');
    
    setTimeout(() => {
        notification.classList.add('hidden');
    }, 3000);
}
