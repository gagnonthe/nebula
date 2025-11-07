# Configuration Auto-Approval pour Copilot

## 📋 Configuration Actuelle

Le fichier `.vscode/settings.json` configure l'auto-approval pour les commandes sûres :

### ✅ Commandes Git Auto-Approuvées
- `git status`, `git log`, `git diff` - Lecture seule
- `git add` - Staging des fichiers
- `git commit -m "message"` - Commits avec message
- `git push` - Push vers la branche courante

### ✅ Commandes Système Auto-Approuvées
- `cd`, `ls`, `dir` - Navigation et listage
- `Get-Item`, `Get-Content -First N` - Lecture PowerShell

### ✅ Commandes Node.js Auto-Approuvées
- `npm install`, `npm ci`, `npm start` - Gestion npm
- `node script.js` - Exécution de scripts
- `.\scripts\portable-setup-and-run.ps1` - Setup local

## 🔧 Personnalisation

Pour ajouter d'autres commandes, éditer `.vscode/settings.json` :

```json
{
  "approve": "^votre-commande.*",
  "reason": "Description de pourquoi c'est sûr"
}
```

### Format Regex
Les patterns utilisent des **regex** (expressions régulières) :
- `^` : Début de ligne
- `.*` : N'importe quel caractère, plusieurs fois
- `$` : Fin de ligne
- `\\` : Échappement de caractères spéciaux

### Exemples

**Approuver tous les grep/Select-String** :
```json
{
  "approve": "^(grep|Select-String) .*",
  "reason": "Safe text search"
}
```

**Approuver la création de dossiers** :
```json
{
  "approve": "^(mkdir|New-Item -ItemType Directory) .*",
  "reason": "Safe directory creation"
}
```

**Approuver les tests** :
```json
{
  "approve": "^npm (test|run test:.*)",
  "reason": "Run tests safely"
}
```

## ⚠️ Commandes NON Auto-Approuvées (Requièrent Confirmation)

Pour la sécurité, certaines commandes nécessitent toujours une confirmation :
- ❌ `rm -rf`, `Remove-Item -Recurse` - Suppression récursive
- ❌ `git reset --hard` - Perte potentielle de données
- ❌ `npm publish` - Publication de packages
- ❌ Commandes avec `sudo` ou privilèges admin
- ❌ Scripts inconnus ou externes

## 🎯 Bonnes Pratiques

### ✅ À Faire
- Approuver les commandes **lecture seule**
- Approuver les opérations **réversibles**
- Approuver les commandes **fréquentes et sûres**
- Utiliser des patterns **spécifiques**

### ❌ À Éviter
- Approuver des patterns **trop génériques** (`.*` seul)
- Approuver des commandes **destructives**
- Approuver des scripts **non vérifiés**
- Approuver des commandes **avec effets de bord importants**

## 📚 Documentation

Pour plus d'informations sur la configuration :
- [VS Code Settings Reference](https://code.visualstudio.com/docs/getstarted/settings)
- [GitHub Copilot Configuration](https://docs.github.com/copilot)
- [Regex Tester](https://regex101.com/) - Pour tester vos patterns

## 🔄 Mise à Jour

Pour modifier la configuration :
1. Ouvrir `.vscode/settings.json`
2. Ajouter/modifier les règles dans `runCommand.autoApprove`
3. Sauvegarder (VS Code applique immédiatement)
4. Tester avec une commande correspondante

## 🧪 Test

Pour tester si une commande est auto-approuvée :
1. Demander à Copilot d'exécuter la commande
2. Si approuvée automatiquement → ✅ Pattern correspond
3. Si demande confirmation → ❌ Pattern ne correspond pas ou absent

---

**Note** : Cette configuration est spécifique au workspace Nebula et ne s'applique qu'à ce projet.
