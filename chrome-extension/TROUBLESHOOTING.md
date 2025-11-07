# Guide de Dépannage - Extension Chrome Nebula

## 🔄 Comment recharger l'extension

1. Ouvrir `chrome://extensions/`
2. Trouver "Nebula"
3. Cliquer sur l'icône de rechargement ⟳
4. Fermer et rouvrir le popup de l'extension

**Important** : Toujours recharger l'extension après avoir modifié les fichiers !

## ✅ Corrections apportées

### Erreurs JavaScript corrigées :
- ✅ `Cannot read properties of null (reading 'classList')` → Ajout de vérifications `if (element)`
- ✅ Utilisation de `.classList.add('hidden')` au lieu de `.style.display`
- ✅ Utilisation de `chrome.runtime.getURL()` pour les icônes
- ✅ Gestion d'erreurs pour les notifications

### Améliorations CSS :
- ✅ Classes utilitaires Tailwind recréées en CSS natif
- ✅ Styles pour `.btn-primary`, `.btn-secondary`, `.btn-danger`
- ✅ Style `.empty-state` pour les listes vides
- ✅ Layout pour `.device-item` avec icône et info

## 🐛 Problèmes courants

### L'extension ne se charge pas
**Solution** : 
1. Vérifier que tous les fichiers sont présents (manifest.json, popup.html, popup.css, popup.js, background.js)
2. Vérifier la console des erreurs dans `chrome://extensions/`
3. Recharger l'extension

### "Cannot read properties of null"
**Solution** : 
1. Recharger l'extension (⟳)
2. Fermer et rouvrir le popup
3. Vérifier que tous les éléments HTML existent dans popup.html

### Styles non appliqués
**Solution** :
1. Vérifier que `popup.css` est bien lié dans `popup.html` : `<link rel="stylesheet" href="popup.css">`
2. Recharger l'extension
3. Vider le cache de l'extension (décharger puis recharger)

### "Serveur non accessible"
**Solution** :
1. Vérifier l'URL : `https://nebula-a50x.onrender.com`
2. Le serveur Render gratuit s'endort après 15 min → Premier accès peut prendre 30-60s
3. Vérifier dans le navigateur que le serveur répond : https://nebula-a50x.onrender.com/api/health

### Les notifications ne s'affichent pas
**Solution** :
1. Vérifier les permissions de notification dans Chrome
2. Vérifier que les icônes existent dans `chrome-extension/icons/`
3. Les erreurs de notification sont maintenant ignorées (`.catch()`)

## 📝 Checklist de test

- [ ] L'extension se charge sans erreur
- [ ] Le popup s'ouvre avec les styles corrects
- [ ] La configuration montre l'URL par défaut
- [ ] Le statut indique "Connecté" (point vert)
- [ ] Le bouton "Choisir un fichier" fonctionne
- [ ] L'upload affiche la progression (barre rose)
- [ ] La liste des fichiers s'affiche
- [ ] Le téléchargement fonctionne
- [ ] La liste des appareils s'affiche
- [ ] Les notifications apparaissent après upload

## 🔍 Débogage avancé

### Voir les logs de l'extension
1. `chrome://extensions/`
2. Cliquer sur "background.html" ou "Service worker" sous Nebula
3. La console du service worker s'ouvre

### Voir les logs du popup
1. Ouvrir le popup de l'extension
2. Clic droit → "Inspecter"
3. La console DevTools s'ouvre

### Tester la connexion au serveur
```javascript
// Dans la console du popup
fetch('https://nebula-a50x.onrender.com/api/health')
  .then(r => r.json())
  .then(console.log)
  .catch(console.error)
```

## 🆘 Si rien ne fonctionne

1. **Désinstaller complètement l'extension** :
   - `chrome://extensions/` → Supprimer Nebula
   
2. **Recharger les fichiers depuis GitHub** :
   ```bash
   git pull origin main
   ```

3. **Régénérer les icônes** :
   ```powershell
   .\scripts\create-placeholder-icons.ps1
   ```

4. **Réinstaller l'extension** :
   - `chrome://extensions/` → Mode développeur → Charger l'extension non empaquetée
   - Sélectionner le dossier `chrome-extension`

5. **Vérifier la console** pour toute nouvelle erreur
