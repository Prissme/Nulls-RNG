/* ════════════════════════════════════════════════
   roll.js — Algorithme de tirage & logique de roll
════════════════════════════════════════════════ */

/* ── Encapsulation anti-exploit ──
   tirerBrawlerPondere() et effectuerTirage() ne sont utilisées qu'ICI.
   Elles sont volontairement gardées hors de `window` (IIFE) pour qu'un
   script console ne puisse pas les réassigner (ex: forcer un variant
   "monochrome" garanti) puis appeler la vraie effectuerRoll() pour faire
   passer le résultat truqué par le pipeline légitime (_invMutation, etc).
   Seule effectuerRoll() — la seule fonction appelée par les autres
   fichiers — est exposée sur window, en fin de fichier. */
(function () {

  /* Tirage pondéré d'un brawler (plus un brawler est rare — div élevé —
     moins il a de poids), utilisé quand la Potion de Shiny est active. */
  function tirerBrawlerPondere() {
    const poids = BRAWLERS.map(b => 1 / b.div);
    const total = poids.reduce((a, c) => a + c, 0);
    let r = Math.random() * total;
    for (let i = 0; i < BRAWLERS.length; i++) {
      r -= poids[i];
      if (r <= 0) return BRAWLERS[i];
    }
    return BRAWLERS[BRAWLERS.length - 1];
  }

  function effectuerTirage() {
    // Potion de Shiny active : tous les rolls renvoient un Shiny garanti
    if (etat.shinyActive) {
      return { brawler: tirerBrawlerPondere(), variante: 'shiny' };
    }

    // Potion Golden active : tous les rolls renvoient un Golden garanti
    if (etat.goldenActive) {
      return { brawler: tirerBrawlerPondere(), variante: 'golden' };
    }

    const luckMult = luckMultiplierTotal();

    // FIX : on doit tester les brawlers du PLUS RARE au PLUS COMMUN à
    // l'intérieur de chaque palier de variante. C'est un tirage séquentiel
    // "premier qui passe gagne, sinon on continue" : si on teste le plus
    // commun en premier (Shelly, div=5 → ~20%+ de chance par roll), il
    // gagne presque systématiquement la branche "normal" avant même que
    // Colt/Nita/etc. soient évalués, ce qui écrasait quasiment tous les
    // brawlers communs/rares au profit de Shelly. En testant du plus rare
    // (div élevé, faible chance) au plus commun (div faible, forte chance),
    // chaque brawler a sa vraie chance d'être tiré avant que le plus
    // commun n'absorbe le reste du tirage en dernier recours.
    for (const vKey of ORDRE_VARIANTES) {
      const v = VARIANTES[vKey];
      for (const b of [...BRAWLERS].sort((a, b2) => b2.div - a.div)) {
        const chanceBase      = 1 / b.div;
        const chanceEffective = (chanceBase * luckMult) / v.chanceMult;
        if (Math.random() < chanceEffective) {
          return { brawler: b, variante: vKey };
        }
      }
    }
    return { brawler: BRAWLERS[0], variante: 'normal' };
  }

  function effectuerRoll() {
    const { brawler, variante } = effectuerTirage();
    etat.totalRolls++;

    // ── Snapshot inventaire AVANT d'incrémenter (pour détecter les lucky pulls)
    const inventaireAvant = Object.assign({}, etat.inventaire);

    const k = cle(brawler.id, variante);
    _invMutation(() => { etat.inventaire[k] = (etat.inventaire[k] || 0) + 1; });

    etat.historique.unshift({ brawler, variante });
    if (etat.historique.length > 6) etat.historique.pop();

    // Son selon la variante obtenue
    if      (variante === 'monochrome') Sound.monochrome();
    else if (variante === 'rainbow')    Sound.rainbow();
    else if (variante === 'golden')     Sound.golden();
    else if (variante === 'shiny')      Sound.shiny();
    else                                 Sound.roll();

    // Progression quêtes
    progresserQuete('roll', { brawlerId: brawler.id, variante });

    // Progression succès
    if (typeof checkAchievementsRoll === 'function') checkAchievementsRoll(brawler.id, variante);

    afficherResultat(brawler, variante);
    mettreAJourCompteurs();
    afficherInventaire();
    afficherHistorique();
    afficherCraft();

    // Rafraîchir l'index si ouvert
    if (document.getElementById('modalIndex') &&
        document.getElementById('modalIndex').classList.contains('open')) {
      afficherIndex();
    }

    // ── Lucky Pull : animation + notification Discord
    gererLuckyPull(brawler, variante, inventaireAvant);
  }

  // Seul point d'entrée exposé — tirerBrawlerPondere/effectuerTirage restent privées
  window.effectuerRoll = effectuerRoll;

})();
