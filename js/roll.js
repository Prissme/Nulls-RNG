/* ════════════════════════════════════════════════
   roll.js — Algorithme de tirage & logique de roll
════════════════════════════════════════════════ */

/* Tire un brawler + variante selon les probabilités.
   Pour chaque variante (du + rare au + commun),
   puis pour chaque brawler (du + rare au + commun).   */
function effectuerTirage() {
  const luckMult = etat.luckActive ? 2 : 1;

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
  // Fallback : Shelly Normal
  return { brawler: BRAWLERS[0], variante: 'normal' };
}

function effectuerRoll() {
  const { brawler, variante } = effectuerTirage();
  etat.totalRolls++;

  // Ajouter à l'inventaire
  const k = cle(brawler.id, variante);
  etat.inventaire[k] = (etat.inventaire[k] || 0) + 1;

  // Historique (6 max)
  etat.historique.unshift({ brawler, variante });
  if (etat.historique.length > 6) etat.historique.pop();

  // Mise à jour UI
  afficherResultat(brawler, variante);
  mettreAJourCompteurs();
  afficherInventaire();
  afficherHistorique();
}
