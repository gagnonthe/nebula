// Ensure the app initializes only once and avoid global redeclaration conflicts
;(function () {
    if (window.__NEBULA_APP_INIT__) {
        console.debug('Nebula app already initialized, skipping re-init');
        return;
    }
    window.__NEBULA_APP_INIT__ = true;

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

    // Charger notes & liens
    await loadResources();

    // Charger les appareils
    await loadDevices();

    // Configuration de l'upload
    setupUpload();

    // Configuration import texte & lien
    setupTextLinkImport();
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

    // Real-time for notes & links
    socket.on('text-added', () => loadResources());
    socket.on('link-added', () => loadResources());
    socket.on('text-deleted', () => loadResources());
    socket.on('link-deleted', () => loadResources());
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
        
        // Créer un tableau de chemins relatifs
        const relativePaths = [];
        
        // Ajouter tous les fichiers
        files.forEach((file, index) => {
            formData.append('files', file);
            relativePaths.push(file.webkitRelativePath || file.name);
        });
        
        // Ajouter les chemins en tant que JSON
        formData.append('relativePaths', JSON.stringify(relativePaths));
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
                        <button class="btn btn-success" onclick="generateShareLink('${file.id}')">
                            🔗 Partager
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

// Charger notes & liens
async function loadResources() {
    try {
        const [textsRes, linksRes] = await Promise.all([
            fetch(`${API_URL}/api/texts`),
            fetch(`${API_URL}/api/links`)
        ]);
        const textsData = await textsRes.json();
        const linksData = await linksRes.json();

        const list = document.getElementById('notesLinksList');
        if (!list) return; // page older version

        const items = [];
        (textsData.texts || []).forEach(n => items.push({
            type: 'text',
            id: n.id,
            title: n.title,
            size: n.size,
            uploadedAt: n.uploadedAt
        }));
        (linksData.links || []).forEach(l => items.push({
            type: 'link',
            id: l.id,
            title: l.title,
            url: l.url,
            uploadedAt: l.uploadedAt
        }));

        if (items.length === 0) {
            list.innerHTML = '<p class="empty-state">Aucun contenu</p>';
            return;
        }

        // Sort by uploadedAt desc
        items.sort((a, b) => new Date(b.uploadedAt) - new Date(a.uploadedAt));

        list.innerHTML = items.map(item => {
            const isText = item.type === 'text';
            const icon = isText ? '📝' : '🔗';
            const meta = isText ? `${formatFileSize(item.size)} • ${formatDate(item.uploadedAt)}` : `${item.url || ''}`;
            const actions = isText ? `
                <button class="btn btn-primary" onclick="shareText('${item.id}')">🔗 Partager</button>
                <button onclick="copyNote('${item.id}')">📋 Copier</button>
                <button class="btn btn-danger" onclick="deleteNote('${item.id}')">🗑️ Supprimer</button>
            ` : `
                <button class="btn btn-primary" onclick="shareLink('${item.id}')">🔗 Partager</button>
                <a href="${item.url}" target="_blank" rel="noopener">🌐 Ouvrir</a>
                <button class="btn btn-danger" onclick="deleteLink('${item.id}')">🗑️ Supprimer</button>
            `;
            return `
                <div class="file-item">
                    <div class="file-info">
                        <div class="file-icon">${icon}</div>
                        <div class="file-details">
                            <h3>${escapeHtml(item.title || (isText ? 'Note' : 'Lien'))}</h3>
                            <div class="file-meta">${escapeHtml(meta)}</div>
                        </div>
                    </div>
                    <div class="file-actions">${actions}</div>
                </div>
            `;
        }).join('');
    } catch (e) {
        console.error('Erreur chargement ressources:', e);
    }
}

// Config import texte & lien
function setupTextLinkImport() {
    const sendTextBtn = document.getElementById('sendTextBtn');
    const clearTextBtn = document.getElementById('clearTextBtn');
    const sendLinkBtn = document.getElementById('sendLinkBtn');
    const pasteLinkBtn = document.getElementById('pasteLinkBtn');

    sendTextBtn?.addEventListener('click', async () => {
        const input = document.getElementById('importTextInput');
        const content = input.value.trim();
        if (!content) return showNotification('Veuillez saisir un texte', 'error');
        try {
            const res = await fetch(`${API_URL}/api/text`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ content, deviceId })
            });
            if (!res.ok) throw new Error();
            input.value = '';
            showNotification('Texte importé', 'success');
            await loadResources();
        } catch (e) { showNotification('Erreur lors de l\'import du texte', 'error'); }
    });

    clearTextBtn?.addEventListener('click', () => {
        const input = document.getElementById('importTextInput');
        input.value = '';
    });

    sendLinkBtn?.addEventListener('click', async () => {
        const input = document.getElementById('importLinkInput');
        const url = input.value.trim();
        if (!url) return showNotification('Veuillez saisir une URL', 'error');
        try {
            const res = await fetch(`${API_URL}/api/link`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ url, deviceId })
            });
            if (!res.ok) throw new Error();
            input.value = '';
            showNotification('Lien importé', 'success');
            await loadResources();
        } catch (e) { showNotification('Erreur lors de l\'import du lien', 'error'); }
    });

    pasteLinkBtn?.addEventListener('click', async () => {
        try {
            const text = await navigator.clipboard.readText();
            document.getElementById('importLinkInput').value = text;
        } catch (e) { showNotification('Impossible d\'accéder au presse-papiers', 'error'); }
    });
}

