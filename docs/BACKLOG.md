# Backlog de Fonctionnalités - Nebula

> Idées de fonctionnalités à implémenter dans le futur

## 🎯 En Cours d'Implémentation

### ✅ QR Code de Connexion (ID #6)
**Statut** : EN COURS  
**Priorité** : Haute  
**Complexité** : Faible (~2-3h)  
**Description** :
- Générer un QR code sur l'extension PC avec l'URL du serveur
- Scanner le QR sur iPhone pour connexion instantanée
- Plus besoin de taper l'URL manuellement

---

## 📋 Fonctionnalités Prioritaires

### 1. Historique des Fichiers (ID #1)
**Priorité** : Haute  
**Complexité** : Faible (~2h)  
**Description** :
- Liste des derniers fichiers partagés (localStorage)
- Possibilité de repartager rapidement
- Icônes selon le type de fichier
- Limite : 20 derniers fichiers

**Bénéfices** :
- Retrouver facilement un fichier partagé
- Repartager sans re-upload
- Meilleure traçabilité

---

### 2. Partage Ciblé (ID #2)
**Priorité** : Haute  
**Complexité** : Faible (~3h)  
**Description** :
- Envoyer un fichier à un appareil spécifique
- Liste déroulante des appareils connectés
- Notification uniquement pour l'appareil cible
- Option "Envoyer à tous" par défaut

**Bénéfices** :
- Évite de polluer tous les appareils
- Plus de contrôle sur le partage
- Meilleure privacy

**Modifications nécessaires** :
- API : Ajouter `targetDeviceId` dans `/api/upload`
- Socket.IO : Filtrer les broadcasts
- UI : Dropdown de sélection d'appareil

---

### 3. Aperçu des Fichiers (ID #3)
**Priorité** : Moyenne  
**Complexité** : Moyenne (~5h)  
**Description** :
- Prévisualisation d'images (lightbox)
- Lecteur PDF intégré (PDF.js)
- Aperçu vidéo/audio (HTML5)
- Icône "👁️ Aperçu" sur chaque fichier

**Bénéfices** :
- Vérifier le contenu avant téléchargement
- Meilleure UX
- Économie de bande passante

**Technologies** :
- Images : `<img>` en modal
- PDF : PDF.js ou embed
- Vidéo/Audio : `<video>`/`<audio>` tags

---

### 4. Presse-papier Partagé (ID #4)
**Priorité** : Haute  
**Complexité** : Moyenne (~5h)  
**Description** :
- Copier du texte sur iPhone → Disponible sur PC
- Sync automatique du clipboard
- Historique des 10 derniers clips
- Bouton "Copier" dans l'extension

**Bénéfices** :
- Super pratique au quotidien
- Pas besoin de fichier pour du texte court
- Vraie valeur ajoutée vs concurrence

**Modifications nécessaires** :
- API : Nouveau endpoint `/api/clipboard`
- Socket.IO : Event `clipboard-updated`
- Permissions : `clipboardWrite` (extension)
- UI : Section dédiée au clipboard

---

### 5. Mode Sombre (ID #5)
**Priorité** : Moyenne  
**Complexité** : Très faible (~1-2h)  
**Description** :
- Toggle dark/light mode
- Auto-détection avec `prefers-color-scheme`
- Sauvegardé dans localStorage
- Design OLED-friendly pour économie batterie

**Bénéfices** :
- Confort visuel
- Économie batterie sur OLED
- Moderne et attendu

**Implémentation** :
- CSS custom properties
- Toggle dans le header
- Classes `.dark` sur body

---

## 💎 Fonctionnalités Avancées

### 7. Chiffrement E2E (ID #7)
**Priorité** : Basse (nice-to-have)  
**Complexité** : Élevée (~10-15h)  
**Description** :
- Fichiers chiffrés côté client (Web Crypto API)
- Clé AES partagée entre appareils (QR code)
- Serveur ne voit que des données chiffrées
- Badge "🔒 Chiffré" sur les fichiers

**Bénéfices** :
- Sécurité maximale
- Privacy totale
- Argument marketing fort

**Défis** :
- Gestion des clés complexe
- Impact sur performance
- Incompatible avec aperçu serveur

---

### 8. Dossiers Virtuels (ID #8)
**Priorité** : Basse  
**Complexité** : Moyenne (~6h)  
**Description** :
- Créer des "collections" de fichiers
- Organiser par projet/thème
- Partager un dossier entier
- Tags personnalisables

**Bénéfices** :
- Meilleure organisation
- Partage groupé
- Pro-level feature

---

### 9. Compression Automatique (ID #9)
**Priorité** : Moyenne  
**Complexité** : Moyenne (~4h)  
**Description** :
- Compresser images avant upload (browser-image-compression)
- Réduire qualité configurable (80%, 60%, 40%)
- Zip multiple files
- Décompression auto côté réception

**Bénéfices** :
- Économie de bande passante
- Upload plus rapide
- Moins de quota utilisé

---

### 10. Liens de Partage (ID #10)
**Priorité** : Haute  
**Complexité** : Moyenne (~5h)  
**Description** :
- Générer lien public temporaire (`/share/abc123`)
- Expiration après X heures (configurable)
- Pas besoin de Nebula pour télécharger
- QR code du lien

**Bénéfices** :
- Partager avec personnes sans Nebula
- Pratique pour partage rapide
- Lien court et propre

**Sécurité** :
- Token aléatoire impossible à deviner
- Rate limiting sur endpoint public
- Auto-suppression après expiration

---

## 🎨 Améliorations UX

