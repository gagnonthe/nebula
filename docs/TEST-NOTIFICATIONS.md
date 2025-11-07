# Test des Notifications en Temps Réel

## 🧪 Comment Tester

### Prérequis
1. Extension Chrome installée et configurée
2. PWA accessible (sur iPhone ou dans un autre navigateur)
3. Les deux appareils connectés au même serveur

### Test 1 : Notification depuis PWA → Extension

1. **Sur PC** : 
   - Ouvrir l'extension Nebula
   - Vérifier qu'elle est connectée (badge "Connecté")
   - Ouvrir la console du Service Worker :
     - `chrome://extensions/` → Mode développeur → "Service worker" sous Nebula
     - Vous devriez voir : `Connecté au serveur Nebula`

2. **Sur iPhone (ou autre navigateur)** :
   - Ouvrir la PWA Nebula
   - Sélectionner un fichier (image, PDF, etc.)
   - Cliquer sur "Envoyer"

3. **Vérifier** :
   - ✅ Notification Windows apparaît instantanément
   - ✅ Titre : "Nebula - Nouveau fichier"
   - ✅ Message : "📄 nom_du_fichier.ext\nTaille"
   - ✅ Cliquer sur la notification ouvre l'extension

### Test 2 : Notification depuis Extension → PWA

1. **Sur iPhone** :
   - Ouvrir la PWA Nebula
   - Vérifier le badge "En ligne"

2. **Sur PC** :
   - Ouvrir l'extension Nebula
   - Sélectionner un fichier
   - Cliquer sur "Envoyer"

3. **Vérifier** :
   - ✅ Notification apparaît en haut de la PWA
   - ✅ Le fichier apparaît dans la liste
   - ❌ PAS de notification Chrome (car c'est vous qui avez uploadé)

### Test 3 : Reconnexion Automatique

1. **Couper la connexion** :
   - Désactiver le WiFi/4G sur un appareil
   - Attendre 5 secondes

2. **Réactiver la connexion** :
   - Réactiver le WiFi/4G
   - Vérifier dans la console : `Connecté au serveur Nebula`

3. **Tester l'upload** :
   - Uploader un fichier
   - ✅ La notification fonctionne toujours

### Test 4 : Plusieurs Appareils

1. **Installer l'extension sur 2 PC différents** (ou 2 profils Chrome)
2. **Uploader depuis la PWA**
3. **Vérifier** :
   - ✅ Les DEUX extensions reçoivent la notification
   - ✅ Le fichier apparaît sur les deux

## 🐛 Débogage

### Problème : Pas de notification

**Vérifier** :
1. Permission "Notifications" autorisée dans Chrome :
   - `chrome://settings/content/notifications`
   - Vérifier que le site de l'extension est autorisé

2. Console du Service Worker :
   - `chrome://extensions/` → "Service worker"
   - Chercher des erreurs en rouge

3. État de connexion Socket.IO :
   - Console doit afficher : `Connecté au serveur Nebula`
   - Si erreur : vérifier l'URL du serveur dans les paramètres

### Problème : Notification en double

**Cause** : Vous avez uploadé le fichier vous-même
**Solution** : C'est normal, l'extension ne notifie que pour les fichiers uploadés par d'autres

### Problème : Délai dans les notifications

**Vérifier** :
- Connexion internet stable
- Serveur Render non endormi (plan gratuit)
- Console : pas d'erreur `connect_error`

## 📊 Logs à Consulter

### Console Service Worker (Extension)
```
Connecté au serveur Nebula
Nouveau fichier reçu: { filename: 'test.pdf', size: 12345, ... }
```

### Console PWA
```
Connecté au serveur
Fichier uploadé : test.pdf
```

### Console Serveur (si accès)
```
Nouvelle connexion Socket.IO : chrome_xxxxx
Device registered: chrome_xxxxx
File uploaded: test.pdf
Broadcasting to X clients
```

## ✅ Résultat Attendu

- **Délai** : < 1 seconde entre upload et notification
- **Fiabilité** : 100% des uploads génèrent une notification
- **Batterie** : Pas d'impact notable (connexion WebSocket légère)
- **Données** : ~1KB/min en idle (ping/pong Socket.IO)

## 🎯 Scénarios Réels

### Scénario 1 : Photo iPhone → PC
1. Prendre une photo sur iPhone
2. Ouvrir PWA Nebula
3. Uploader la photo
4. **PC** : Notification immédiate → Clic → Téléchargement

### Scénario 2 : Document PC → iPhone
1. Sur PC, sélectionner un PDF
2. Uploader via l'extension
3. **iPhone** : Notification PWA → Ouvrir → Télécharger
4. Ouvrir dans Files ou autre app

### Scénario 3 : Partage Multi-Appareils
1. Uploader depuis n'importe quel appareil
2. **Tous les autres** reçoivent la notification
3. Télécharger depuis l'appareil de votre choix

---

**Note** : Pour le meilleur résultat, gardez l'extension Chrome ouverte (icône dans la barre) et la PWA en arrière-plan sur iPhone.
