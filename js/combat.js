/* ════════════════════════════════════════════════
   combat.js — Système de Combat Avancé (Robots)
   Puissance du joueur = CPS total des pets équipés.
════════════════════════════════════════════════ */

const APPARITIONS_ROBOTS = [
  { id: 'robot', nom: 'Robot Standard', image: 'Robot.webp', mult: 0.7, couleur: '#94a3b8' },
  { id: 'boxer', nom: 'Robot Boxeur', image: 'BoxerRobot.webp', mult: 1.0, couleur: '#f97316' },
  { id: 'sniper', nom: 'Robot Sniper', image: 'SniperRobot.webp', mult: 1.3, couleur: '#38bdf8' },
  { id: 'big_robot', nom: 'Giga Robot', image: 'BigRobot.webp', mult: 1.8, couleur: '#ef4444' }
];

let adversaireActuel = null;

function afficherCombat() {
  const el = document.getElementById('combatPower');
  if (el) el.textContent = totalCPS();
  preparerProchainAdversaire();
}

function preparerProchainAdversaire() {
  const puissanceJoueur = Math.max(10, totalCPS());
  const robotBase = APPARITIONS_ROBOTS[Math.floor(Math.random() * APPARITIONS_ROBOTS.length)];
  const variation = 0.8 + Math.random() * 0.4;
  const puissanceEnnemi = Math.max(1, Math.round(puissanceJoueur * robotBase.mult * variation));
  
  adversaireActuel = {
    ...robotBase,
    puissance: puissanceEnnemi
  };

  const zoneEnnemi = document.getElementById('enemyArenaCard');
  if (zoneEnnemi) {
    // Utilisation explicite du chemin ./images/ configuré dans le Dockerfile
    zoneEnnemi.innerHTML = `
      <div class="flex flex-col items-center gap-2 p-4 rounded-xl border bg-black/20" style="border-color: ${adversaireActuel.couleur}50">
        <span class="text-xs font-bold px-2 py-0.5 rounded-full" style="background: ${adversaireActuel.couleur}20; color: ${adversaireActuel.couleur}">
          ${adversaireActuel.nom}
        </span>
        <img src="./images/${adversaireActuel.image}" alt="${adversaireActuel.nom}" class="w-24 h-24 object-contain my-1 animate-pulse" onerror="console.error('Impossible de charger l\\'image:', this.src);">
        <div class="text-sm font-bold" style="color: ${adversaireActuel.couleur}">⚔️ Puissance : ${adversaireActuel.puissance}</div>
      </div>
    `;
  }
  
  const res = document.getElementById('combatResult');
  if (res) res.innerHTML = '';
}

function lancerCombat() {
  const puissanceJoueur = totalCPS();
  
  if (puissanceJoueur <= 0) {
    afficherResultatCombat(false, 0, 0, 0, "Équipe des pets pour obtenir de la puissance !");
    if (typeof Sound !== 'undefined' && Sound.error) Sound.error();
    return;
  }

  if (!adversaireActuel) return;

  const victoire = puissanceJoueur >= adversaireActuel.puissance;
  let gainPieces = 0;
  let gainXP = 0;

  if (victoire) {
    gainPieces = Math.round(adversaireActuel.puissance * 6);
    gainXP = Math.round(adversaireActuel.puissance * 2.5);
    
    etat.pieces += gainPieces;
    if (typeof Sound !== 'undefined' && Sound.coin) Sound.coin();
    if (typeof gagnerXP === 'function') gagnerXP(gainXP);
    if (typeof mettreAJourCompteurs === 'function') mettreAJourCompteurs();
    if (typeof sauvegarderEtatCloud === 'function') sauvegarderEtatCloud();
  } else {
    if (typeof Sound !== 'undefined' && Sound.error) Sound.error();
  }

  afficherResultatCombat(victoire, adversaireActuel.puissance, gainPieces, gainXP, adversaireActuel.nom);
  
  setTimeout(() => {
    preparerProchainAdversaire();
  }, 2500);
}

function afficherResultatCombat(victoire, puissanceEnnemi, gainPieces, gainXP, nomEnnemi) {
  const res = document.getElementById('combatResult');
  if (!res) return;
  
  res.innerHTML = `
    <div class="mt-2 p-3 rounded-xl text-center border animate-bounce"
      style="background:${victoire ? 'rgba(34,197,94,.1)' : 'rgba(248,113,113,.1)'};
      border-color:${victoire ? 'rgba(34,197,94,.4)' : 'rgba(248,113,113,.4)'}">
      <div class="text-2xl">${victoire ? '🏆' : '💀'}</div>
      <div class="font-black text-sm" style="color:${victoire ? '#22c55e' : '#f87171'}">
        ${victoire ? `Victoire contre ${nomEnnemi} !` : `Défaite face à ${nomEnnemi}...`}
      </div>
      ${victoire 
        ? `<div class="text-xs font-bold text-amber-400 mt-1 flex items-center justify-center gap-1">
            +${gainPieces} <img src="./images/Coins.webp" alt="Coins" class="w-5 h-5 object-contain inline"> &nbsp; +${gainXP} XP
           </div>`
        : `<div class="text-xs text-slate-400 mt-1">Ton armée de pets n'était pas assez forte !</div>`
      }
    </div>
  `;
}
