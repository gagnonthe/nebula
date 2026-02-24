# Changelog - Nebula Chrome Extension
## Version 1.3.0 - 2026-02-24

### ✨ Nouvelle fonctionnalité : Bouton d'import dans le visualiseur PDF

#### 📄 Partage de PDF en un clic
- **Bouton intégré** dans l'interface PDF de Chrome
- **Position** : À côté des boutons Imprimer/Télécharger en haut à droite
- **Design** : Bouton rose Nebula avec icône d'upload
- **Fonctionnement** :
  1. Ouvrez n'importe quel PDF dans Chrome
  2. Cliquez sur le bouton "Nebula" dans la barre d'outils
  3. Le PDF est automatiquement uploadé sur tous vos appareils
  
#### 🎨 Interface utilisateur
- Bouton avec effet hover et animation
- États visuels :
  - 🔵 Normal : Bouton rose avec icône
  - ⏳ Upload en cours : Animation + "Upload..."
  - ✅ Succès : Bouton vert + "Envoyé !"
  - ❌ Erreur : Bouton rouge + "Erreur"
- Notification système au succès

#### 🔧 Technique
- Content script injecté sur toutes les pages
- Détection automatique de l'interface PDF
- MutationObserver pour gérer les PDFs chargés dynamiquement
- Support des PDFs locaux et en ligne

### 📁 Nouveaux fichiers
- [pdf-injector.js](chrome-extension/pdf-injector.js) - Content script pour l'injection du bouton

---
## Version 1.2.0 - 2026-02-24

### ✨ Nouvelle fonctionnalité majeure : Menu contextuel (clic droit)

#### 🖱️ Partage via clic droit
- **Partager des images** : Clic droit sur n'importe quelle image → "🚀 Partager sur Nebula"
  - Téléchargement automatique de l'image
  - Upload direct vers le serveur Nebula
  - Notification de progression et de succès
  
- **Partager des liens** : Clic droit sur un lien → "🚀 Partager le lien sur Nebula"
  - Enregistrement instantané du lien
  - Accessible depuis tous vos appareils
  
- **Partager du texte** : Sélectionnez du texte + clic droit → "🚀 Partager le texte sur Nebula"
  - Partage de notes, citations, extraits de texte
  - Synchronisation immédiate

#### 🔧 Améliorations techniques
- Ajout de la permission `contextMenus` dans le manifest
- Gestion intelligente des erreurs avec notifications détaillées
- Support des images depuis n'importe quel site web (avec CORS)
- Utilisation de l'API Fetch moderne pour les téléchargements

### 📱 Utilisation
1. Naviguez sur n'importe quel site web
2. Clic droit sur une image, un lien ou du texte sélectionné
3. Choisissez l'option "🚀 Partager sur Nebula"
4. Le contenu est instantanément disponible sur tous vos appareils !

---

## Version 1.1.0 - 2026-02-24

### ✨ Nouvelles fonctionnalités

#### 🖱️ Drag & Drop
- Ajout du support glisser-déposer dans la zone d'upload
- Feedback visuel lors du survol de fichiers (changement de couleur)
- Compatible avec le drag & drop de fichiers et de dossiers
- Interface réactive avec changement de style lors du dragover/dragleave

#### 🔗 Partage avec lien temporaire
- Nouveau modal de partage pour générer des liens temporaires
- Sélection de la durée de validité (1h, 24h, 7j, 30j)
- Génération automatique de QR code pour chaque lien
- Bouton de copie rapide du lien de partage
- Bouton "🔗 Partager" ajouté sur chaque fichier de la liste
- Notification lors de la création d'un lien

#### 📝 Gestion des notes et liens
- Implémentation complète de l'import de texte et de liens
- Fonctionnalité de copie des notes dans le presse-papiers
- Suppression des notes et liens avec confirmation
- Affichage des notes et liens avec date de création
- Bouton "Coller" pour insérer directement le contenu du presse-papiers dans le champ lien
- Chargement automatique des notes/liens au démarrage

#### ⌨️ Amélioration de l'UX
- Fermeture des modals avec la touche ESC (Échap)
- Fermeture des modals en cliquant en dehors du contenu
- Support clavier complet pour tous les modals (prévisualisation, QR code, partage)

### 🔧 Améliorations techniques

- Réorganisation du code avec de nouvelles fonctions :
  - `setupDragAndDrop()` - Configuration du drag & drop
  - `setupTextLinkImport()` - Configuration de l'import texte/liens
  - `loadNotesLinks()` - Chargement et affichage des notes et liens
  - `openShareModal()` / `closeShareModal()` - Gestion du modal de partage
  - `generateShareLink()` / `copyShareUrl()` - Génération et copie des liens
  - `copyNote()` / `deleteNote()` - Actions sur les notes
  - `copyLink()` / `deleteLink()` - Actions sur les liens

- Toutes les fonctions nécessaires exposées globalement via `window.*` pour compatibilité avec les handlers HTML

### 🎨 Interface

- Conservation de l'interface existante
- Ajout du bouton "🔗 Partager" à côté des boutons "Aperçu" et "Télécharger"
- Amélioration du feedback visuel pour le drag & drop
- Animations douces pour l'ouverture/fermeture des modals

### 🐛 Corrections

- Gestion correcte des promesses pour toutes les actions asynchrones
- Amélioration de la gestion des erreurs avec try/catch
- Notifications Chrome optimisées avec gestion des erreurs silencieuse

---

## Version 1.0.0 - Version initiale

### Fonctionnalités de base
- ✅ Upload de fichiers et dossiers
- ✅ Prévisualisation des fichiers (images, textes, PDF, audio, vidéo)
- ✅ Navigation dans les pages PDF
- ✅ Support du presse-papiers (Ctrl+V)
- ✅ Fichiers privés avec code d'accès
- ✅ Liste des appareils connectés
- ✅ QR code pour accéder au site web
- ✅ Connexion au serveur Nebula