// Actions sur notes & liens
async function deleteNote(id) {
    if (!confirm('Supprimer cette note ?')) return;
    await fetch(`${API_URL}/api/texts/${id}`, { method: 'DELETE' });
    await loadResources();
}

async function deleteLink(id) {
    if (!confirm('Supprimer ce lien ?')) return;
    await fetch(`${API_URL}/api/links/${id}`, { method: 'DELETE' });
    await loadResources();
}

async function copyNote(id) {
    try {
        const res = await fetch(`${API_URL}/api/texts`);
        const data = await res.json();
        const note = (data.texts || []).find(n => n.id === id);
        if (!note) return;
        await navigator.clipboard.writeText(note.content);
        showNotification('Texte copié !', 'success');
    } catch { showNotification('Impossible de copier', 'error'); }
}

// Share links for notes & links
async function shareText(id) {
    const expiration = document.getElementById('shareExpiration').value;
    try {
        const response = await fetch(`${API_URL}/api/share-text/${id}`, {
            method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ expiration })
        });
        const data = await response.json();
        const shareUrl = `${window.location.origin}/share/${data.shareId}`;
        document.getElementById('shareUrl').value = shareUrl;
        const qrContainer = document.getElementById('shareQRCode');
        qrContainer.innerHTML = '';
        new QRCode(qrContainer, { text: shareUrl, width: 200, height: 200, colorDark: '#111827', colorLight: '#ffffff', correctLevel: QRCode.CorrectLevel.H });
        document.getElementById('shareLinkModal').classList.remove('hidden');
    } catch { showNotification('Erreur lors de la génération du lien', 'error'); }
}

