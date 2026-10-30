/*
  BOUTIQUE SERVIE PAR GITHUB — chargeur (complete par construire.mjs).

  Difference avec le chargeur actuel (developpement/integration-site/) : la
  page n'est plus fabriquee par Apps Script a chaque visite. Les gabarits
  sont des fichiers statiques (pages/*.html, prepares par construire.mjs),
  gardes par le navigateur ; l'API (getPageBoutique, BACK_Launch.js) ne
  renvoie que le gabarit a utiliser et les donnees de depart. Les deux sont
  demandes EN MEME TEMPS, puis la page est assemblee ici.

  Toujours sans aucun cookie (credentials: "omit") : tout visiteur est
  anonyme pour Google, quels que soient ses comptes. Voir BACK_AppelsAnonymes.js.

  Adresses : <racine>/vendeur, /admin, /test = ?mode=vendeur... ; tous les
  parametres de l'adresse sont transmis (?a=, ?r=, ?mode=paiement...).
*/
(function () {
  var EXEC = "https://script.google.com/macros/s/AKfycbwW5GeOkiFxzGFXulOqIjNqGaZEMEk8QnHiHujMLhS59MN09ECAXTZITMmCuFcn3aLD/exec";
  var PAGES = {"client":"pages/client.ee29ca8f79.html","vendeur":"pages/vendeur.0d04357d90.html","admin":"pages/admin.420e1bd765.html","test":"pages/test.5104de4fce.html","paiement":"pages/paiement.2076f9aa7b.html","reception":"pages/reception.41e2612186.html","colis":"pages/colis.efbc63fd6e.html","rupture":"pages/rupture.560e4175a2.html","avis":"pages/avis.02b35c78a7.html","vendeur-autotest":"pages/vendeur-autotest.bd3ecda6c4.html"};
  var RACINE = new URL(".", document.currentScript.src).href;
  var CACHE_GABARITS = "boutique-gdb-gabarits";
  var CLE_DONNEES = "boutique-gdb-donnees-";   // + nom de l'instantane
  var DUREE_MAX = 7 * 86400000;
  var PAGE_DU_FICHIER = {
    HTML_Main: "client", HTML_Vendeur: "vendeur", HTML_Admin: "admin", "tests/HTML_Test": "test",
    HTML_Paiement: "paiement", HTML_Reception: "reception", HTML_Colis: "colis",
    HTML_Rupture: "rupture", HTML_Avis: "avis"
  };

  var params = {};
  new URLSearchParams(location.search).forEach(function (v, k) { params[k] = v; });
  var chemin = location.pathname.match(/\/(vendeur|admin|test)\/?(?:index\.html)?$/);
  if (chemin && !params.mode && !params.page) params.mode = chemin[1];
  // Donnees gardees dans le navigateur et instantane publie : pages SANS
  // parametre dans l'adresse seulement (/, /vendeur, /admin, /test). Un lien
  // personnel (?ref=, ?adminMagic=, ?a=...) demande toujours le serveur.
  var instantane = location.search.length > 1 ? "" : (chemin ? chemin[1] : "client");
  // La page de test n'a pas de donnees de depart : jamais besoin du serveur.
  var SANS_SERVEUR = { test: { titre: "Boutique GDB - Tests", bootstrap: {} } };

  // Meme regle que decrirePageWeb_ (BACK_Launch.js), pour demander le bon
  // gabarit sans attendre le serveur ; la reponse du serveur fait foi.
  function pagePrevue() {
    var mode = String(params.mode || params.page || "");
    if (!mode && params.a) mode = "vendeur";
    if (!mode && params.r) mode = "reception";
    if (!mode && params.p) mode = "colis";
    mode = mode.toLowerCase();
    if (mode === "calques") mode = "vendeur";
    if (mode === "vendeur") return params.autotest === "1" ? "vendeur-autotest" : "vendeur";
    return PAGES[mode] && mode !== "vendeur-autotest" ? mode : "client";
  }

  function pageDeLaReponse(reponse) {
    var page = PAGE_DU_FICHIER[reponse.fichier];
    if (!page) throw new Error("page inconnue : " + reponse.fichier);
    return page === "vendeur" && reponse.autotest ? "vendeur-autotest" : page;
  }

  // ----- Gabarits : nom unique par contenu, gardes sans limite de duree -----
  var gabarits = {};
  function gabarit(page) {
    if (gabarits[page]) return gabarits[page];
    var url = new URL(PAGES[page], RACINE).href;
    var cache = window.caches ? caches.open(CACHE_GABARITS).catch(function () { return null; }) : Promise.resolve(null);
    gabarits[page] = cache.then(function (c) {
      return (c ? c.match(url) : Promise.resolve(null)).then(function (garde) {
        if (garde) return garde.text();
        return fetch(url).then(function (r) {
          if (!r.ok) throw new Error("gabarit " + page + " : erreur " + r.status);
          if (c) c.put(url, r.clone()).catch(function () { /* stockage plein */ });
          return r.text();
        });
      });
    });
    return gabarits[page];
  }

  // Les gabarits d'une version precedente ne servent plus.
  function menage() {
    if (!window.caches) return;
    var actuels = Object.keys(PAGES).map(function (p) { return new URL(PAGES[p], RACINE).href; });
    caches.open(CACHE_GABARITS).then(function (c) {
      return c.keys().then(function (cles) {
        cles.forEach(function (req) { if (actuels.indexOf(req.url) === -1) c.delete(req); });
      });
    }).catch(function () {});
  }

  // ----- Donnees de depart (API) -----
  function demanderPage() {
    return fetch(EXEC, {
      method: "POST",
      credentials: "omit",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify({ __appelBoutique: "getPageBoutique", args: [params] })
    }).then(function (r) {
      if (!r.ok) throw new Error("serveur : erreur " + r.status);
      return r.json();
    }).then(function (reponse) {
      if (!reponse || !reponse.ok) throw new Error(reponse && reponse.erreur || "réponse inattendue");
      return reponse.valeur;
    });
  }

  function lireDonnees() {
    if (!instantane) return null;
    try {
      var copie = JSON.parse(localStorage.getItem(CLE_DONNEES + instantane) || "null");
      if (copie && copie.page && PAGES[copie.page] && Date.now() - copie.date < DUREE_MAX) return copie;
    } catch (e) { /* stockage indisponible */ }
    return null;
  }

  function ecrireDonnees(page, reponse) {
    if (!instantane) return;
    try {
      localStorage.setItem(CLE_DONNEES + instantane, JSON.stringify({ date: Date.now(), page: page, titre: reponse.titre, bootstrap: reponse.bootstrap }));
    } catch (e) { /* plein ou bloque */ }
  }

  // ----- Assemblage et affichage -----
  // Comme jsonPourScript_ (BACK_Launch.js) : un "</script>" dans un texte
  // (description d'article...) ne doit pas fermer la balise.
  function jsonPourScript(valeur) {
    return JSON.stringify(valeur === undefined ? null : valeur)
      .replace(/</g, "\\u003c").replace(/\u2028/g, "\\u2028").replace(/\u2029/g, "\\u2029");
  }

  function assembler(html, bootstrap) {
    // Adresse de la boutique pour les liens que la page fabrique elle-meme
    // (elle tourne dans un cadre about:srcdoc, sans adresse propre).
    var racine = "<script>window.URL_RACINE_BOUTIQUE = " + jsonPourScript(RACINE) + ";</script>";
    return html
      .replace(/<head[^>]*>/i, function (balise) { return balise + racine; })
      .replace("__BOOTSTRAP_JSON__", function () { return jsonPourScript(bootstrap); });
  }

  var cadre = null;
  var touche = false;
  function noterInteraction() { touche = true; }

  function afficher(html, titre) {
    var nouveau = document.createElement("iframe");
    nouveau.className = "page";
    nouveau.title = titre || "Boutique GDB";
    nouveau.addEventListener("load", function () {
      try {
        ["pointerdown", "keydown", "input", "touchstart"].forEach(function (type) {
          nouveau.contentWindow.addEventListener(type, noterInteraction, true);
        });
      } catch (e) { touche = true; }   // sans suivi possible : jamais de remplacement
    });
    nouveau.srcdoc = html;
    document.body.appendChild(nouveau);
    if (cadre) cadre.remove();
    cadre = nouveau;
    if (titre) document.title = titre;
    var attente = document.getElementById("chargeur");
    if (attente) attente.remove();
  }

  function echec(raison) {
    var attente = document.getElementById("chargeur");
    if (!attente) return;   // une copie est deja affichee : on la garde
    attente.innerHTML =
      "<p>La boutique n'a pas pu être chargée (" + String(raison).replace(/</g, "&lt;") + ").</p>" +
      '<p><a href="' + location.href.replace(/"/g, "%22") + '">Réessayer</a></p>';
  }

  // ----- Deroulement -----
  // Ce qui est affiche : page et donnees (pour ne pas reafficher a l'identique).
  var affiche = null;
  var aJour = false;   // la reponse du serveur est arrivee : plus d'affichage provisoire

  function montrer(page, titre, bootstrap) {
    return gabarit(page).then(function (html) {
      afficher(assembler(html, bootstrap), titre);
      affiche = { page: page, json: JSON.stringify(bootstrap) };
    });
  }

  // Affichage provisoire (copie gardee ou instantane publie) : jamais apres
  // la reponse du serveur, ni par-dessus une page deja affichee.
  function montrerProvisoire(donnees) {
    if (!donnees || !donnees.page || !PAGES[donnees.page] || aJour || affiche) return Promise.resolve();
    return gabarit(donnees.page).then(function (html) {
      if (aJour || affiche) return;
      afficher(assembler(html, donnees.bootstrap), donnees.titre);
      affiche = { page: donnees.page, json: JSON.stringify(donnees.bootstrap) };
    }).catch(function () { /* la reponse du serveur prendra le relais */ });
  }

  // 0. Page sans donnees (tests) : affichee tout de suite, sans serveur.
  if (SANS_SERVEUR[instantane]) {
    montrer(instantane, SANS_SERVEUR[instantane].titre, SANS_SERVEUR[instantane].bootstrap)
      .catch(function (err) { echec(err && err.message || err); });
    return;
  }

  // 1. Page sans parametre : la copie gardee par ce navigateur, sinon
  //    l'INSTANTANE publie avec le site (donnees/<page>.json, republie par
  //    GitHub des que les donnees changent : BACK_Github.js). Affichage
  //    immediat, sans attendre Apps Script.
  if (instantane) {
    var copie = lireDonnees();
    if (copie) montrerProvisoire(copie);
    else {
      fetch(new URL("donnees/" + instantane + ".json", RACINE).href, { cache: "no-cache" })
        .then(function (r) { return r.ok ? r.json() : null; })
        .then(montrerProvisoire)
        .catch(function () { /* pas d'instantane : on attend le serveur */ });
    }
  }

  // 2. En meme temps : gabarit prevu + donnees a jour (API). Elles remplacent
  //    l'affichage provisoire si elles different et que le visiteur n'a encore
  //    rien touche ; sinon elles serviront a la visite suivante.
  var prevue = pagePrevue();
  gabarit(prevue).catch(function () { /* redemande plus bas si besoin */ });
  demanderPage().then(function (reponse) {
    var page = pageDeLaReponse(reponse);
    return gabarit(page).then(function (html) {
      aJour = true;
      ecrireDonnees(page, reponse);
      var json = JSON.stringify(reponse.bootstrap);
      if (!affiche || (!touche && (affiche.page !== page || affiche.json !== json))) {
        afficher(assembler(html, reponse.bootstrap), reponse.titre);
        affiche = { page: page, json: json };
      }
      menage();
    });
  }).catch(function (err) { echec(err && err.message || err); });
})();
