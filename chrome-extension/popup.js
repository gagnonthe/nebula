// Variables globales
let serverUrl = '';
let deviceId = '';
let deviceName = 'Chrome Extension';
let isConfigured = false;

// Configurer PDF.js avec le worker local
if (typeof pdfjsLib !== 'undefined') {
    pdfjsLib.GlobalWorkerOptions.workerSrc = chrome.runtime.getURL('lib/pdf.worker.min.js');
}

// Initialisation
document.addEventListener('DOMContentLoaded', async () => {
    await loadConfig();
    setupEventListeners();
    setupClipboard(); // Support presse-papiers
    
    if (isConfigured) {
        showMainInterface();
        await registerDevice();
        await loadFiles();
        await loadDevices();
        await loadNotesLinks();
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
    
    // Gestion du modal de partage
    const closeShareBtn = document.getElementById('closeShareLinkModal');
    if (closeShareBtn) {
        closeShareBtn.addEventListener('click', closeShareModal);
    }
    
    const shareLinkModal = document.getElementById('shareLinkModal');
    if (shareLinkModal) {
        shareLinkModal.addEventListener('click', (e) => {
            if (e.target === shareLinkModal) {
                closeShareModal();
            }
        });
    }
    
    // Gestion de la touche ESC pour fermer les modals
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            // Vérifier quel modal est ouvert et le fermer
            const previewModal = document.getElementById('previewModal');
            const qrModal = document.getElementById('qrModal');
            const shareLinkModal = document.getElementById('shareLinkModal');
            
            if (previewModal && !previewModal.classList.contains('hidden')) {
                closePreview();
            } else if (qrModal && !qrModal.classList.contains('hidden')) {
                closeQRCodeModal();
            } else if (shareLinkModal && !shareLinkModal.classList.contains('hidden')) {
                closeShareModal();
            }
        }
    });
    
    // Gestion du modal de prévisualisation
    const closePreviewBtn = document.getElementById('closePreviewBtn');
    if (closePreviewBtn) {
        closePreviewBtn.addEventListener('click', closePreview);
    }
    
    const closePreviewFooterBtn = document.getElementById('closePreviewFooterBtn');
    if (closePreviewFooterBtn) {
        closePreviewFooterBtn.addEventListener('click', closePreview);
    }
    
    const previewModal = document.getElementById('previewModal');
    if (previewModal) {
        previewModal.addEventListener('click', (e) => {
            if (e.target === previewModal) {
                closePreview();
            }
        });
    }
    
    // Gestion du bouton de copie du lien de partage
    const copyShareUrlBtn = document.getElementById('copyShareUrlBtn');
    if (copyShareUrlBtn) {
        copyShareUrlBtn.addEventListener('click', copyShareUrl);
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
    const isPrivateCheckbox = document.getElementById('isPrivateCheckbox');
    const accessCodeContainer = document.getElementById('accessCodeContainer');
    
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
    
    // Gestion de la checkbox fichier privé
    if (isPrivateCheckbox && accessCodeContainer) {
        isPrivateCheckbox.addEventListener('change', (e) => {
            if (e.target.checked) {
                accessCodeContainer.classList.remove('hidden');
            } else {
                accessCodeContainer.classList.add('hidden');
            }
        });
    }
    
    // Setup drag and drop
    setupDragAndDrop();
}

// Support du drag & drop
function setupDragAndDrop() {
    const uploadArea = document.querySelector('.upload-area');
    if (!uploadArea) return;
    
    const fileInput = document.getElementById('fileInput');
    
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        uploadArea.addEventListener(eventName, preventDefaults, false);
    });
    
    function preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }
    
    ['dragenter', 'dragover'].forEach(eventName => {
        uploadArea.addEventListener(eventName, () => {
            uploadArea.style.borderColor = '#FF1493';
            uploadArea.style.backgroundColor = '#fff5f9';
        });
    });
    
    ['dragleave', 'drop'].forEach(eventName => {
        uploadArea.addEventListener(eventName, () => {
            uploadArea.style.borderColor = '#d1d5db';
            uploadArea.style.backgroundColor = '';
        });
    });
    
    uploadArea.addEventListener('drop', (e) => {
        const dt = e.dataTransfer;
        const files = dt.files;
        
        if (files.length > 0) {
            const dataTransfer = new DataTransfer();
            Array.from(files).forEach(file => dataTransfer.items.add(file));
            
            if (fileInput) {
                fileInput.files = dataTransfer.files;
                handleFileSelect({ target: fileInput });
            }
        }
    });
}