### 11. Glisser-Déposer Multi-Fichiers (ID #11)
**Priorité** : Moyenne  
**Complexité** : Faible (~2h)  
**Description** :
- Uploader plusieurs fichiers d'un coup
- Barre de progression globale
- Queue d'upload avec retry
- Annulation par fichier

---

### 12. Recherche de Fichiers (ID #12)
**Priorité** : Basse  
**Complexité** : Faible (~2h)  
**Description** :
- Barre de recherche en haut
- Filtrer par nom, type, date
- Trier par taille/date/nom
- Highlight des résultats

---

### 13. Thèmes Personnalisés (ID #13)
**Priorité** : Basse  
**Complexité** : Moyenne (~4h)  
**Description** :
- Choix de couleur d'accent
- Presets : Nebula Pink, Ocean Blue, Forest Green, Sunset Orange
- Mode haute visibilité (contraste élevé)
- Exportable (JSON)

---

### 14. Sons/Vibrations (ID #14)
**Priorité** : Basse  
**Complexité** : Très faible (~1h)  
**Description** :
- Son quand fichier reçu (notification.mp3)
- Vibration sur mobile (Vibration API)
- Toggle on/off
- Plusieurs sons au choix

---

### 15. Statistiques (ID #15)
**Priorité** : Basse  
**Complexité** : Moyenne (~4h)  
**Description** :
- Dashboard avec graphiques (Chart.js)
- Nombre de fichiers partagés (aujourd'hui/semaine/mois)
- Bande passante utilisée
- Types de fichiers les plus partagés
- Appareils les plus actifs

---

## 🔧 Fonctionnalités Techniques

### 16. Mode Hors-Ligne (ID #16)
**Priorité** : Basse  
**Complexité** : Élevée (~8h)  
**Description** :
- Cache des fichiers récents (IndexedDB)
- Sync automatique au retour en ligne
- Service Worker amélioré
- Indicateur de statut

---

### 17. Transfert WebRTC P2P (ID #17)
**Priorité** : Basse (complexe)  
**Complexité** : Très élevée (~15-20h)  
**Description** :
- Connexion P2P directe entre appareils
- Pas de passage par le serveur
- Ultra rapide sur même réseau local
- Fallback sur serveur si P2P échoue

---

### 18. API Publique (ID #18)
**Priorité** : Basse  
**Complexité** : Moyenne (~5h)  
**Description** :
- Documentation OpenAPI/Swagger
- Endpoints REST complets
- Webhooks sur événements
- Rate limiting
- API keys

---

### 19. Gestion des Quotas (ID #19)
**Priorité** : Moyenne  
**Complexité** : Moyenne (~4h)  
**Description** :
- Limite par appareil (ex: 10GB)
- Alertes quand proche de la limite
- Nettoyage automatique des vieux fichiers
- Dashboard de consommation

---

### 20. Multi-Utilisateurs (ID #20)
**Priorité** : Basse (breaking change)  
**Complexité** : Très élevée (~20h+)  
**Description** :
- Comptes avec email/password
- Plusieurs "workspaces" isolés
- Partage entre utilisateurs
- Permissions (admin, user, guest)
- Base de données requise (PostgreSQL)

---

## 📊 Matrice de Priorisation

| ID | Fonctionnalité | Priorité | Complexité | Impact | Ratio Impact/Effort |
|----|----------------|----------|------------|--------|---------------------|
| 6  | QR Code        | ⭐⭐⭐    | ⚡         | ⭐⭐⭐  | 🔥🔥🔥              |
| 2  | Partage Ciblé  | ⭐⭐⭐    | ⚡         | ⭐⭐⭐  | 🔥🔥🔥              |
| 4  | Clipboard      | ⭐⭐⭐    | ⚡⚡       | ⭐⭐⭐  | 🔥🔥                |
| 10 | Liens Publics  | ⭐⭐⭐    | ⚡⚡       | ⭐⭐⭐  | 🔥🔥                |
| 1  | Historique     | ⭐⭐     | ⚡         | ⭐⭐   | 🔥🔥                |
| 5  | Mode Sombre    | ⭐⭐     | ⚡         | ⭐⭐   | 🔥🔥                |
| 3  | Aperçu         | ⭐⭐     | ⚡⚡       | ⭐⭐   | 🔥                  |
| 9  | Compression    | ⭐⭐     | ⚡⚡       | ⭐⭐   | 🔥                  |
| 11 | Multi-Upload   | ⭐⭐     | ⚡         | ⭐⭐   | 🔥🔥                |

---

## 🎯 Roadmap Suggérée

### Phase 1 - Quick Wins (1-2 semaines)
- ✅ QR Code (ID #6) - EN COURS
- ⬜ Partage Ciblé (ID #2)
- ⬜ Mode Sombre (ID #5)
- ⬜ Historique (ID #1)

### Phase 2 - Value Add (2-3 semaines)
- ⬜ Presse-papier Partagé (ID #4)
- ⬜ Liens de Partage (ID #10)
- ⬜ Aperçu Fichiers (ID #3)

### Phase 3 - Polish (1-2 semaines)
- ⬜ Multi-Upload (ID #11)
- ⬜ Compression (ID #9)
- ⬜ Recherche (ID #12)

### Phase 4 - Advanced (si besoin)
- ⬜ Chiffrement E2E (ID #7)
- ⬜ Statistiques (ID #15)
- ⬜ API Publique (ID #18)

---

## 📝 Notes

- **Légende Priorité** : ⭐⭐⭐ Haute | ⭐⭐ Moyenne | ⭐ Basse
- **Légende Complexité** : ⚡ Faible | ⚡⚡ Moyenne | ⚡⚡⚡ Élevée
- **Dernière mise à jour** : 7 novembre 2025
- **Mainteneur** : @gagnonthe

