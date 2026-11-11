# ⚠️ VERSION D'ESSAI — PROOF OF CONCEPT

**Ce dépôt n'est PAS la boutique officielle.** La boutique officielle tourne sur **Google Apps Script** (adresse `boutique.fsggb.fr`) et c'est elle que le service informatique maintient.

Ce dépôt est une **expérimentation** : la même interface, servie par GitHub Pages (affichage plus rapide, pas de bandeau Google, connexion Google possible sans secret), les données restant dans Google Sheets / Drive via l'API Apps Script.

## Pourquoi c'est seulement un essai

- Le service informatique s'est volontairement limité à un seul environnement (Google Apps Script) pour que la maintenance reste simple après le départ de ses concepteurs. **Un second environnement (GitHub) ajoute de la complexité** : à n'adopter qu'après décision explicite.
- Si ce dépôt est supprimé ou cesse d'être mis à jour, **rien ne casse** : la boutique officielle fonctionne sans lui.

## Contenu (fichiers générés — ne pas modifier à la main)

Générés par `developpement/statique/construire.mjs` (dépôt `boutique-appscript`) :

- `pages/` : gabarits de la boutique (nom unique par contenu, gardés par le navigateur).
- `chargeur.js` : assemble gabarit + données de départ fournies par l'API Apps Script (`getPageBoutique`).
- `index.html`, `vendeur/`, `admin/` : points d'entrée. Un ruban rouge « VERSION D'ESSAI » reste affiché en haut.
- `.github/` : publication et instantané des données publiques de la boutique.

## Reconstruire

```bash
node developpement/statique/construire.mjs <dossier de ce dépôt> <adresse /exec Apps Script> --poc
```

À refaire après chaque publication Apps Script, pour que l'interface et l'API restent alignées.

## Pour connecter avec Google sur cette adresse

Ajouter l'origine `https://service-informatique-fsggb.github.io` aux « Origines JavaScript autorisées » de l'ID client Google commun.
