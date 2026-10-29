# Boutique GDB — version d'essai servie par GitHub

Fichiers **générés** par `developpement/statique/construire.mjs` (dépôt source de la boutique) : ne pas les modifier ici.

- `pages/` : gabarits de la boutique (nom unique par contenu, gardés par le navigateur).
- `chargeur.js` : assemble gabarit + données de départ fournies par l'API Apps Script (`getPageBoutique`).
- `index.html`, `vendeur/`, `admin/`, `test/` : points d'entrée.
- `.github/` : publication et instantané des données publiques de la boutique (toutes les 10 min).

Les données (commandes, stock, clients) restent dans Google Sheets / Drive ; seule l'interface est ici.
