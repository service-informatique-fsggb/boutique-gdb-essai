// Ecrit donnees/client.json : les donnees de depart de la boutique client,
// demandees a l'API Apps Script (getPageBoutique), comme le ferait un
// visiteur anonyme. Ce ne sont que des donnees PUBLIQUES (catalogue,
// rayons, reglages d'affichage) : l'API ne renvoie rien de personnel sans
// parametre. En cas d'echec, on reprend l'instantane deja en ligne s'il a
// moins d'un jour ; sinon pas d'instantane (le site attend alors le serveur).
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';

const chargeur = readFileSync('chargeur.js', 'utf8');
const exec = JSON.parse(chargeur.match(/var EXEC = ("[^"]+")/)[1]);
const enLigne = process.env.URL_SITE || '';
mkdirSync('donnees', { recursive: true });

async function depuisApi() {
  for (let essai = 1; essai <= 3; essai++) {
    try {
      const r = await fetch(exec, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({ __appelBoutique: 'getPageBoutique', args: [{}] }),
        redirect: 'follow'
      });
      const reponse = await r.json();
      if (!reponse.ok) throw new Error(reponse.erreur);
      if (reponse.valeur.fichier !== 'HTML_Main') throw new Error('page inattendue : ' + reponse.valeur.fichier);
      return { date: Date.now(), page: 'client', titre: reponse.valeur.titre, bootstrap: reponse.valeur.bootstrap };
    } catch (e) {
      console.log(`essai ${essai} : ${e.message}`);
    }
  }
  return null;
}

let donnees = await depuisApi();
if (!donnees && enLigne) {
  try {
    const precedent = await (await fetch(new URL('donnees/client.json', enLigne))).json();
    if (Date.now() - precedent.date < 86400000) donnees = precedent;
  } catch (e) { /* rien en ligne */ }
}
if (donnees) {
  writeFileSync('donnees/client.json', JSON.stringify(donnees));
  console.log('instantane ecrit : ' + donnees.bootstrap.catalogue.length + ' produit(s)');
} else {
  console.log('pas d\'instantane cette fois');
}
