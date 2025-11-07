# 🌌 Nebula

Nebula est un système minimaliste de partage de fichiers temps réel entre iPhone (PWA) et PC (Extension Chrome), conçu pour être déployé facilement sur Render.

## � Palette Nebula (sélection)
| Usage | Nom | Hex |
|-------|-----|-----|
| Accent primaire | DeepPink | `#FF1493` |
| Accent secondaire | MediumVioletRed | `#C71585` |
| Accent doux / fond léger | PaleVioletRed | `#DB7093` |

Ces couleurs sont volontairement utilisées avec parcimonie (barres de progression, indicateurs d'état) pour garder une interface épurée.


## �🌟 Fonctionnalités

- ✅ Upload/téléchargement de fichiers (max 10MB)
- ✅ Synchronisation temps réel via WebSocket
- ✅ PWA pour iPhone avec support offline
- ✅ Extension Chrome pour PC
- ✅ Liste des appareils connectés
- ✅ Notifications en temps réel
- ✅ Auto-suppression des fichiers après 1 heure

## 🚀 Déploiement sur Render

### 1. Créer un compte Render
Allez sur [render.com](https://render.com) et créez un compte gratuit.

### 2. Déployer le serveur

1. Cliquez sur "New +" → "Web Service"
2. Connectez votre repository GitHub
3. Configurez le service:
   - **Name**: file-share-system
   - **Environment**: Node
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Plan**: Free

4. Variables d'environnement:
   ```
   NODE_ENV=production
   PORT=3000
   MAX_FILE_SIZE=10485760
   ALLOWED_ORIGINS=*
   ```

5. Cliquez sur "Create Web Service"

### 3. Récupérer l'URL
Une fois déployé, vous obtiendrez une URL comme:
```
https://file-share-system-xxxx.onrender.com
```

## 📱 Installation PWA (iPhone)

1. Ouvrez Safari sur votre iPhone
2. Accédez à l'URL de votre serveur Render
3. Cliquez sur le bouton "Partager" 📤
4. Sélectionnez "Sur l'écran d'accueil"
5. Nommez l'app "Nebula" et ajoutez

L'application sera maintenant disponible comme une app native sur votre iPhone!

## 💻 Installation Extension Chrome (PC)

1. Ouvrez Chrome et accédez à `chrome://extensions/`
2. Activez le "Mode développeur" (en haut à droite)
3. Cliquez sur "Charger l'extension non empaquetée"
4. Sélectionnez le dossier `chrome-extension`
5. L'extension est maintenant installée!

### Configuration de l'extension:
1. Cliquez sur l'icône de l'extension
2. Entrez l'URL de votre serveur Render
3. Cliquez sur "Sauvegarder"

## 🎯 Utilisation

### Depuis l'iPhone (PWA):
1. Ouvrez l'app Nebula
2. Cliquez sur "Choisir un fichier" ou glissez-déposez
3. Le fichier sera uploadé et disponible sur tous vos appareils

### Depuis le PC (Extension Chrome):
1. Cliquez sur l'icône de l'extension
2. Cliquez sur "Choisir un fichier"
3. Sélectionnez le fichier à partager
4. Cliquez sur "Envoyer"

### Télécharger un fichier:
- Sur n'importe quel appareil, cliquez sur "Télécharger" à côté du fichier
- Le fichier sera téléchargé sur votre appareil

## 🔧 Développement local

### Prérequis
- Node.js >= 18.0.0
- npm

### Installation
```powershell
# Installer les dépendances
npm install

# Copier le fichier d'environnement
Copy-Item .env.example .env

# Lancer le serveur en mode développement
npm run dev
```

Le serveur sera accessible sur `http://localhost:3000`

### Structure du projet
```
files/
├── server/
│   └── index.js           # Serveur Express avec WebSocket
├── public/
│   ├── index.html         # Interface PWA
│   ├── manifest.json      # Manifest PWA
│   ├── sw.js             # Service Worker
│   ├── css/
│   │   └── style.css     # Styles PWA
│   └── js/
│       └── app.js        # Logic PWA
├── chrome-extension/
│   ├── manifest.json     # Manifest Extension
│   ├── popup.html        # Interface Extension
│   ├── popup.css         # Styles Extension
│   ├── popup.js          # Logic Extension
│   └── background.js     # Service Worker Extension
├── package.json
└── README.md
```

## 🔒 Sécurité

⚠️ **Important**: Ce système est conçu pour un usage personnel/développement.

Pour la production, ajoutez:
- Authentification des utilisateurs
- Chiffrement des fichiers
- Limites de taux (rate limiting)
- Base de données persistante
- Stockage cloud (S3, etc.)
- HTTPS obligatoire

## 📝 API Endpoints

### Santé du serveur
```
GET /api/health
```

### Enregistrer un appareil
```
POST /api/device/register
Body: { deviceId, deviceName, deviceType }
```

### Upload un fichier
```
POST /api/upload
FormData: { file, deviceId, targetDevice }
```

### Liste des fichiers
```
GET /api/files?deviceId={deviceId}
```

### Télécharger un fichier
```
GET /api/download/:fileId
```

### Supprimer un fichier
```
DELETE /api/files/:fileId
```

### Liste des appareils
```
GET /api/devices
```

## 🔌 WebSocket Events

### Client → Serveur
- `register-device`: Enregistrer un appareil

### Serveur → Client
- `file-uploaded`: Nouveau fichier uploadé
- `file-deleted`: Fichier supprimé
- `device-connected`: Nouvel appareil connecté
- `device-disconnected`: Appareil déconnecté

## 🎨 Icônes

Pour l'extension Chrome et la PWA, vous devrez créer des icônes aux tailles suivantes:
- 16x16, 32x32, 48x48, 128x128 (Extension Chrome)
- 72x72, 96x96, 128x128, 144x144, 152x152, 192x192, 384x384, 512x512 (PWA)

Vous pouvez utiliser un service en ligne comme [favicon.io](https://favicon.io) pour générer les icônes.

## 🐛 Dépannage

### Le serveur ne démarre pas
- Vérifiez que Node.js >= 18 est installé: `node --version`
- Vérifiez que les dépendances sont installées: `npm install`
- Vérifiez le fichier `.env`

### La PWA ne s'installe pas
- Utilisez HTTPS (requis pour les PWA)
- Vérifiez que le manifest.json est accessible
- Vérifiez la console développeur pour les erreurs

### L'extension Chrome ne fonctionne pas
- Vérifiez que l'URL du serveur est correcte
- Vérifiez les permissions dans manifest.json
- Rechargez l'extension depuis chrome://extensions/

## 📄 Licence

MIT

## 👤 Auteur

Votre nom

## 🤝 Contribution

Les contributions sont les bienvenues! N'hésitez pas à ouvrir une issue ou une pull request.
