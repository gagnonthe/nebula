# Notifications en Temps Réel

## Fonctionnement

L'extension Chrome Nebula utilise maintenant **Socket.IO** pour recevoir des notifications instantanées lorsqu'un fichier est uploadé sur le réseau.

## Caractéristiques

### 🔔 Notifications Automatiques
- **Temps réel** : Vous êtes notifié immédiatement quand un fichier est uploadé (plus besoin d'attendre 5 minutes)
- **Intelligent** : Vous ne recevez pas de notification pour vos propres uploads
- **Informations** : Le nom du fichier et sa taille s'affichent dans la notification

### 🔌 Connexion Socket.IO
- **Automatique** : L'extension se connecte automatiquement au serveur au démarrage
- **Reconnexion** : Reconnexion automatique en cas de perte de connexion (max 5 tentatives)
- **WebSocket** : Utilise WebSocket pour une communication bidirectionnelle efficace

## Architecture Technique

### Background Service Worker
Le fichier `background.js` :
1. Charge Socket.IO depuis `lib/socket.io.min.js` (local, conforme CSP)
2. Se connecte au serveur Socket.IO au démarrage de l'extension
3. S'enregistre comme appareil auprès du serveur
4. Écoute l'événement `file-uploaded` en temps réel
5. Affiche une notification Chrome native quand un nouveau fichier arrive

### Format de Notification
```javascript
{
  type: 'basic',
  iconUrl: 'icons/icon48.png',
  title: 'Nebula - Nouveau fichier',
  message: '📄 nom_du_fichier.ext\n125.5 KB'
}
```

### Événements Socket.IO Écoutés
- `connect` : Connexion établie avec le serveur
- `disconnect` : Déconnexion du serveur
- `file-uploaded` : Nouveau fichier uploadé
- `connect_error` : Erreur de connexion

## Comment Tester

1. **Installer l'extension** sur Chrome
2. **Ouvrir la PWA** sur un autre appareil (ou navigateur)
3. **Uploader un fichier** depuis la PWA
4. **Voir la notification** apparaître instantanément sur Chrome

## Avantages par rapport au Polling

### Ancien système (polling toutes les 5 minutes)
- ❌ Délai de 0 à 5 minutes avant la notification
- ❌ Consommation inutile de ressources (requêtes HTTP répétées)
- ❌ Nécessite la permission `alarms`

### Nouveau système (Socket.IO en temps réel)
- ✅ Notification instantanée (< 1 seconde)
- ✅ Économie de ressources (connexion persistante unique)
- ✅ Plus de permission nécessaire pour les alarmes

## Configuration

L'extension utilise la même URL de serveur que celle configurée dans les paramètres :
- Par défaut : `https://nebula-a50x.onrender.com`
- Peut être changée dans la section Configuration de l'extension

## Débogage

Pour voir les logs de connexion Socket.IO :
1. Ouvrir Chrome → `chrome://extensions/`
2. Activer le "Mode développeur"
3. Cliquer sur "Service worker" sous l'extension Nebula
4. Voir les messages de connexion/déconnexion dans la console

## Limitations

- Nécessite une connexion internet active
- Les notifications sont désactivées si l'utilisateur refuse la permission "notifications"
- Maximum 5 tentatives de reconnexion automatique en cas d'échec

## Compatibilité

- ✅ Chrome 93+
- ✅ Edge 93+
- ✅ Opera 79+
- ❌ Firefox (API manifest v3 en cours de déploiement)
