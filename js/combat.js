/* ════════════════════════════════════════════════
   combat.js — Système de Combat Avancé (Robots)
   Puissance du joueur = CPS total des pets équipés.
════════════════════════════════════════════════ */

const APPARITIONS_ROBOTS = [
  { id: 'robot',     nom: 'Robot Standard', image: 'Robot.webp',      mult: 0.7, couleur: '#94a3b8' },
  { id: 'boxer',     nom: 'Robot Boxeur',   image: 'BoxerRobot.webp', mult: 1.0, couleur: '#f97316' },
  { id: 'sniper',    nom: 'Robot Sniper',   image: 'SniperRobot.webp',mult: 1.3, couleur: '#38bdf8' },
  { id: 'big_robot', nom: 'Giga Robot',     image: 'BigRobot.webp',   mult: 1.8, couleur: '#ef4444' },
];

const COMBAT_COOLDOWN_MS = 30_000; // 30 secondes
let adversaireActuel  = null;
let combatCooldownFin = 0;
let combatCooldownInterval = null;

/* ── Appelé à l'ouverture de la modale ── */
function afficherCombat() {
  const el = document.getElementById('combatPower');
  if (el) el.textContent = totalCPS();
  preparerProchainAdversaire();
  rafraichirBoutonCombat();
}

/* ── Génère et affiche un adversaire aléatoire ── */
function preparerProchainAdversaire() {
  const puissanceJoueur = Math.max(10, totalCPS());
  const robotBase       = APPARITIONS_ROBOTS[Math.floor(Math.random() * APPARITIONS_ROBOTS.length)];
  const variation       = 0.8 + Math.random() * 0.4;
  const puissanceEnnemi = Math.max(1, Math.round(puissanceJoueur * robotBase.mult * variation));

  adversaireActuel = { ...robotBase, puissance: puissanceEnnemi };

  const zoneEnnemi = document.getElementById('enemyArenaCard');
  if (zoneEnnemi) {
    /* Les images des robots sont copiées à la racine dans le Dockerfile,
       tout comme ShellyNormal.webp etc. → pas de sous-dossier "images/". */
    zoneEnnemi.innerHTML = `
      <div class="flex flex-col items-center gap-2 p-4 rounded-xl border bg-black/20"
           style="border-color:${adversaireActuel.couleur}50">
        <span class="text-xs font-bold px-2 py-0.5 rounded-full"
              style="background:${adversaireActuel.couleur}20;color:${adversaireActuel.couleur}">
          ${adversaireActuel.nom}
        </span>
        <img src="${adversaireActuel.image}"
             alt="${adversaireActuel.nom}"
             class="w-24 h-24 object-contain my-1"
             style="animation:pulse 2s infinite"
             onerror="this.replaceWith(Object.assign(document.createElement('span'),{className:'text-5xl',textContent:'🤖'}))">
        <div class="text-sm font-bold" style="color:${adversaireActuel.couleur}">
          ⚔️ Puissance : ${adversaireActuel.puissance}
        </div>
      </div>
    `;
  }

  const res = document.getElementById('combatResult');
  if (res) res.innerHTML = '';
}

/* ── Lance le combat ── */
function lancerCombat() {
  // Vérifier le cooldown
  const maintenant = Date.now();
  if (maintenant < combatCooldownFin) return; // bouton déjà désactivé visuellement, sécurité

  const puissanceJoueur = totalCPS();

  if (puissanceJoueur <= 0) {
    afficherResultatCombat(false, 0, 0, 0, "Équipe des pets pour obtenir de la puissance !");
    if (typeof Sound !== 'undefined' && Sound.error) Sound.error();
    return;
  }

  if (!adversaireActuel) return;

  const victoire = puissanceJoueur >= adversaireActuel.puissance;
  let gainPieces = 0;
  let gainXP     = 0;

  if (victoire) {
    gainPieces = Math.round(adversaireActuel.puissance * 6);
    gainXP     = Math.round(adversaireActuel.puissance * 2.5);
    etat.pieces += gainPieces;
    if (typeof Sound !== 'undefined' && Sound.coin)  Sound.coin();
    if (typeof gagnerXP === 'function')               gagnerXP(gainXP);
    if (typeof mettreAJourCompteurs === 'function')   mettreAJourCompteurs();
    if (typeof sauvegarderEtatCloud === 'function')   sauvegarderEtatCloud();
  } else {
    if (typeof Sound !== 'undefined' && Sound.error) Sound.error();
  }

  afficherResultatCombat(victoire, adversaireActuel.puissance, gainPieces, gainXP, adversaireActuel.nom);

  // Démarrer le cooldown
  combatCooldownFin = Date.now() + COMBAT_COOLDOWN_MS;
  demarrerCooldownCombat();

  // Nouvel adversaire après 2,5 s
  setTimeout(() => preparerProchainAdversaire(), 2500);
}

/* ── Gestion visuelle du cooldown ── */
function demarrerCooldownCombat() {
  rafraichirBoutonCombat();
  clearInterval(combatCooldownInterval);
  combatCooldownInterval = setInterval(() => {
    const restant = combatCooldownFin - Date.now();
    if (restant <= 0) {
      clearInterval(combatCooldownInterval);
      rafraichirBoutonCombat();
    } else {
      rafraichirBoutonCombat(restant);
    }
  }, 250);
}

function rafraichirBoutonCombat(restantMs) {
  const btn = document.querySelector('#modalCombat button[onclick="lancerCombat()"]');
  if (!btn) return;

  const enCooldown = Date.now() < combatCooldownFin;

  if (enCooldown && restantMs !== undefined) {
    const secs = Math.ceil(restantMs / 1000);
    btn.textContent = `⏳ Prochain combat dans ${secs}s`;
    btn.disabled    = true;
    btn.style.opacity  = '0.5';
    btn.style.cursor   = 'not-allowed';
  } else {
    btn.textContent = '💥 Engager le Combat';
    btn.disabled    = false;
    btn.style.opacity  = '1';
    btn.style.cursor   = 'pointer';
  }
}

/* ── Affiche le résultat du dernier combat ── */
function afficherResultatCombat(victoire, puissanceEnnemi, gainPieces, gainXP, nomEnnemi) {
  const res = document.getElementById('combatResult');
  if (!res) return;

  res.innerHTML = `
    <div class="mt-2 p-3 rounded-xl text-center border"
         style="background:${victoire ? 'rgba(34,197,94,.1)' : 'rgba(248,113,113,.1)'};
                border-color:${victoire ? 'rgba(34,197,94,.4)' : 'rgba(248,113,113,.4)'}">
      <div class="text-2xl">${victoire ? '🏆' : '💀'}</div>
      <div class="font-black text-sm" style="color:${victoire ? '#22c55e' : '#f87171'}">
        ${victoire ? `Victoire contre ${nomEnnemi} !` : `Défaite face à ${nomEnnemi}…`}
      </div>
      ${victoire
        ? `<div class="text-xs font-bold text-amber-400 mt-1">+${gainPieces} 💰 &nbsp; +${gainXP} XP</div>`
        : `<div class="text-xs text-slate-400 mt-1">Ton armée de pets n'était pas assez forte !</div>`
      }
    </div>
  `;
}
