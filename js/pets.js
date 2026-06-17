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
}

function desequiper(slotIndex) {
  etat.petsEquipes[slotIndex] = null;
  afficherPets();
  afficherInventaire();
  mettreAJourCompteurs();
}
