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

  /* ── Prestige (Renaissance) : persiste à travers les resets ── */
  prestige:         0,
  cristaux:         0,
  prestigeUpgrades: { luck: 0, cps: 0, vente: 0, slot: 0, vitesse: 0, xp: 0, cristaux: 0, multidrop: 0, recyclage: 0, luckroll: 0 },

  /* ── Index : bonus de luck débloqués, persistants après Renaissance ── */
  indexUnlocks: {},  // clé: "rarityKey_variante" → true

  /* ── Lucky Pull : mémoire PERMANENTE (jamais reset au prestige) ──
     FIX "spam Lucky Pull après Renaissance" : l'ancienne détection se basait
     sur l'inventaire courant (etat.inventaire), qui est vidé à chaque
     Renaissance. Résultat : après un reset, absolument CHAQUE roll
     redevenait "jamais obtenu" et redéclenchait l'overlay plein écran,
     y compris pour un Shelly Normal en Auto-Roll boosté. En trackant
     séparément — et pour toujours — chaque combo déjà obtenu au moins une
     fois dans la vie du compte, ainsi que le meilleur score de rareté
     jamais atteint, la notif Lucky Pull ne redevient pertinente qu'au sens
     "jamais vu de toute la partie", pas "jamais vu depuis le dernier reset". */
  dejaObtenus:    {},  // clé: "brawlerId_variante" → true (à vie)
  meilleurScoreVu: 0,  // meilleur (div × chanceMult) jamais obtenu (à vie)

  autoRollActif: false,
  autoInterval:  null,

  luckActive:   false,
  luckFin:      0,
  luckInterval: null,

  speedActive:   false,
  speedFin:      0,
  speedInterval: null,

  shinyActive:   false,
  shinyFin:      0,
  shinyInterval: null,

  wishedActive:   false,
  wishedFin:      0,
  wishedInterval: null,

  goldenActive:   false,
  goldenFin:      0,
  goldenInterval: null,

  richesseActive:   false,
  richesseFin:      0,
  richesseInterval: null,

  filtreVariante: 'all',
  triInventaire:  'rarete',

  cpsInterval: null,

  quetes:               [],
  quetesRefreshFin:     0,
  quetesInterval:       null,
  quetesDiff:           [],
  quetesDiffRefreshFin: 0,

  /* ── Progression du robot : nombre de victoires en combat ── */
  combatsGagnes: 0,

  /* ── Easter egg Naell : speed x2 permanent débloqué ── */
  naellSpeedUnlocked: false,

  /* ── Arbre de compétences : PP et skills INDIVIDUELS par brawler ──
     Clé : "brawlerId_variante"  (ex: "11_rainbow")
     brawlerPP     : { [cle]: number }             – PP disponibles pour ce brawler
     brawlerSkills : { [cle]: { [skillId]: true } } – skills achetés
  ── */
  brawlerPP:     {},
  brawlerSkills: {},
};

const cle      = (bId, variante) => `${bId}_${variante}`;
const parseKey = key => { const [a, b] = key.split('_'); return { brawlerId: +a, variante: b }; };

/* ── Bonus permanents de Prestige (achetés avec les Cristaux,
   ils restent acquis même après une Renaissance) ── */
const niveauUpgradePrestige = (id) => (etat.prestigeUpgrades && etat.prestigeUpgrades[id]) || 0;
const luckBonusPrestige     = () => 1 + niveauUpgradePrestige('luck')      * 0.05;
const cpsBonusPrestige      = () => 1 + niveauUpgradePrestige('cps')       * 0.10;
const venteBonusPrestige    = () => 1 + niveauUpgradePrestige('vente')     * 0.10;
const nbSlotsMax            = () => 3 + niveauUpgradePrestige('slot');
const vitesseAutoMult       = () => Math.max(0.3, 1 - niveauUpgradePrestige('vitesse') * 0.05);

// Nouvelles améliorations
const xpBonusPrestige       = () => 1 + niveauUpgradePrestige('xp')        * 0.08;   // +8% XP/niveau
const cristauxBonusPrestige = () => 1 + niveauUpgradePrestige('cristaux')  * 0.10;   // +10% cristaux/niveau
const multidropChance       = () =>     niveauUpgradePrestige('multidrop') * 0.005;  // +0.5% brawler bonus/niveau
const recyclageBonusPrestige= () => 1 + niveauUpgradePrestige('recyclage') * 0.15;   // +15% vente/niveau
const luckrollChance        = () =>     niveauUpgradePrestige('luckroll')  * 0.03;   // +3% chance Shiny/niveau

const calcCPS  = (b, vKey) => b.cpsBase * VARIANTES[vKey].cpsMult * cpsBonusPrestige();
const totalCPS = ()        => Math.round(etat.petsEquipes.reduce((sum, pet) =>
  pet ? sum + calcCPS(pet.brawler, pet.variante) : sum, 0) * 10) / 10;

const scoreRarete = (b, vKey) => b.div * VARIANTES[vKey].chanceMult;

/* Bonus de Luck lié au niveau de compte (remis à zéro à chaque Renaissance) :
   chaque niveau au-delà du niveau 1 ajoute +2% de luck (cumulatif, pas composé). */
const luckBonusNiveau = () => 1 + Math.max(0, etat.niveau - 1) * 0.02;

/* Multiplicateur de luck total = potion × bonus de niveau (run actuel) × bonus de Prestige (permanent) × bonus Index */
let luckMultiplierTotal = () =>
  (etat.luckActive ? POTIONS.luck.luckMult : 1) * luckBonusNiveau() * luckBonusPrestige() * (1 + (typeof luckBonusIndex === 'function' ? luckBonusIndex() : 0));

/* Multiplicateur de monnaie gagnée (Potion de Richesse : ×2 pendant 1h) */
const doubleGainMultiplier = () => etat.richesseActive ? POTIONS.richesse.doubleMult : 1;

const couleurVariante = (brawler, variante) => {
  if (variante === 'monochrome') return '#f8fafc';
  if (variante === 'rainbow') return '#e879f9';
  if (variante === 'golden')  return '#fbbf24';
  if (variante === 'shiny')   return '#38bdf8';
  return brawler.couleur;
};

const xpRequisPourNiveau = (niveau) => Math.round(100 * Math.pow(1.15, niveau - 1));

function gagnerXP(montant) {
  if (montant <= 0) return;
  etat.xp += Math.round(montant * xpBonusPrestige());

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

/* ── Helpers PP par brawler ── */
function getBrawlerPP(brawlerId, variante) {
  const k = cle(brawlerId, variante);
  return etat.brawlerPP[k] || 0;
}

function setBrawlerPP(brawlerId, variante, val) {
  const k = cle(brawlerId, variante);
  etat.brawlerPP[k] = Math.max(0, val);
}

function getBrawlerSkills(brawlerId, variante) {
  const k = cle(brawlerId, variante);
  return etat.brawlerSkills[k] || {};
}

function brawlerSkillAchete(brawlerId, variante, skillId) {
  return !!(getBrawlerSkills(brawlerId, variante)[skillId]);
}
