/* ════════════════════════════════════════════════
   roll.js — Algorithme de tirage & logique de roll
════════════════════════════════════════════════ */

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

  const luckMult = luckMultiplierTotal();

  for (const vKey of ORDRE_VARIANTES) {
    const v = VARIANTES[vKey];
    for (const b of [...BRAWLERS].sort((a, b2) => a.div - b2.div)) {
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
  etat.inventaire[k] = (etat.inventaire[k] || 0) + 1;

  etat.historique.unshift({ brawler, variante });
  if (etat.historique.length > 6) etat.historique.pop();

  // Son selon la variante obtenue
  if      (variante === 'rainbow') Sound.rainbow();
  else if (variante === 'golden')  Sound.golden();
  else if (variante === 'shiny')   Sound.shiny();
  else                             Sound.roll();

  // Progression quêtes
  progresserQuete('roll', { brawlerId: brawler.id, variante });

  afficherResultat(brawler, variante);
  mettreAJourCompteurs();
  afficherInventaire();
  afficherHistorique();
  afficherCraft();

  // ── Lucky Pull : animation + notification Discord
  gererLuckyPull(brawler, variante, inventaireAvant);
}
