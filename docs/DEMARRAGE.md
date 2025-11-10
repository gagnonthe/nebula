# 🚀 GUIDE DE DÉMARRAGE RAPIDE

## ⚠️ Étape 1 : Installer Node.js (OBLIGATOIRE)

Node.js n'est pas installé sur votre système. Vous devez l'installer pour faire fonctionner le serveur.

### Installation Node.js :
1. Allez sur https://nodejs.org/
2. Téléchargez la version **LTS** (recommandée)
3. Exécutez l'installateur
4. Redémarrez VS Code après l'installation

### Vérifier l'installation :
```powershell
node --version
npm --version
```

---

## 🎨 Étape 2 : Créer les icônes

### Option A : Utiliser un générateur en ligne (RECOMMANDÉ)
1. Allez sur https://favicon.io/favicon-generator/
2. Paramètres suggérés :
   - Texte: 📁 ou FS
   - Couleur de fond: #4F46E5
   - Couleur du texte: #FFFFFF
   - Forme: Arrondie
3. Téléchargez le pack
4. Copiez les fichiers dans :
   - `public/icons/` (renommer en icon-XXxXX.png)
   - `chrome-extension/icons/` (renommer en iconXX.png)

### Option B : Utiliser le SVG fourni
Le fichier `icon-template.svg` a été créé. Vous pouvez :
1. L'ouvrir dans un éditeur SVG (Inkscape, Figma, etc.)
2. L'exporter aux tailles nécessaires :
   - PWA: 72, 96, 128, 144, 152, 192, 384, 512
   - Chrome: 16, 32, 48, 128

### Option C : Utiliser des icônes temporaires
Pour tester rapidement, copiez n'importe quelle image PNG dans les dossiers icons et renommez-les.

---

## 📦 Étape 3 : Installer les dépendances

Une fois Node.js installé :

```powershell
cd "C:\Users\lucaspereiradealmeid\OneDrive - Région Île-de-France\Projet\PWA\files"
npm install
```

---

## 🏃 Étape 4 : Lancer le serveur

### En développement (local) :
```powershell
npm run dev
```

Le serveur sera accessible sur http://localhost:3000

### Tester la PWA :
1. Ouvrez http://localhost:3000 dans votre navigateur
2. Sur iPhone : ouvrez dans Safari et ajoutez à l'écran d'accueil

### Tester l'extension Chrome :
1. Ouvrez Chrome
2. Allez sur `chrome://extensions/`
3. Activez "Mode développeur"
4. Cliquez sur "Charger l'extension non empaquetée"
5. Sélectionnez le dossier `chrome-extension`
6. Configurez l'URL du serveur : `http://localhost:3000`

---

## ☁️ Étape 5 : Déployer sur Render

### Créer un compte :
1. Allez sur https://render.com
2. Créez un compte (gratuit)
3. Connectez votre compte GitHub

### Pousser le code sur GitHub :
```powershell
cd "C:\Users\lucaspereiradealmeid\OneDrive - Région Île-de-France\Projet\PWA\files"
git init
git add .
git commit -m "Initial commit - File sharing system"
# Créez un repo sur GitHub puis :
git remote add origin https://github.com/VOTRE-USERNAME/VOTRE-REPO.git
git push -u origin main
```

### Déployer sur Render :
1. Sur Render, cliquez sur "New +" → "Web Service"
2. Connectez votre repository GitHub
3. Paramètres :
   - **Name**: file-share-system
   - **Environment**: Node
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Plan**: Free

4. Variables d'environnement (dans l'onglet Environment) :
   ```
   NODE_ENV=production
   MAX_FILE_SIZE=10485760
   ALLOWED_ORIGINS=*
   ```

5. Cliquez sur "Create Web Service"

### Récupérer l'URL :
Après le déploiement, vous obtiendrez une URL comme :
```
https://file-share-system-xxxx.onrender.com
```

---

## 📱 Étape 6 : Utiliser sur iPhone

1. Ouvrez Safari sur iPhone
2. Allez sur l'URL de votre serveur Render
3. Cliquez sur le bouton Partager 📤
4. Sélectionnez "Sur l'écran d'accueil"
5. Nommez l'app "File Share"
6. Ajoutez !

---

## 💻 Étape 7 : Configurer l'extension Chrome

1. Cliquez sur l'icône de l'extension (en haut à droite)
2. Entrez l'URL du serveur Render
3. Cliquez sur "Sauvegarder"
4. Vous pouvez maintenant partager des fichiers !

---

## ✅ Checklist

- [ ] Node.js installé et vérifié
- [ ] Icônes créées dans les dossiers appropriés
- [ ] Dépendances npm installées
- [ ] Serveur testé localement
- [ ] Code poussé sur GitHub
- [ ] Serveur déployé sur Render
- [ ] PWA installée sur iPhone
- [ ] Extension Chrome configurée

---

## 🆘 Aide

### Le serveur ne démarre pas :
- Vérifiez que Node.js est installé : `node --version`
- Vérifiez les erreurs dans le terminal
- Essayez de supprimer `node_modules` et relancer `npm install`

### Les icônes ne s'affichent pas :
- Vérifiez que les fichiers PNG existent dans les dossiers `icons/`
- Vérifiez les noms des fichiers (sensible à la casse)
- Utilisez la console développeur pour voir les erreurs

### L'extension Chrome ne se connecte pas :
- Vérifiez l'URL du serveur (avec https://)
- Vérifiez que le serveur est accessible
- Regardez la console de l'extension (clic droit → Inspecter)

---

## 📞 Support

Pour plus d'aide, consultez :
- Documentation Node.js : https://nodejs.org/docs
- Documentation Render : https://render.com/docs
- Documentation PWA : https://web.dev/progressive-web-apps/
- Documentation Extensions Chrome : https://developer.chrome.com/docs/extensions/

---

**Bon courage ! 🚀**
