// Ecrit donnees/<page>.json : les donnees de depart de chaque page sans
// parametre (/, /vendeur, /admin), demandees a l'API Apps Script
// (getPageBoutique), comme le ferait un visiteur anonyme. Ce ne sont que des
// donnees PUBLIQUES (catalogue, rayons, reglages d'affichage, logos) : sans
// parametre, l'API ne renvoie rien de personnel ni aucune session. En cas
// d'echec, on reprend l'instantane deja en ligne s'il a moins d'un jour ;
// sinon pas d'instantane pour cette page (le site attend alors le serveur).
// Memes pages que GITHUB_PAGES_INSTANTANE (BACK_Github.js).
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';

const PAGES = {
  client: { params: {}, fichier: 'HTML_Main' },
  vendeur: { params: { mode: 'vendeur' }, fichier: 'HTML_Vendeur' },
  admin: { params: { mode: 'admin' }, fichier: 'HTML_Admin' }
};

const chargeur = readFileSync('chargeur.js', 'utf8');
const exec = JSON.parse(chargeur.match(/var EXEC = ("[^"]+")/)[1]);
const enLigne = process.env.URL_SITE || '';
mkdirSync('donnees', { recursive: true });

async function depuisApi(page, { params, fichier }) {
  for (let essai = 1; essai <= 3; essai++) {
    try {
      const r = await fetch(exec, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({ __appelBoutique: 'getPageBoutique', args: [params] }),
        redirect: 'follow'
      });
      const reponse = await r.json();
      if (!reponse.ok) throw new Error(reponse.erreur);
      if (reponse.valeur.fichier !== fichier) throw new Error('page inattendue : ' + reponse.valeur.fichier);
      return { date: Date.now(), page, titre: reponse.valeur.titre, bootstrap: reponse.valeur.bootstrap };
    } catch (e) {
      console.log(`${page}, essai ${essai} : ${e.message}`);
    }
  }
  return null;
}

async function depuisLeSite(page) {
  if (!enLigne) return null;
  try {
    const precedent = await (await fetch(new URL(`donnees/${page}.json`, enLigne))).json();
    if (Date.now() - precedent.date < 86400000) return precedent;
  } catch (e) { /* rien en ligne */ }
  return null;
}

await Promise.all(Object.entries(PAGES).map(async ([page, description]) => {
  const donnees = (await depuisApi(page, description)) || (await depuisLeSite(page));
  if (!donnees) return console.log(`${page} : pas d'instantane cette fois`);
  writeFileSync(`donnees/${page}.json`, JSON.stringify(donnees));
  console.log(`${page} : instantane ecrit (${JSON.stringify(donnees.bootstrap).length} caracteres)`);
}));
