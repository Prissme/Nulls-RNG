/* ════════════════════════════════════════════════
   pets.js — Équipement / déséquipement des pets
════════════════════════════════════════════════ */

function equiper(brawlerId, variante) {
  const k = cle(brawlerId, variante);
  if (!etat.inventaire[k] || etat.inventaire[k] <= 0) return;

  // Déjà équipé → déséquiper
  const dejaSlot = etat.petsEquipes.findIndex(p =>
    p && p.brawler.id === brawlerId && p.variante === variante);
  if (dejaSlot !== -1) { desequiper(dejaSlot); return; }

  // Trouver un slot libre
  const slot = etat.petsEquipes.indexOf(null);
  if (slot === -1) return; // 3 slots pleins

  const b = BRAWLERS.find(b => b.id === brawlerId);
  etat.petsEquipes[slot] = { brawler: b, variante };

  afficherPets();
  afficherInventaire();
  mettreAJourCompteurs();
  sauvegarderEtatCloud();
}

function desequiper(slotIndex) {
  etat.petsEquipes[slotIndex] = null;
  afficherPets();
  afficherInventaire();
  mettreAJourCompteurs();
  sauvegarderEtatCloud();
}

/* ── Équiper automatiquement les 3 meilleurs pets possédés ──
   "Meilleur" = celui qui génère le plus de pièces/s (CPS).
   Remplace entièrement les 3 slots actuels. ── */
function equiperMeilleurs() {
  const candidats = Object.entries(etat.inventaire)
    .filter(([, qty]) => qty > 0)
    .map(([k]) => {
      const { brawlerId, variante } = parseKey(k);
      const b = BRAWLERS.find(b => b.id === brawlerId);
      return { brawler: b, variante, cps: calcCPS(b, variante) };
    })
    .sort((a, b) => b.cps - a.cps)
    .slice(0, 3);

  if (candidats.length === 0) return;

  etat.petsEquipes = [null, null, null];
  candidats.forEach((c, i) => {
    etat.petsEquipes[i] = { brawler: c.brawler, variante: c.variante };
  });

  afficherPets();
  afficherInventaire();
  mettreAJourCompteurs();
  sauvegarderEtatCloud();
}
