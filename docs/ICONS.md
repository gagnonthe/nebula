# Instructions pour créer les icônes

## Pour la PWA (iPhone)

Créez des icônes PNG aux tailles suivantes dans le dossier `public/icons/`:
- icon-72x72.png
- icon-96x96.png
- icon-128x128.png
- icon-144x144.png
- icon-152x152.png
- icon-192x192.png
- icon-384x384.png
- icon-512x512.png

## Pour l'extension Chrome

Créez des icônes PNG aux tailles suivantes dans le dossier `chrome-extension/icons/`:
- icon16.png
- icon32.png
- icon48.png
- icon128.png

## Outils recommandés

1. **En ligne**: https://favicon.io/favicon-generator/
   - Créez une icône simple avec un emoji 📁
   - Téléchargez et redimensionnez aux tailles nécessaires

2. **Avec un outil**:
   - Figma (gratuit)
   - Canva (gratuit)
   - GIMP (gratuit, open source)

3. **Rapide avec emoji**:
   - Utilisez https://favicon.io/emoji-favicons/file-folder/
   - Téléchargez le pack
   - Redimensionnez pour obtenir toutes les tailles

## Design suggéré

Utilisez l'emoji 📁 (dossier) ou 🔗 (lien) comme icône principale avec:
- Fond: #4F46E5 (violet/indigo)
- Emoji/Symbole: blanc
- Forme: carré avec coins légèrement arrondis

## Commande PowerShell pour créer les dossiers

```powershell
New-Item -ItemType Directory -Force -Path "public/icons"
New-Item -ItemType Directory -Force -Path "chrome-extension/icons"
```