// Support du presse-papiers (Ctrl+V)
function setupClipboard() {
    document.addEventListener('paste', async (e) => {
        const items = e.clipboardData?.items;
        if (!items || !isConfigured) return;
        
        const clipboardFiles = [];
        for (let i = 0; i < items.length; i++) {
            if (items[i].kind === 'file') {
                const file = items[i].getAsFile();
                if (file) {
                    clipboardFiles.push(file);
                }
            }
        }
        
        if (clipboardFiles.length > 0) {
            console.log(`📋 ${clipboardFiles.length} fichier(s) collé(s) depuis le presse-papiers`);
            
            // Convertir en tableau pour handleFileSelect
            const dataTransfer = new DataTransfer();
            clipboardFiles.forEach(f => dataTransfer.items.add(f));
            
            // Simuler la sélection de fichiers
            const fileInput = document.getElementById('fileInput');
            if (fileInput) {
                fileInput.files = dataTransfer.files;
                handleFileSelect({ target: fileInput });
            }
            
            // Notification
            try {
                await chrome.notifications.create({
                    type: 'basic',
                    iconUrl: chrome.runtime.getURL('icons/icon48.png'),
                    title: 'Nebula - Presse-papiers',
                    message: `📋 ${clipboardFiles.length} fichier(s) collé(s) - Prêt à envoyer`
                });
            } catch (err) {
                console.log('Notification error:', err);
            }
        }
    });
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
    const notesSection = document.getElementById('notesSection');
    const devicesSection = document.getElementById('devicesSection');
    
    if (configSection) configSection.classList.remove('hidden');
    if (uploadSection) uploadSection.classList.add('hidden');
    if (filesSection) filesSection.classList.add('hidden');
    if (notesSection) notesSection.classList.add('hidden');
    if (devicesSection) devicesSection.classList.add('hidden');
}

// Afficher l'interface principale
function showMainInterface() {
    const configSection = document.getElementById('configSection');
    const uploadSection = document.getElementById('uploadSection');
    const filesSection = document.getElementById('filesSection');
    const notesSection = document.getElementById('notesSection');
    const devicesSection = document.getElementById('devicesSection');
    
    if (configSection) configSection.classList.add('hidden');
    if (uploadSection) uploadSection.classList.remove('hidden');
    if (filesSection) filesSection.classList.remove('hidden');
    if (notesSection) notesSection.classList.remove('hidden');
    if (devicesSection) devicesSection.classList.remove('hidden');
    
    // Setup notes & links import
    setupTextLinkImport();
}

// Configuration import texte & lien
function setupTextLinkImport() {
    const sendTextBtn = document.getElementById('sendTextBtn');
    const clearTextBtn = document.getElementById('clearTextBtn');
    const sendLinkBtn = document.getElementById('sendLinkBtn');
    const pasteLinkBtn = document.getElementById('pasteLinkBtn');

    if (sendTextBtn) {
        sendTextBtn.addEventListener('click', async () => {
            const input = document.getElementById('importTextInput');
            const content = input.value.trim();
            if (!content) {
                alert('Veuillez saisir un texte');
                return;
            }
            try {
                const res = await fetch(`${serverUrl}/api/text`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ content, deviceId })
                });
                if (!res.ok) throw new Error();
                input.value = '';
                await loadNotesLinks();
                
                chrome.notifications.create({
                    type: 'basic',
                    iconUrl: chrome.runtime.getURL('icons/icon48.png'),
                    title: 'Nebula',
                    message: '📝 Texte importé'
                }).catch(err => console.log('Notification error:', err));
            } catch (e) {
                alert('Erreur lors de l\'import du texte');
            }
        });
    }

    if (clearTextBtn) {
        clearTextBtn.addEventListener('click', () => {
            const input = document.getElementById('importTextInput');
            input.value = '';
        });
    }

    if (sendLinkBtn) {
        sendLinkBtn.addEventListener('click', async () => {
            const input = document.getElementById('importLinkInput');
            const url = input.value.trim();
            if (!url) {
                alert('Veuillez saisir une URL');
                return;
            }
            try {
                const res = await fetch(`${serverUrl}/api/link`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ url, deviceId })
                });
                if (!res.ok) throw new Error();
                input.value = '';
                await loadNotesLinks();
                
                chrome.notifications.create({
                    type: 'basic',
                    iconUrl: chrome.runtime.getURL('icons/icon48.png'),
                    title: 'Nebula',
                    message: '🔗 Lien importé'
                }).catch(err => console.log('Notification error:', err));
            } catch (e) {
                alert('Erreur lors de l\'import du lien');
            }
        });
    }

    if (pasteLinkBtn) {
        pasteLinkBtn.addEventListener('click', async () => {
            try {
                const text = await navigator.clipboard.readText();
                document.getElementById('importLinkInput').value = text;
            } catch (e) {
                alert('Impossible d\'accéder au presse-papiers');
            }
        });
    }
}