async function shareLink(id) {
    const expiration = document.getElementById('shareExpiration').value;
    try {
        const response = await fetch(`${API_URL}/api/share-link/${id}`, {
            method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ expiration })
        });
        const data = await response.json();
        const shareUrl = `${window.location.origin}/share/${data.shareId}`;
        document.getElementById('shareUrl').value = shareUrl;
        const qrContainer = document.getElementById('shareQRCode');
        qrContainer.innerHTML = '';
        new QRCode(qrContainer, { text: shareUrl, width: 200, height: 200, colorDark: '#111827', colorLight: '#ffffff', correctLevel: QRCode.CorrectLevel.H });
        document.getElementById('shareLinkModal').classList.remove('hidden');
    } catch { showNotification('Erreur lors de la génération du lien', 'error'); }
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

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text == null ? '' : String(text);
    return div.innerHTML;
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

    // Admin Panel Functions
    const ADMIN_PIN = '6956';

    // Admin access button
    document.getElementById('adminAccessBtn')?.addEventListener('click', () => {
        const modal = document.getElementById('pinModal');
        if (modal) modal.classList.remove('hidden');
    });

    // PIN modal close
    document.querySelectorAll('.modal-close').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const modal = e.target.closest('.modal');
            if (modal) modal.classList.add('hidden');
        });
    });

    // PIN form submit
    document.getElementById('pinForm')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const pin = document.getElementById('pinInput').value;
        const errorMsg = document.getElementById('pinError');
    
        if (pin === ADMIN_PIN) {
            document.getElementById('pinModal').classList.add('hidden');
            document.getElementById('adminPage').classList.remove('hidden');
            document.getElementById('pinInput').value = '';
            errorMsg.classList.add('hidden');
            await loadAdminData();
        } else {
            errorMsg.textContent = '❌ Code incorrect';
            errorMsg.classList.remove('hidden');
            document.getElementById('pinInput').value = '';
        }
    });

    // Close admin page
    document.getElementById('closeAdminBtn')?.addEventListener('click', () => {
        document.getElementById('adminPage').classList.add('hidden');
    });

    // Load admin data
    async function loadAdminData() {
        try {
            const response = await fetch(`${API_URL}/api/admin/stats`);
            const data = await response.json();
        
            // Update stats
            document.getElementById('statTotalFiles').textContent = data.totalFiles || 0;
            document.getElementById('statTotalSize').textContent = formatFileSize(data.totalSize || 0);
            document.getElementById('statDevices').textContent = data.totalDevices || 0;
            document.getElementById('statUploads').textContent = data.totalUploads || 0;
        
            // Load files list
            loadAdminFiles(data.files || []);
        
            // Load devices list
            loadAdminDevices(data.devices || []);
        } catch (error) {
            console.error('Error loading admin data:', error);
            showNotification('Erreur lors du chargement des données admin', 'error');
        }
    }

    // Load admin files list
    function loadAdminFiles(files) {
        const container = document.getElementById('adminFilesList');
        if (!files || files.length === 0) {
            container.innerHTML = '<p style="text-align: center; color: var(--gray-600);">Aucun fichier</p>';
            return;
        }
    
        container.innerHTML = files.map(file => `
            <div class="file-item">
                <div class="file-info">
                    <div class="file-icon">${getFileIcon(file.name)}</div>
                    <div>
                        <div class="file-name">${file.name}</div>
                        <div class="file-size">${formatFileSize(file.size)} • ${formatDate(file.uploadDate)}</div>
                    </div>
                </div>
                <div class="file-actions">
                    <button class="btn btn-sm btn-danger" onclick="deleteAdminFile('${file.id}')">
                        🗑️ Supprimer
                    </button>
                </div>
            </div>
        `).join('');
    }

    // Load admin devices list
    function loadAdminDevices(devices) {
        const container = document.getElementById('adminDevicesList');
        if (!devices || devices.length === 0) {
            container.innerHTML = '<p style="text-align: center; color: var(--gray-600);">Aucun appareil</p>';
            return;
        }
    
        container.innerHTML = devices.map(device => `
            <div class="file-item">
                <div class="file-info">
                    <div class="file-icon">${device.type === 'mobile' ? '📱' : '💻'}</div>
                    <div>
                        <div class="file-name">${device.name}</div>
                        <div class="file-size">ID: ${device.id}</div>
                    </div>
                </div>
            </div>
        `).join('');
    }

    // Delete file from admin
    async function deleteAdminFile(fileId) {
        if (!confirm('Êtes-vous sûr de vouloir supprimer ce fichier ?')) return;
    
        try {
            const response = await fetch(`${API_URL}/api/files/${fileId}`, {
                method: 'DELETE'
            });
        
            if (response.ok) {
                showNotification('Fichier supprimé', 'success');
                await loadAdminData();
            } else {
                throw new Error('Erreur lors de la suppression');
            }
        } catch (error) {
            console.error('Error deleting file:', error);
            showNotification('Erreur lors de la suppression', 'error');
        }
    }

    // Admin actions
    document.getElementById('deleteOldFilesBtn')?.addEventListener('click', async () => {
        if (!confirm('Supprimer les fichiers de plus de 7 jours ?')) return;
    
        try {
            const response = await fetch(`${API_URL}/api/admin/cleanup/old`, {
                method: 'POST'
            });
            const data = await response.json();
            showNotification(`${data.deleted || 0} fichiers supprimés`, 'success');
            await loadAdminData();
        } catch (error) {
            console.error('Error:', error);
            showNotification('Erreur lors de la suppression', 'error');
        }
    });

    document.getElementById('deleteAllFilesBtn')?.addEventListener('click', async () => {
        if (!confirm('⚠️ ATTENTION ! Supprimer TOUS les fichiers ? Cette action est irréversible !')) return;
        if (!confirm('Êtes-vous vraiment sûr ? Tous les fichiers seront définitivement supprimés !')) return;
    
        try {
            const response = await fetch(`${API_URL}/api/admin/cleanup/all`, {
                method: 'POST'
            });
            const data = await response.json();
            showNotification(`${data.deleted || 0} fichiers supprimés`, 'success');
            await loadAdminData();
        } catch (error) {
            console.error('Error:', error);
            showNotification('Erreur lors de la suppression', 'error');
        }
    });

    document.getElementById('exportStatsBtn')?.addEventListener('click', async () => {
        try {
            const response = await fetch(`${API_URL}/api/admin/stats`);
            const data = await response.json();
        
            const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `nebula-stats-${Date.now()}.json`;
            a.click();
            URL.revokeObjectURL(url);
            showNotification('Statistiques exportées', 'success');
        } catch (error) {
            console.error('Error:', error);
            showNotification('Erreur lors de l\'export', 'error');
        }
    });

    // Share Link Functions
    let currentShareFileId = null;

    // Generate share link (called from file item)
    async function generateShareLink(fileId) {
        currentShareFileId = fileId;
        const expiration = document.getElementById('shareExpiration').value;
    
        try {
            const response = await fetch(`${API_URL}/api/share/${fileId}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ expiration })
            });
        
            const data = await response.json();
            const shareUrl = `${window.location.origin}/share/${data.shareId}`;
        
            // Set URL in input
            document.getElementById('shareUrl').value = shareUrl;
            
            // Generate QR Code
            const qrContainer = document.getElementById('shareQRCode');
            qrContainer.innerHTML = ''; // Clear previous QR code
            new QRCode(qrContainer, {
                text: shareUrl,
                width: 200,
                height: 200,
                colorDark: '#111827',
                colorLight: '#ffffff',
                correctLevel: QRCode.CorrectLevel.H
            });
            
            // Show modal
            document.getElementById('shareLinkModal').classList.remove('hidden');
        } catch (error) {
            console.error('Error generating share link:', error);
            showNotification('Erreur lors de la génération du lien', 'error');
        }
    }

    // Copy share link
    document.getElementById('copyShareBtn')?.addEventListener('click', async () => {
        const input = document.getElementById('shareUrl');
        try {
            await navigator.clipboard.writeText(input.value);
            showNotification('Lien copié !', 'success');
        } catch (error) {
            // Fallback for older browsers
            input.select();
            document.execCommand('copy');
            showNotification('Lien copié !', 'success');
        }
    });

    // Regenerate share link with new expiration
    document.getElementById('shareExpiration')?.addEventListener('change', async () => {
        if (currentShareFileId) {
            await generateShareLink(currentShareFileId);
        }
    });

    // Close share link modal
    document.getElementById('closeShareLinkModal')?.addEventListener('click', () => {
        document.getElementById('shareLinkModal').classList.add('hidden');
        currentShareFileId = null;
    });

    // Make functions globally available
    window.generateShareLink = generateShareLink;
    window.deleteAdminFile = deleteAdminFile;
    window.shareText = shareText;
    window.shareLink = shareLink;
    window.deleteNote = deleteNote;
    window.deleteLink = deleteLink;
    window.copyNote = copyNote;
    window.downloadFile = downloadFile;
    window.deleteFile = deleteFile;

    })();
