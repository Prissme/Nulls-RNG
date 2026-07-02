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
      for (const b of BRAWLERS_PAR_RARETE_DESC) {
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
    let { brawler, variante } = effectuerTirage();
    etat.totalRolls++;

    // FIX quêtes "d'affilée / sans pause" (r2/dr2) : mesure le temps
    // écoulé depuis le dernier roll pour détecter une vraie pause. Sans
    // ça, ces quêtes se comportaient exactement comme "effectuer N rolls".
    const maintenant   = Date.now();
    const pauseDetectee = !!(etat.dernierRollTs && (maintenant - etat.dernierRollTs) > QUETE_STREAK_PAUSE_MS);
    etat.dernierRollTs = maintenant;

    // ── Roulette Bénie : chance de upgrader un roll normal en Shiny ──
    if (variante === 'normal' && Math.random() < luckrollChance()) {
      variante = 'shiny';
    }

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
    progresserQuete('roll', { brawlerId: brawler.id, variante, pause: pauseDetectee });

    // Progression succès
    if (typeof checkAchievementsRoll === 'function') checkAchievementsRoll(brawler.id, variante);

    afficherResultat(brawler, variante);
    mettreAJourCompteurs();
    // FIX perf : l'inventaire et le craft ne sont visibles que dans une
    // modale fermée la plupart du temps. Les reconstruire entièrement à
    // CHAQUE roll (jusqu'à 40 rolls/s en Auto-Roll boosté) provoquait des
    // lags importants pour un rendu que personne ne regardait. On ne les
    // rafraîchit désormais que si la modale correspondante est ouverte ;
    // ouvrirModal() se charge de les rafraîchir au moment de l'ouverture.
    const invOuverte   = document.getElementById('modalInventaire')?.classList.contains('open');
    const craftOuverte = document.getElementById('modalCraft')?.classList.contains('open');
    if (invOuverte)   afficherInventaire();
    if (craftOuverte) afficherCraft();
    afficherHistorique();

    // ── Multi-Drop : chance d'obtenir un brawler bonus supplémentaire ──
    if (Math.random() < multidropChance()) {
      const { brawler: b2, variante: v2 } = effectuerTirage();
      const k2 = cle(b2.id, v2);
      _invMutation(() => { etat.inventaire[k2] = (etat.inventaire[k2] || 0) + 1; });
      etat.totalRolls++;
      progresserQuete('roll', { brawlerId: b2.id, variante: v2, pause: false });
      // Notif Multi-Drop : centrée à l'écran, juste l'image du brawler + "x2!"
      // (pas d'emoji, pas de carte de roll — un simple badge discret)
      const notif = document.createElement('div');
      notif.style.cssText = `position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);
        display:flex;align-items:center;gap:.6rem;
        background:rgba(15,15,20,.92);border:1px solid #f9731666;
        color:#f97316;font-weight:900;font-size:1.1rem;padding:.55rem 1.1rem;
        border-radius:14px;z-index:999;box-shadow:0 0 24px rgba(249,115,22,.35);
        pointer-events:none;animation:craftIn .3s cubic-bezier(.22,.68,0,1.2) forwards`;
      notif.innerHTML = `${brawlerImg(b2, 'w-10 h-10', '', v2)}<span>x2!</span>`;
      document.body.appendChild(notif);
      setTimeout(() => notif.remove(), 1800);
    }

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