// Charger les notes et liens
async function loadNotesLinks() {
    try {
        const [textsRes, linksRes] = await Promise.all([
            fetch(`${serverUrl}/api/texts`),
            fetch(`${serverUrl}/api/links`)
        ]);
        
        const textsData = await textsRes.json();
        const linksData = await linksRes.json();
        
        const notesList = document.getElementById('notesLinksList');
        
        const texts = textsData.texts || [];
        const links = linksData.links || [];
        
        if (texts.length === 0 && links.length === 0) {
            notesList.innerHTML = '<p class="empty-state">Aucun contenu</p>';
            return;
        }
        
        let html = '';
        
        // Afficher les textes
        texts.forEach(text => {
            html += `
                <div class="file-item" style="margin-bottom: 0.5rem;">
                    <div class="file-name">📝 Note</div>
                    <div style="font-size: 0.75rem; color: #6b7280; margin: 0.25rem 0; max-height: 60px; overflow: hidden; text-overflow: ellipsis;">
                        ${escapeHtml(text.content.substring(0, 100))}${text.content.length > 100 ? '...' : ''}
                    </div>
                    <div class="file-meta">${formatDate(text.createdAt)}</div>
                    <div class="file-actions" style="margin-top: 0.5rem;">
                        <button class="btn btn-secondary" onclick="copyNote('${text.id}')">📋 Copier</button>
                        <button class="btn btn-danger" onclick="deleteNote('${text.id}')">🗑️</button>
                    </div>
                </div>
            `;
        });
        
        // Afficher les liens
        links.forEach(link => {
            html += `
                <div class="file-item" style="margin-bottom: 0.5rem;">
                    <div class="file-name">🔗 Lien</div>
                    <a href="${link.url}" target="_blank" style="font-size: 0.75rem; color: #3b82f6; text-decoration: none; word-break: break-all; display: block; margin: 0.25rem 0;">
                        ${escapeHtml(link.url)}
                    </a>
                    <div class="file-meta">${formatDate(link.createdAt)}</div>
                    <div class="file-actions" style="margin-top: 0.5rem;">
                        <button class="btn btn-secondary" onclick="copyLink('${link.id}', '${link.url}')">📋 Copier</button>
                        <button class="btn btn-danger" onclick="deleteLink('${link.id}')">🗑️</button>
                    </div>
                </div>
            `;
        });
        
        notesList.innerHTML = html;
    } catch (error) {
        console.error('Erreur chargement notes/liens:', error);
    }
}

// Actions sur notes
async function copyNote(id) {
    try {
        const res = await fetch(`${serverUrl}/api/texts`);
        const data = await res.json();
        const note = (data.texts || []).find(n => n.id === id);
        if (!note) return;
        await navigator.clipboard.writeText(note.content);
        
        chrome.notifications.create({
            type: 'basic',
            iconUrl: chrome.runtime.getURL('icons/icon48.png'),
            title: 'Nebula',
            message: '📋 Texte copié !'
        }).catch(err => console.log('Notification error:', err));
    } catch (e) {
        alert('Impossible de copier');
    }
}

