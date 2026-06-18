/* ════════════════════════════════════════════════
   state.js — État global du jeu + utilitaires
════════════════════════════════════════════════ */

const etat = {
  pieces:        0,
  totalRolls:    0,
  totalPotions:  0,
  inventaire:    {},
  petsEquipes:   [null, null, null],
  historique:    [],

  niveau: 1,
  xp:     0,

  autoRollActif: false,
  autoInterval:  null,

  luckActive:   false,
  luckFin:      0,
  luckInterval: null,

  speedActive:   false,
  speedFin:      0,
  speedInterval: null,

  filtreVariante: 'all',
  triInventaire:  'rarete',

  cpsInterval: null,

  quetes:           [],
  quetesRefreshFin: 0,
  quetesInterval:   null,
};

const cle      = (bId, variante) => `${bId}_${variante}`;
const parseKey = key => { const [a, b] = key.split('_'); return { brawlerId: +a, variante: b }; };

const calcCPS  = (b, vKey) => b.cpsBase * VARIANTES[vKey].cpsMult;
const totalCPS = ()        => etat.petsEquipes.reduce((sum, pet) =>
  pet ? sum + calcCPS(pet.brawler, pet.variante) : sum, 0);

const scoreRarete = (b, vKey) => b.div * VARIANTES[vKey].chanceMult;

const couleurVariante = (brawler, variante) => {
  if (variante === 'rainbow') return '#e879f9';
  if (variante === 'golden')  return '#fbbf24';
  if (variante === 'shiny')   return '#38bdf8';
  return brawler.couleur;
};

const xpRequisPourNiveau = (niveau) => Math.round(100 * Math.pow(1.15, niveau - 1));

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
  if (aLevelUp) {
    Sound.levelUp();
    afficherLevelUp(etat.niveau);
  }
}
