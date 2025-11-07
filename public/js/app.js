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

    if (!fileInput || !uploadArea) {
        console.error('Éléments d\'upload non trouvés');
        return;
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
        const files = e.dataTransfer.files;
        if (files.length > 0) {
            uploadFile(files[0]);
        }
    });
}

// Sélection de fichier
function handleFileSelect(e) {
    const file = e.target.files[0];
    if (file) {
        uploadFile(file);
    }
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

    progressContainer.classList.remove('hidden');
    progressFill.style.width = '0%';

    try {
        const xhr = new XMLHttpRequest();

        xhr.upload.addEventListener('progress', (e) => {
            if (e.lengthComputable) {
                const percent = (e.loaded / e.total) * 100;
                progressFill.style.width = percent + '%';
                progressText.textContent = `Upload: ${Math.round(percent)}%`;
            }
        });

        xhr.addEventListener('load', () => {
            if (xhr.status === 200) {
                const response = JSON.parse(xhr.responseText);
                showNotification('Fichier envoyé avec succès!', 'success');
                loadFiles();
                document.getElementById('fileInput').value = '';
            } else {
                showNotification('Erreur lors de l\'envoi', 'error');
            }
            progressContainer.classList.add('hidden');
        });

        xhr.addEventListener('error', () => {
            showNotification('Erreur lors de l\'envoi', 'error');
            progressContainer.classList.add('hidden');
        });

        xhr.open('POST', `${API_URL}/api/upload`);
        xhr.send(formData);
    } catch (error) {
        console.error('Erreur upload:', error);
        showNotification('Erreur lors de l\'envoi', 'error');
        progressContainer.classList.add('hidden');
    }
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

// QR Code Scanner
let qrStream = null;

document.getElementById('qrScanBtn')?.addEventListener('click', openQrScanner);
document.getElementById('closeQrScanner')?.addEventListener('click', closeQrScanner);

async function openQrScanner() {
    const modal = document.getElementById('qrScannerModal');
    const video = document.getElementById('qrVideo');
    const canvas = document.getElementById('qrCanvas');
    const status = document.getElementById('qrStatus');
    
    modal.classList.remove('hidden');
    modal.style.display = 'flex';
    
    try {
        // Demander l'accès à la caméra
        qrStream = await navigator.mediaDevices.getUserMedia({ 
            video: { facingMode: 'environment' } 
        });
        
        video.srcObject = qrStream;
        video.style.display = 'block';
        canvas.style.display = 'none';
        status.textContent = 'Pointez vers le QR Code...';
        
        await video.play();
        
        // Scanner le QR code
        scanQrCode(video, canvas);
    } catch (error) {
        console.error('Erreur caméra:', error);
        status.textContent = 'Impossible d\'accéder à la caméra';
        status.style.color = '#dc2626';
    }
}

function closeQrScanner() {
    const modal = document.getElementById('qrScannerModal');
    const video = document.getElementById('qrVideo');
    
    if (qrStream) {
        qrStream.getTracks().forEach(track => track.stop());
        qrStream = null;
    }
    
    video.srcObject = null;
    modal.classList.add('hidden');
    modal.style.display = 'none';
}

function scanQrCode(video, canvas) {
    const ctx = canvas.getContext('2d');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    const scan = () => {
        if (!qrStream) return;
        
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        
        // Détecter QR code (implémentation simplifiée)
        const qrCode = detectQrCode(imageData);
        
        if (qrCode) {
            // QR Code détecté !
            handleQrCodeDetected(qrCode);
        } else {
            requestAnimationFrame(scan);
        }
    };
    
    requestAnimationFrame(scan);
}

function detectQrCode(imageData) {
    // Implémentation simplifiée : chercher des patterns de QR
    // Dans une vraie app, utiliser jsQR ou une bibliothèque similaire
    // Pour l'instant, retournons null (pas de détection)
    // TODO: Intégrer jsQR
    return null;
}

function handleQrCodeDetected(url) {
    closeQrScanner();
    
    // Vérifier que l'URL est valide
    try {
        new URL(url);
        
        // Mettre à jour l'API_URL
        if (confirm(`Se connecter à ce serveur ?\n${url}`)) {
            window.location.href = url;
        }
    } catch (error) {
        showNotification('QR Code invalide', 'error');
    }
}
