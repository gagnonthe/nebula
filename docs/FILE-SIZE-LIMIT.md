# Configuration de la taille maximale des fichiers

## ⚙️ Limite actuelle : **100 MB**

La taille maximale des fichiers uploadables a été augmentée de **10 MB** à **100 MB**.

## 📋 Fichiers modifiés

### 1. Serveur (server/index.js)
```javascript
fileSize: parseInt(process.env.MAX_FILE_SIZE) || 104857600 // 100MB par défaut
```

### 2. Configuration environnement (.env.example)
```bash
MAX_FILE_SIZE=104857600  # 100 MB en bytes
```

### 3. Configuration Render (render.yaml)
```yaml
- key: MAX_FILE_SIZE
  value: 104857600
```

### 4. Interface PWA (public/index.html)
```html
<p class="text-xs text-gray-400">Max 100 Mo</p>
```

## 🎯 Comment modifier la limite

### Pour augmenter encore plus (ex: 500 MB)

1. **Calculer la taille en bytes**
   - 500 MB = 500 × 1024 × 1024 = 524,288,000 bytes

2. **Modifier les fichiers**
   
   **server/index.js** :
   ```javascript
   fileSize: parseInt(process.env.MAX_FILE_SIZE) || 524288000
   ```
   
   **.env et .env.example** :
   ```bash
   MAX_FILE_SIZE=524288000
   ```
   
   **render.yaml** :
   ```yaml
   - key: MAX_FILE_SIZE
     value: 524288000
   ```
   
   **public/index.html** :
   ```html
   <p class="text-xs text-gray-400">Max 500 Mo</p>
   ```

3. **Commit et push** pour déployer sur Render

## 💡 Conversions utiles

| Taille | Bytes | Note |
|--------|-------|------|
| 10 MB | 10,485,760 | Limite initiale |
| 50 MB | 52,428,800 | Petit fichier |
| 100 MB | 104,857,600 | **Limite actuelle** |
| 500 MB | 524,288,000 | Fichier moyen |
| 1 GB | 1,073,741,824 | Gros fichier |

## ⚠️ Considérations importantes

### Plan gratuit Render
- ✅ Pas de limite stricte de taille de fichier
- ⚠️ Timeout de 60 secondes pour les requêtes HTTP
- ⚠️ Bande passante limitée
- ⚠️ Fichiers perdus au redémarrage du serveur

### Recommandations
- **< 100 MB** : Optimal pour le plan gratuit
- **100-500 MB** : Possible mais peut être lent
- **> 500 MB** : Risque de timeout, non recommandé

### Pour des fichiers très lourds (> 1 GB)
Considérer :
- Plan payant Render avec plus de ressources
- Stockage externe (AWS S3, Google Cloud Storage)
- Upload en chunks/streaming
- Compression des fichiers

## 🔄 Appliquer les changements

### Local
```bash
# Mettre à jour .env
MAX_FILE_SIZE=104857600

# Redémarrer le serveur
npm run dev
```

### Production (Render)
Les changements sont automatiquement appliqués via `render.yaml` lors du prochain déploiement.

## 🧪 Tester

1. Ouvrir l'application : `https://nebula-a50x.onrender.com`
2. Essayer d'uploader un fichier de 50-100 MB
3. Vérifier que l'upload fonctionne sans erreur "File too large"

## 📊 Performances attendues

| Taille | Temps d'upload (4G) | Temps d'upload (WiFi) |
|--------|---------------------|----------------------|
| 10 MB | ~3 secondes | ~1 seconde |
| 50 MB | ~15 secondes | ~5 secondes |
| 100 MB | ~30 secondes | ~10 secondes |
| 500 MB | ~2.5 minutes | ~50 secondes |

*Ces temps sont approximatifs et dépendent de la connexion et de la charge du serveur.*
