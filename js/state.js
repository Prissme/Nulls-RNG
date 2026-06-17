/* ════════════════════════════════════════════════
   state.js — État global du jeu + utilitaires
════════════════════════════════════════════════ */

const etat = {
  pieces:        0,
  totalRolls:    0,
  totalPotions:  0,          // compteur pour quêtes
  inventaire:    {},         // { "brawlerId_variante": quantité }
  petsEquipes:   [null, null, null],
  historique:    [],

  // Niveau de compte (gagné via les quêtes, en XP)
  niveau: 1,
  xp:     0,

  autoRollActif: false,
  autoInterval:  null,

  // Potion Luck
  luckActive:   false,
  luckFin:      0,
  luckInterval: null,

  // Potion Vitesse
  speedActive:   false,
  speedFin:      0,
  speedInterval: null,

  // Filtre inventaire
  filtreVariante: 'all',

  // CPS tick
  cpsInterval: null,

  // Quêtes
  quetes:           [],      // liste des quêtes actives générées
  quetesRefreshFin: 0,       // timestamp prochain refresh
  quetesInterval:   null,
};

/* ── Clés inventaire ── */
const cle      = (bId, variante) => `${bId}_${variante}`;
const parseKey = key => { const [a, b] = key.split('_'); return { brawlerId: +a, variante: b }; };

/* ── Helpers calcul ── */
const calcCPS  = (b, vKey) => b.cpsBase * VARIANTES[vKey].cpsMult;
const totalCPS = ()        => etat.petsEquipes.reduce((sum, pet) =>
  pet ? sum + calcCPS(pet.brawler, pet.variante) : sum, 0);

/* ── Couleur effective selon variante ── */
const couleurVariante = (brawler, variante) => {
  if (variante === 'rainbow') return '#e879f9';
  if (variante === 'golden')  return '#fbbf24';
  if (variante === 'shiny')   return '#38bdf8';
  return brawler.couleur;
};

/* ── Niveau de compte / XP ──
   xp nécessaire pour passer du niveau n au niveau n+1 (courbe progressive) */
const xpRequisPourNiveau = (niveau) => Math.round(100 * Math.pow(1.15, niveau - 1));

/* Ajoute de l'XP à l'état, gère le(s) passage(s) de niveau (boucle si plusieurs
   niveaux sont gagnés d'un coup) et met à jour l'UI + affiche une notif. */
function gagnerXP(montant) {
  if (montant <= 0) return;
  etat.xp += montant;

  let aLevelUp = false;
  while (etat.xp >= xpRequisPourNiveau(etat.niveau)) {
    etat.xp -= xpRequisPourNiveau(etat.niveau);
    etat.niveau++;
    aLevelUp = true;
  }

  mettreAJourCompteurs();
  if (aLevelUp) afficherLevelUp(etat.niveau);
}
