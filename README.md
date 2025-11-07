# Nebula 🌌

Système de partage de fichiers en temps réel entre iPhone (PWA) et PC (Extension Chrome) via Render.

## 📁 Structure du projet

```
nebula/
├── server/              # Backend Node.js/Express
│   └── index.js        # API REST + WebSocket
├── public/             # PWA (Progressive Web App)
│   ├── index.html      # Interface principale
│   ├── manifest.json   # Configuration PWA
│   ├── sw.js          # Service Worker
│   ├── js/app.js      # Logique client
│   └── css/style.css  # Styles
├── chrome-extension/   # Extension Chrome (MV3)
│   ├── manifest.json   # Configuration extension
│   ├── popup.html/css/js
│   └── background.js   # Service Worker extension
├── scripts/           # Scripts utilitaires
│   ├── portable-setup-and-run.ps1
│   └── create-placeholder-icons.ps1
├── docs/             # Documentation
│   ├── INSTALL.md
│   ├── DEMARRAGE.md
│   └── ICONS.md
├── package.json
├── render.yaml       # Configuration Render
└── README.md
```

## 🚀 Déploiement sur Render

### Prérequis
- Compte GitHub
- Compte Render (gratuit)

### Étapes

1. **Push du code sur GitHub** (déjà fait ✅)
   ```bash
   git push -u origin main
   ```

2. **Connecter Render à GitHub**
   - Aller sur [render.com](https://render.com)
   - Se connecter avec GitHub
   - Autoriser l'accès au repo `gagnonthe/nebula`

3. **Créer le Web Service**
   - Cliquer sur "New +" → "Web Service"
   - Sélectionner le repo `nebula`
   - Render détectera automatiquement `render.yaml`
   - Ou configuration manuelle :
     - **Name**: nebula
     - **Runtime**: Node
     - **Build Command**: `npm ci`
     - **Start Command**: `npm start`
     - **Plan**: Free

4. **Variables d'environnement** (auto-configurées via render.yaml)
   - `NODE_ENV=production`
   - `PORT` (auto-assigné par Render)
   - `MAX_FILE_SIZE=10485760` (10MB)
   - `ALLOWED_ORIGINS=*`

5. **Déployer**
   - Cliquer sur "Create Web Service"
   - Attendre le build (~2-3 min)
   - Récupérer l'URL : `https://nebula-xxxx.onrender.com`

## 📱 Configuration PWA (iPhone)

1. Ouvrir Safari sur iPhone
2. Aller sur `https://nebula-xxxx.onrender.com`
3. Appuyer sur le bouton Partage
4. "Ajouter à l'écran d'accueil"
5. L'app Nebula est installée !

## 💻 Configuration Extension Chrome (PC)

1. Ouvrir Chrome
2. Aller dans `chrome://extensions/`
3. Activer "Mode développeur" (en haut à droite)
4. "Charger l'extension non empaquetée"
5. Sélectionner le dossier `chrome-extension/`
6. Dans l'extension, configurer l'URL du serveur : `https://nebula-xxxx.onrender.com`

## 🎨 Palette Nebula

| Couleur | Hex | Usage |
|---------|-----|-------|
| DeepPink | `#FF1493` | Accents principaux (barres de progression) |
| MediumVioletRed | `#C71585` | Accents secondaires (hover, focus) |
| PaleVioletRed | `#DB7093` | Accents tertiaires (backgrounds légers) |

Les couleurs sont appliquées avec parcimonie sur un design neutre (gris/blanc).

## 🔧 Développement local

### Windows (sans admin)
```powershell
.\scripts\portable-setup-and-run.ps1
```

### Avec Node.js installé
```bash
npm install
npm run dev
```

Le serveur démarre sur `http://localhost:3000`

## 📡 Fonctionnalités

- ✅ Upload de fichiers (max 10MB)
- ✅ Téléchargement depuis n'importe quel appareil
- ✅ Notifications temps réel (WebSocket)
- ✅ Liste des appareils connectés
- ✅ Nettoyage automatique (fichiers > 24h)
- ✅ PWA installable sur iPhone
- ✅ Extension Chrome avec notifications
- ✅ Design minimal et neutre

## 📝 Notes

- **Stockage temporaire** : Les fichiers sont stockés sur le disque du serveur Render (plan gratuit = non persistant au redémarrage)
- **Sécurité** : En production, configurer `ALLOWED_ORIGINS` avec les domaines autorisés
- **Limites Render Free** :
  - Service s'endort après 15 min d'inactivité
  - Premier accès après sommeil peut prendre 30-60s
  - Fichiers perdus au redémarrage

## 🔗 Liens utiles

- [Documentation Render](https://render.com/docs)
- [PWA Guide](https://web.dev/progressive-web-apps/)
- [Chrome Extension Docs](https://developer.chrome.com/docs/extensions/)

---

Made with 💖 by [gagnonthe](https://github.com/gagnonthe)
