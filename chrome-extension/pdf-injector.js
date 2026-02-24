// Content script pour injecter un bouton flottant sur les pages PDF
(function() {
  'use strict';
  
  // Vérifier si c'est une page PDF
  function isPDFPage() {
    const url = window.location.href.toLowerCase();
    return url.endsWith('.pdf') || 
           url.includes('.pdf?') || 
           url.includes('.pdf#') ||
           document.contentType === 'application/pdf';
  }
  
  // Injecter le bouton flottant
  function injectFloatingButton() {
    // Vérifier si déjà injecté
    if (document.getElementById('nebula-pdf-float-btn')) {
      return;
    }
    
    console.log('[Nebula] 🎉 Injection du bouton flottant PDF');
    
    // Créer le conteneur du bouton - style natif Chrome
    const btnContainer = document.createElement('div');
    btnContainer.id = 'nebula-pdf-float-btn';
    btnContainer.title = 'Partager sur Nebula';
    btnContainer.style.cssText = `
      position: fixed;
      bottom: 20px;
      right: 20px;
      z-index: 999999;
      width: 40px;
      height: 40px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: rgba(241, 243, 244, 0.95);
      border-radius: 50%;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.12), 0 1px 2px rgba(0, 0, 0, 0.24);
      cursor: pointer;
      transition: all 0.2s ease;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    `;
    
    // Icône SVG - style Chrome (cloud upload)
    const icon = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    icon.setAttribute('width', '20');
    icon.setAttribute('height', '20');
    icon.setAttribute('viewBox', '0 0 24 24');
    icon.setAttribute('fill', 'none');
    icon.setAttribute('stroke', '#5F6368');
    icon.setAttribute('stroke-width', '2');
    icon.setAttribute('stroke-linecap', 'round');
    icon.setAttribute('stroke-linejoin', 'round');
    icon.innerHTML = `
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
      <polyline points="17 8 12 3 7 8"></polyline>
      <line x1="12" y1="3" x2="12" y2="15"></line>
    `;
    
    // Assembler (icône uniquement)
    btnContainer.appendChild(icon);
    
    // Effets hover - style natif Chrome
    btnContainer.addEventListener('mouseenter', () => {
      btnContainer.style.background = 'rgba(232, 234, 237, 1)';
      btnContainer.style.boxShadow = '0 2px 4px rgba(0, 0, 0, 0.16), 0 2px 4px rgba(0, 0, 0, 0.23)';
    });
    
    btnContainer.addEventListener('mouseleave', () => {
      btnContainer.style.background = 'rgba(241, 243, 244, 0.95)';
      btnContainer.style.boxShadow = '0 1px 3px rgba(0, 0, 0, 0.12), 0 1px 2px rgba(0, 0, 0, 0.24)';
    });
    
    // Action au clic
    btnContainer.addEventListener('click', async () => {
      await uploadPDFToNebula(btnContainer);
    });
    
    // Ajouter au DOM
    document.body.appendChild(btnContainer);
    console.log('[Nebula] ✅ Bouton flottant injecté avec succès');
  }
  
  // Uploader le PDF vers Nebula
  async function uploadPDFToNebula(button) {
    const originalHTML = button.innerHTML;
    
    try {
      // Animation de chargement
      button.style.pointerEvents = 'none';
      button.innerHTML = `
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#5F6368" stroke-width="2">
          <circle cx="12" cy="12" r="10" opacity="0.3"></circle>
          <path d="M12 2 A10 10 0 0 1 22 12">
            <animateTransform attributeName="transform" type="rotate" from="0 12 12" to="360 12 12" dur="0.8s" repeatCount="indefinite"/>
          </path>
        </svg>
      `;
      button.style.background = 'rgba(232, 234, 237, 1)';
      
      const pdfUrl = window.location.href;
      
      // Extraire le nom du fichier depuis l'URL
      let filename = 'document.pdf';
      const urlParts = pdfUrl.split('/');
      const lastPart = urlParts[urlParts.length - 1];
      if (lastPart && lastPart.includes('.pdf')) {
        filename = decodeURIComponent(lastPart.split('?')[0].split('#')[0]);
      }
      
      console.log('[Nebula] Envoi du PDF au background script:', pdfUrl);
      
      // Envoyer au background script pour qu'il gère l'upload
      // Le background script a les permissions pour lire les file:// URLs
      const response = await chrome.runtime.sendMessage({
        type: 'UPLOAD_PDF_FROM_URL',
        pdfUrl: pdfUrl,
        filename: filename
      });
      
      if (!response || !response.success) {
        throw new Error(response?.error || 'Erreur lors de l\'upload');
      }
      
      // Succès ! 
      button.innerHTML = `
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#1E8E3E" stroke-width="2.5">
          <polyline points="20 6 9 17 4 12"></polyline>
        </svg>
      `;
      button.style.background = 'rgba(232, 240, 254, 1)';
      
      // Restaurer après 2 secondes
      setTimeout(() => {
        button.innerHTML = originalHTML;
        button.style.pointerEvents = 'auto';
        button.style.background = 'rgba(241, 243, 244, 0.95)';
      }, 2000);
      
    } catch (error) {
      console.error('[Nebula] Erreur upload PDF:', error);
      
      // Afficher l'erreur
      button.innerHTML = `
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#D93025" stroke-width="2">
          <circle cx="12" cy="12" r="10"></circle>
          <line x1="15" y1="9" x2="9" y2="15"></line>
          <line x1="9" y1="9" x2="15" y2="15"></line>
        </svg>
      `;
      button.style.background = 'rgba(252, 232, 230, 1)';
      
      // Restaurer après 2 secondes
      setTimeout(() => {
        button.innerHTML = originalHTML;
        button.style.pointerEvents = 'auto';
        button.style.background = 'rgba(241, 243, 244, 0.95)';
      }, 2000);
    }
  }
  
  // Démarrer l'injection si c'est un PDF
  function init() {
    if (isPDFPage()) {
      // Attendre un peu que le DOM soit prêt
      setTimeout(() => {
        injectFloatingButton();
      }, 500);
    }
  }
  
  // Démarrer quand la page est prête
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
  
  // Observer les changements si le PDF charge dynamiquement
  const observer = new MutationObserver(() => {
    if (isPDFPage() && !document.getElementById('nebula-pdf-float-btn')) {
      injectFloatingButton();
    }
  });
  
  if (document.body) {
    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  }
  
})();
