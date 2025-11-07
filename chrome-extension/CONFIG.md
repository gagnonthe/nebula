# Configuration de l'extension Chrome Nebula

## Installation

1. Ouvrir Chrome et aller sur `chrome://extensions/`
2. Activer le "Mode développeur" (en haut à droite)
3. Cliquer sur "Charger l'extension non empaquetée"
4. Sélectionner le dossier `chrome-extension`

## Configuration automatique

L'extension est pré-configurée avec l'URL du serveur Render :
```
https://nebula-a50x.onrender.com
```

Au premier lancement, l'URL sera automatiquement sauvegardée.

## Utilisation

1. **Cliquer sur l'icône de l'extension** dans la barre d'outils Chrome
2. **Uploader un fichier** : Cliquer sur "Choisir un fichier"
3. **Télécharger** : Cliquer sur le bouton de téléchargement à côté du fichier
4. **Voir les appareils connectés** : Liste automatiquement mise à jour

## Notifications

L'extension vérifie automatiquement les nouveaux fichiers toutes les 5 minutes et affiche une notification si de nouveaux fichiers sont disponibles.

## Problèmes courants

### L'extension ne se charge pas
- Vérifier que tous les fichiers sont présents
- Recharger l'extension sur `chrome://extensions/`

### Pas de connexion au serveur
- Vérifier que l'URL est correcte dans la configuration
- Le serveur Render peut prendre 30-60s à se réveiller après inactivité

### Styles non appliqués
- Recharger l'extension
- Vérifier que `popup.css` est bien présent

## Notes

- Les icônes actuelles sont des placeholders (1x1 pixel)
- Pour des vraies icônes, visitez [favicon.io](https://favicon.io/favicon-generator/)
