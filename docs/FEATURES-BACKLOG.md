# Nebula — Features Backlog

Ce document liste les idées d’évolutions pour Nebula, classées par priorité, avec objectifs, critères d’acceptation, complexité (estimation grossière) et dépendances.

Légende complexité: S (≤2h), M (≈3–6h), L (≈1–2j), XL (>2j)
Statut: idea | planned | in-progress | done | blocked

## 🚀 Prioritaires

### 1) Partage ciblé par appareil (🎯)
- Statut: idea — Complexité: M — Impact: élevé
- Objectif: Envoyer un fichier à un appareil spécifique plutôt que "tous".
- Détails: Dropdown de sélection d’appareil sur PWA et extension; notification uniquement pour la cible.
- Critères d’acceptation:
  - [ ] Champ de sélection d’appareil visible quand des appareils sont connectés
  - [ ] Upload inclut `targetDevice` côté client et serveur relaie uniquement à la cible
  - [ ] La cible reçoit la notification; les autres non
  - [ ] Fallback propre vers "all" si aucune cible n’est choisie
- Dépendances: liste d’appareils déjà disponible via Socket.IO ✅

### 2) Presse‑papier partagé (📋)
- Statut: idea — Complexité: M — Impact: très élevé
- Objectif: Coller/copier du texte entre appareils (PWA ↔ Extension) instantanément.
- Critères d’acceptation:
  - [ ] Champ texte + bouton "Envoyer" (PWA et extension)
  - [ ] Événement temps réel `clipboard-updated` avec metadata (source, horodatage)
  - [ ] Historique local des 10 derniers éléments
  - [ ] Paramètre pour désactiver l’écoute automatique
- Dépendances: nouveaux events Socket.IO, endpoints REST minimal

### 3) Aperçu des fichiers (👁️)
- Statut: idea — Complexité: M — Impact: élevé
- Objectif: Visualiser images / PDF / audio avant téléchargement.
- Critères d’acceptation:
  - [ ] Aperçu image (jpg/png/webp) inline
  - [ ] PDF viewer via `<embed>`/`object` + fallback download
  - [ ] Audio/video via `<audio>`/`<video>` si supportés
  - [ ] Désactivation via un toggle si souhaité

### 4) Mode sombre (🌙)
- Statut: idea — Complexité: S — Impact: visuel fort
- Objectif: Thème dark/light avec persistance `localStorage`, support `prefers-color-scheme`.
- Critères d’acceptation:
  - [ ] Toggle UI + auto selon le système
  - [ ] Contrastes AA, couleurs d’accent conservées
  - [ ] Icônes/favicons adaptés si nécessaire

### 5) Historique des fichiers (📜)
- Statut: idea — Complexité: S — Impact: moyen
- Objectif: Voir les fichiers récemment partagés, quick actions.
- Critères d’acceptation:
  - [ ] Section historique locale (localStorage) avec 20 entrées max
  - [ ] Bouton "repartager" rapide
  - [ ] Possibilité d’effacer l’historique

---

## 💎 Avancées

### 6) Connexion par QR code (📱)
- Statut: idea — Complexité: M — Impact: élevé
- Objectif: Scanner un QR (URL + deviceId) pour connecter un nouvel appareil.
- Critères: page QR sur desktop, scan PWA, auto-configuration de l’URL serveur.

### 7) Chiffrement de bout en bout (🔐)
- Statut: idea — Complexité: L — Impact: sécurité élevée
- Objectif: Chiffrer fichiers/clipboard côté client avec clé partagée.
- Critères: génération/échange de clés, chiffrement AES-GCM, stockage non réversible côté serveur.

### 8) Dossiers virtuels (📁)
- Statut: idea — Complexité: M — Impact: organisation
- Objectif: Grouper des fichiers par "collection" côté client.
- Critères: créer/renommer/supprimer collection, filtrer liste.

### 9) Compression automatique (🗜️)
- Statut: idea — Complexité: M — Impact: perf/réseau
- Objectif: Compresser images (qualité réglable) avant upload.
- Critères: qualité 0.6 par défaut, estimation de gain, toggle désactivation.

### 10) Liens de partage éphémères (🔗)
- Statut: idea — Complexité: L — Impact: partage externe
- Objectif: Générer lien public temporaire (TTL configurable).
- Critères: URL unique, expiration, option protection par code.

---

## 🎨 Améliorations UX

11) Drag & drop multi‑fichiers (📦) — M
- Multi‑upload, barre de progression globale, file queue.

12) Recherche et tri (🔍) — M
- Recherche par nom/type/date, tri par taille/date.

13) Thèmes personnalisés (🎨) — M
- Variantes de couleurs (Nebula Pink, Ocean Blue…), mode haute visibilité.

14) Sons/Vibrations (🔔) — S
- Son/vibration à la réception, option désactivable.

15) Statistiques d’usage (📊) — M
- Compteur fichiers, bande passante, graph simple.

---

## 🔧 Techniques

16) Mode hors‑ligne (✈️) — L
- SW étendu, cache récents, sync au retour en ligne.

17) Transfert P2P WebRTC (🚄) — XL
- Négociation via Socket.IO, transfert direct quand possible.

18) API publique (🔌) — M
- Endpoints documentés, webhook de nouveaux fichiers.

19) Quotas/limitations (💾) — M
- Limites par appareil/utilisateur, alertes, nettoyage.

20) Multi‑utilisateurs (👥) — L
- Espaces isolés, invitations, partage sélectif entre comptes.

---

## 📅 Propositions de Roadmap

- Sprint court (1–2 semaines): 1) Partage ciblé, 4) Mode sombre, 11) Multi‑fichiers
- Sprint moyen (2–3 semaines): 2) Presse‑papier, 3) Aperçu fichiers, 12) Recherche/tri
- Sprint long: 7) E2E, 17) WebRTC, 20) Multi‑utilisateurs

---

## ✅ Suivi

Utilisez cette checklist pour choisir et suivre une feature:
- [ ] Spécifier précisément l’UX (maquettes simples si besoin)
- [ ] Définir l’API/événements
- [ ] Implémenter côté serveur
- [ ] Implémenter PWA
- [ ] Implémenter Extension
- [ ] Tests iPhone + PC
- [ ] Docs (README + /docs)
- [ ] Déploiement Render

---

Notes: ce backlog est vivant. Ajoutez vos idées, ajustez priorités, cochez quand c’est livré.