async function deleteNote(id) {
    if (!confirm('Supprimer cette note ?')) return;
    try {
        await fetch(`${serverUrl}/api/texts/${id}`, { method: 'DELETE' });
        await loadNotesLinks();
    } catch (e) {
        alert('Erreur lors de la suppression');
    }
}

// Actions sur liens
async function copyLink(id, url) {
    try {
        await navigator.clipboard.writeText(url);
        
        chrome.notifications.create({
            type: 'basic',
            iconUrl: chrome.runtime.getURL('icons/icon48.png'),
            title: 'Nebula',
            message: '📋 Lien copié !'
        }).catch(err => console.log('Notification error:', err));
    } catch (e) {
        alert('Impossible de copier');
    }
}

async function deleteLink(id) {
    if (!confirm('Supprimer ce lien ?')) return;
    try {
        await fetch(`${serverUrl}/api/links/${id}`, { method: 'DELETE' });
        await loadNotesLinks();
    } catch (e) {
        alert('Erreur lors de la suppression');
    }
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
        
        // Ajouter les paramètres de confidentialité
        const isPrivateCheckbox = document.getElementById('isPrivateCheckbox');
        const customAccessCodeInput = document.getElementById('customAccessCode');
        if (isPrivateCheckbox && isPrivateCheckbox.checked) {
            formData.append('isPrivate', 'true');
            if (customAccessCodeInput && customAccessCodeInput.value.trim()) {
                formData.append('accessCode', customAccessCodeInput.value.trim());
            }
        }
        
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
        
        // Ajouter les paramètres de confidentialité
        const isPrivateCheckbox = document.getElementById('isPrivateCheckbox');
        const customAccessCodeInput = document.getElementById('customAccessCode');
        if (isPrivateCheckbox && isPrivateCheckbox.checked) {
            formData.append('isPrivate', 'true');
            if (customAccessCodeInput && customAccessCodeInput.value.trim()) {
                formData.append('accessCode', customAccessCodeInput.value.trim());
            }
        }
        
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
                    ${file.isPrivate ? ' • 🔒 Privé' : ''}
                </div>
                <div class="file-actions">
                    <button class="btn btn-secondary btn-preview" data-preview-id="${file.id}" data-filename="${file.filename}" data-mimetype="${file.mimetype}" data-private="${file.isPrivate || false}">
                        👁️ Aperçu
                    </button>
                    <button class="btn btn-primary" data-file-id="${file.id}" data-filename="${file.filename}" data-access-code="${file.accessCode || ''}">
                        Télécharger
                    </button>
                    <button class="btn btn-secondary" data-share-id="${file.id}" data-share-filename="${file.filename}">
                        🔗 Partager
                    </button>
                    ${file.uploadedBy === deviceId ? `
                        <button class="btn btn-danger" data-delete-id="${file.id}">
                            Supprimer
                        </button>
                    ` : ''}
                </div>
            </div>
        `).join('');
        
        // Ajouter les événements pour l'aperçu
        filesList.querySelectorAll('[data-preview-id]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const fileId = e.target.dataset.previewId;
                const filename = e.target.dataset.filename;
                const mimetype = e.target.dataset.mimetype;
                const isPrivate = e.target.dataset.private === 'true';
                
                if (isPrivate) {
                    const code = prompt('Ce fichier est privé. Entrez le code d\'accès:');
                    if (code) {
                        previewFile(fileId, filename, mimetype, code);
                    }
                } else {
                    previewFile(fileId, filename, mimetype);
                }
            });
        });
        
        // Ajouter les événements pour le téléchargement
        filesList.querySelectorAll('[data-file-id]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const fileId = e.target.dataset.fileId;
                const filename = e.target.dataset.filename;
                const accessCode = e.target.dataset.accessCode;
                downloadFile(fileId, filename, accessCode);
            });
        });
        
        // Ajouter les événements pour le partage
        filesList.querySelectorAll('[data-share-id]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const fileId = e.target.dataset.shareId;
                const filename = e.target.dataset.shareFilename;
                openShareModal(fileId, filename);
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
function downloadFile(fileId, filename, accessCode) {
    let url = `${serverUrl}/api/download/${fileId}`;
    if (accessCode) {
        url += `?code=${accessCode}`;
    }
    
    chrome.downloads.download({
        url: url,
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

// ======= Fonctions de prévisualisation =======

// Variables globales pour le visionnage PDF
window.currentPDFDoc = null;
window.currentPDFPage = 1;

// Aperçu des fichiers
async function previewFile(fileId, filename, mimetype, accessCode = null) {
    const modal = document.getElementById('previewModal');
    const previewTitle = document.getElementById('previewTitle');
    const previewContent = document.getElementById('previewContent');
    
    previewTitle.textContent = `Aperçu : ${filename}`;
    previewContent.innerHTML = '<p style="text-align: center; color: #6b7280; padding: 2rem;">Chargement...</p>';
    modal.classList.remove('hidden');
    
    try {
        // Déterminer le type et charger le contenu approprié
        const isImage = /image\/(jpg|jpeg|png|gif|webp|svg)/.test(mimetype);
        const isText = /text\/|json|xml|markdown/.test(mimetype) || filename.match(/\.(txt|md|json|xml|csv)$/i);
        const isPDF = mimetype === 'application/pdf' || filename.endsWith('.pdf');
        const isAudio = /audio\//.test(mimetype);
        const isVideo = /video\//.test(mimetype);
        
        if (isImage) {
            // Aperçu image
            let downloadUrl = `${serverUrl}/api/download/${fileId}`;
            if (accessCode) downloadUrl += `?code=${accessCode}`;
            
            previewContent.innerHTML = `
                <div style="text-align: center; padding: 1rem;">
                    <img src="${downloadUrl}" alt="Aperçu de ${filename}" style="max-width: 100%; max-height: 300px; border-radius: 0.375rem; object-fit: contain;">
                </div>
            `;
        } else if (isText) {
            // Aperçu texte
            let downloadUrl = `${serverUrl}/api/download/${fileId}`;
            if (accessCode) downloadUrl += `?code=${accessCode}`;
            
            const response = await fetch(downloadUrl);
            const text = await response.text();
            const preview = text.length > 3000 ? text.substring(0, 3000) + '\n\n... (fichier tronqué)' : text;
            
            previewContent.innerHTML = `
                <pre style="background: #f3f4f6; padding: 0.75rem; border-radius: 0.375rem; overflow-x: auto; font-size: 0.75rem; max-height: 300px; overflow-y: auto; white-space: pre-wrap; word-wrap: break-word;">${escapeHtml(preview)}</pre>
            `;
        } else if (isPDF) {
            // Aperçu PDF avec PDF.js
            if (typeof pdfjsLib === 'undefined') {
                previewContent.innerHTML = `
                    <div style="text-align: center; padding: 2rem; color: #dc2626;">
                        <p>❌ PDF.js non chargé</p>
                        <button onclick="window.open('${serverUrl}/api/download/${fileId}${accessCode ? '?code=' + accessCode : ''}', '_blank')" style="background: #3b82f6; color: white; padding: 0.625rem 1rem; border: none; border-radius: 0.375rem; cursor: pointer; margin-top: 1rem; font-size: 0.875rem;">
                            Ouvrir dans un nouvel onglet
                        </button>
                    </div>
                `;
            } else {
                // Initialiser le visionnage PDF
                let downloadUrl = `${serverUrl}/api/download/${fileId}`;
                if (accessCode) downloadUrl += `?code=${accessCode}`;
                
                previewContent.innerHTML = `
                    <div id="pdfViewer" style="background: #f3f4f6; border-radius: 0.375rem; min-height: 300px;">
                        <div style="height: 300px; display: flex; align-items: center; justify-content: center;">
                            <p style="color: #6b7280;">Chargement du PDF...</p>
                        </div>
                    </div>
                    <div style="margin-top: 0.75rem; display: flex; gap: 0.5rem; justify-content: center; align-items: center;">
                        <button id="pdfPrevBtn" onclick="previousPDFPage()" style="padding: 0.375rem 0.75rem; background: #e5e7eb; border: none; border-radius: 0.375rem; cursor: pointer; font-size: 0.813rem;">← Préc.</button>
                        <span id="pdfPageInfo" style="font-size: 0.813rem; color: #6b7280; min-width: 100px; text-align: center;">Page 1</span>
                        <button id="pdfNextBtn" onclick="nextPDFPage()" style="padding: 0.375rem 0.75rem; background: #e5e7eb; border: none; border-radius: 0.375rem; cursor: pointer; font-size: 0.813rem;">Suiv. →</button>
                    </div>
                `;
                
                // Charger le PDF
                await loadAndDisplayPDF(downloadUrl);
            }
        } else if (isAudio || isVideo) {
            // Lecteur média
            const tag = isAudio ? 'audio' : 'video';
            const controls = 'controls';
            let downloadUrl = `${serverUrl}/api/download/${fileId}`;
            if (accessCode) downloadUrl += `?code=${accessCode}`;
            
            previewContent.innerHTML = `
                <${tag} ${controls} style="width: 100%; max-height: 300px; border-radius: 0.375rem;">
                    <source src="${downloadUrl}" type="${mimetype}">
                    Votre navigateur ne supporte pas ce format média.
                </${tag}>
            `;
        } else {
            // Type non géré
            previewContent.innerHTML = `
                <div style="text-align: center; padding: 2rem;">
                    <p style="color: #6b7280; margin-bottom: 0.5rem;">📦 Aperçu non disponible</p>
                    <p style="font-size: 0.813rem; color: #9ca3af; margin-bottom: 1rem;">Type: ${mimetype || 'inconnu'}</p>
                    <button onclick="downloadFile('${fileId}', '${filename}', ${accessCode ? `'${accessCode}'` : 'null'})" style="background: #3b82f6; color: white; padding: 0.625rem 1rem; border: none; border-radius: 0.375rem; cursor: pointer; font-size: 0.875rem;">
                        Télécharger le fichier
                    </button>
                </div>
            `;
        }
    } catch (error) {
        console.error('Erreur aperçu:', error);
        previewContent.innerHTML = `
            <div style="text-align: center; padding: 2rem; color: #dc2626;">
                <p>❌ Erreur lors du chargement</p>
                <p style="font-size: 0.813rem; margin-top: 0.5rem;">${error.message}</p>
            </div>
        `;
    }
}

// Fermer le modal de prévisualisation
function closePreview() {
    const modal = document.getElementById('previewModal');
    modal.classList.add('hidden');
    // Nettoyer le PDF chargé
    window.currentPDFDoc = null;
    window.currentPDFPage = 1;
}

// Charger et afficher un PDF
async function loadAndDisplayPDF(pdfUrl) {
    try {
        const pdf = await pdfjsLib.getDocument(pdfUrl).promise;
        window.currentPDFDoc = pdf;
        window.currentPDFPage = 1;
        
        // Afficher la première page
        await renderPDFPage(1);
        
        // Mettre à jour les contrôles
        updatePDFControls();
    } catch (error) {
        console.error('Erreur chargement PDF:', error);
        const previewContent = document.getElementById('previewContent');
        previewContent.innerHTML = `
            <div style="text-align: center; padding: 2rem; color: #dc2626;">
                <p>❌ Erreur lors du chargement du PDF</p>
                <p style="font-size: 0.813rem; margin-top: 0.5rem;">${error.message}</p>
            </div>
        `;
    }
}

// Afficher une page PDF
async function renderPDFPage(pageNum) {
    if (!window.currentPDFDoc || pageNum < 1 || pageNum > window.currentPDFDoc.numPages) {
        return;
    }
    
    try {
        const page = await window.currentPDFDoc.getPage(pageNum);
        const viewport = page.getViewport({ scale: 1.2 });
        
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        canvas.style.maxWidth = '100%';
        canvas.style.borderRadius = '0.375rem';
        canvas.style.display = 'block';
        canvas.style.margin = '0 auto';
        
        await page.render({ canvasContext: context, viewport }).promise;
        
        const pdfViewer = document.getElementById('pdfViewer');
        pdfViewer.innerHTML = '';
        pdfViewer.appendChild(canvas);
        
        window.currentPDFPage = pageNum;
        updatePDFControls();
    } catch (error) {
        console.error('Erreur rendu page:', error);
    }
}

// Mettre à jour les contrôles de navigation PDF
function updatePDFControls() {
    if (!window.currentPDFDoc) return;
    
    const pageInfo = document.getElementById('pdfPageInfo');
    const prevBtn = document.getElementById('pdfPrevBtn');
    const nextBtn = document.getElementById('pdfNextBtn');
    
    if (pageInfo) pageInfo.textContent = `Page ${window.currentPDFPage} / ${window.currentPDFDoc.numPages}`;
    if (prevBtn) prevBtn.disabled = window.currentPDFPage <= 1;
    if (nextBtn) nextBtn.disabled = window.currentPDFPage >= window.currentPDFDoc.numPages;
}

// Navigation PDF - Page précédente
function previousPDFPage() {
    if (window.currentPDFPage > 1) {
        renderPDFPage(window.currentPDFPage - 1);
    }
}

// Navigation PDF - Page suivante
function nextPDFPage() {
    if (window.currentPDFDoc && window.currentPDFPage < window.currentPDFDoc.numPages) {
        renderPDFPage(window.currentPDFPage + 1);
    }
}

// Échapper le HTML pour éviter les XSS
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// ======= Fonctions de partage =======

let currentShareFileId = null;

// Ouvrir le modal de partage
function openShareModal(fileId, filename) {
    currentShareFileId = fileId;
    const modal = document.getElementById('shareLinkModal');
    const shareResult = document.getElementById('shareResult');
    const shareQRCode = document.getElementById('shareQRCode');
    
    modal.classList.remove('hidden');
    shareResult.classList.add('hidden');
    shareQRCode.innerHTML = '';
    
    const generateBtn = document.getElementById('generateShareBtn');
    if (generateBtn) {
        generateBtn.onclick = () => generateShareLink(fileId, filename);
    }
}

// Fermer le modal de partage
function closeShareModal() {
    const modal = document.getElementById('shareLinkModal');
    modal.classList.add('hidden');
    currentShareFileId = null;
}

// Générer un lien de partage temporaire
async function generateShareLink(fileId, filename) {
    const expiration = document.getElementById('shareExpiration').value;
    const shareResult = document.getElementById('shareResult');
    const shareUrlInput = document.getElementById('shareUrl');
    const shareQRCode = document.getElementById('shareQRCode');
    
    try {
        const response = await fetch(`${serverUrl}/api/share/${fileId}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ expiration })
        });
        
        if (!response.ok) {
            throw new Error('Erreur génération du lien');
        }
        
        const data = await response.json();
        const shareUrl = `${serverUrl}/share/${data.shareToken}`;
        
        shareUrlInput.value = shareUrl;
        shareResult.classList.remove('hidden');
        
        // Générer le QR code
        shareQRCode.innerHTML = '';
        try {
            new QRCode(shareQRCode, {
                text: shareUrl,
                width: 150,
                height: 150,
                colorDark: '#111827',
                colorLight: '#ffffff',
                correctLevel: QRCode.CorrectLevel.H
            });
        } catch (err) {
            console.error('Erreur QR code:', err);
        }
        
        // Notification
        chrome.notifications.create({
            type: 'basic',
            iconUrl: chrome.runtime.getURL('icons/icon48.png'),
            title: 'Nebula - Lien de partage',
            message: `🔗 Lien créé pour "${filename}"`
        }).catch(err => console.log('Notification error:', err));
        
    } catch (error) {
        console.error('Erreur partage:', error);
        alert('Erreur lors de la génération du lien de partage');
    }
}

// Copier l'URL de partage
function copyShareUrl() {
    const shareUrlInput = document.getElementById('shareUrl');
    shareUrlInput.select();
    document.execCommand('copy');
    
    // Notification visuelle
    const btn = event.target;
    const originalText = btn.textContent;
    btn.textContent = '✓';
    btn.style.background = '#10b981';
    btn.style.color = 'white';
    
    setTimeout(() => {
        btn.textContent = originalText;
        btn.style.background = '';
        btn.style.color = '';
    }, 1500);
}

// Exposer les fonctions globalement
window.previewFile = previewFile;
window.closePreview = closePreview;
window.previousPDFPage = previousPDFPage;
window.nextPDFPage = nextPDFPage;
window.openShareModal = openShareModal;
window.closeShareModal = closeShareModal;
window.copyShareUrl = copyShareUrl;
window.copyNote = copyNote;
window.deleteNote = deleteNote;
window.copyLink = copyLink;
window.deleteLink = deleteLink;
