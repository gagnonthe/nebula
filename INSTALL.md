# 🚀 INSTALLATION RAPIDE

## Méthode 1 : Script automatique (RECOMMANDÉ)

Exécutez simplement ce script qui va tout faire pour vous :

```powershell
.\install.ps1
```

Le script va :
- ✅ Vérifier si Node.js est installé
- ✅ Installer les dépendances npm
- ✅ Créer le fichier .env
- ✅ Proposer de lancer le serveur

---

## Méthode 2 : Installation manuelle

### 1. Installer Node.js
- Téléchargez depuis https://nodejs.org/ (version LTS)
- Installez
- Redémarrez VS Code

### 2. Installer les dépendances
```powershell
npm install
```

### 3. Créer le fichier .env
Copiez `.env.example` en `.env` ou créez un fichier `.env` avec :
```
PORT=3000
NODE_ENV=development
MAX_FILE_SIZE=10485760
ALLOWED_ORIGINS=*
```

### 4. Lancer le serveur
```powershell
npm run dev
```

---

## 📱 Tester le système

### Sur PC :
1. Ouvrez http://localhost:3000 dans votre navigateur
2. Vous verrez l'interface de partage de fichiers

### Extension Chrome :
1. Allez sur `chrome://extensions/`
2. Activez "Mode développeur"
3. Cliquez "Charger l'extension non empaquetée"
4. Sélectionnez le dossier `chrome-extension`
5. Configurez avec `http://localhost:3000`

### Sur iPhone (via réseau local) :
1. Trouvez votre adresse IP locale : `ipconfig` (cherchez IPv4)
2. Sur iPhone, ouvrez Safari et allez sur `http://VOTRE-IP:3000`
3. Ajoutez à l'écran d'accueil

---

## 🎨 Améliorer les icônes

Les icônes actuelles sont des placeholders. Pour de vraies icônes :

1. Visitez https://favicon.io/favicon-generator/
2. Créez une icône avec :
   - Texte: 📁 ou "FS"
   - Couleur fond: #4F46E5
   - Couleur texte: Blanc
3. Téléchargez et remplacez les fichiers dans :
   - `public/icons/`
   - `chrome-extension/icons/`

---

## ☁️ Déployer sur Render

Une fois testé localement :

1. Créez un compte sur https://render.com
2. Poussez votre code sur GitHub
3. Connectez GitHub à Render
4. Déployez (le fichier `render.yaml` est prêt)

---

## 🆘 Problèmes ?

Consultez `DEMARRAGE.md` pour une documentation complète.
