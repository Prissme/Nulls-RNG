/* ════════════════════════════════════════════════
   pets.js — Équipement / déséquipement des pets
════════════════════════════════════════════════ */

/* ── S'assure que etat.petsEquipes a la bonne taille
   (le nombre de slots peut augmenter avec l'amélioration
   permanente de Prestige "Emplacement Bonus") ── */
function ajusterSlotsPets() {
  const max = nbSlotsMax();
  while (etat.petsEquipes.length < max) etat.petsEquipes.push(null);
  while (etat.petsEquipes.length > max) {
    const idx = etat.petsEquipes.lastIndexOf(null);
    if (idx === -1) break; // tous les slots sont remplis, on ne force pas un déséquipement
    etat.petsEquipes.splice(idx, 1);
  }
}

function equiper(brawlerId, variante) {
  const k = cle(brawlerId, variante);
  if (!etat.inventaire[k] || etat.inventaire[k] <= 0) return;

  // Déjà équipé → déséquiper
  const dejaSlot = etat.petsEquipes.findIndex(p =>
    p && p.brawler.id === brawlerId && p.variante === variante);
  if (dejaSlot !== -1) { desequiper(dejaSlot); return; }

  // Trouver un slot libre
  const slot = etat.petsEquipes.indexOf(null);
  if (slot === -1) return; // tous les slots sont pleins

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

/* ── Équiper automatiquement les meilleurs pets possédés
   (jusqu'au nombre de slots disponibles, augmenté par Prestige).
   "Meilleur" = celui qui génère le plus de pièces/s (CPS).
   Remplace entièrement les slots actuels. ── */
function equiperMeilleurs() {
  const maxSlots = nbSlotsMax();

  const candidats = Object.entries(etat.inventaire)
    .filter(([, qty]) => qty > 0)
    .map(([k]) => {
      const { brawlerId, variante } = parseKey(k);
      const b = BRAWLERS.find(b => b.id === brawlerId);
      return { brawler: b, variante, cps: calcCPS(b, variante) };
    })
    .sort((a, b) => b.cps - a.cps)
    .slice(0, maxSlots);

  if (candidats.length === 0) return;

  etat.petsEquipes = new Array(maxSlots).fill(null);
  candidats.forEach((c, i) => {
    etat.petsEquipes[i] = { brawler: c.brawler, variante: c.variante };
  });

  afficherPets();
  afficherInventaire();
  mettreAJourCompteurs();
  sauvegarderEtatCloud();
}
