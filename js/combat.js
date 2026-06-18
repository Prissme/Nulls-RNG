/* ════════════════════════════════════════════════
   combat.js — Système de Combat (version simple)

   Puissance du joueur = CPS total des pets équipés.
   Un combat = un tirage : la puissance de l'ennemi est
   aléatoire entre 50% et 150% de la puissance du joueur.
   Victoire (puissance joueur >= puissance ennemi)
   → pièces + XP proportionnels à l'ennemi vaincu.
   Défaite → rien (pas de pénalité).
════════════════════════════════════════════════ */

function afficherCombat() {
  const el = document.getElementById('combatPower');
  if (el) el.textContent = totalCPS();
  const res = document.getElementById('combatResult');
  if (res) res.innerHTML = '';
}

function lancerCombat() {
  const puissance = totalCPS();

  if (puissance <= 0) {
    afficherResultatCombat(false, 0, 0, 0);
    Sound.error();
    return;
  }

  const puissanceEnnemi = Math.max(1, Math.round(puissance * (0.5 + Math.random())));
  const victoire = puissance >= puissanceEnnemi;

  let gainPieces = 0;
  let gainXP     = 0;

  if (victoire) {
    gainPieces   = puissanceEnnemi * 5;
    gainXP       = puissanceEnnemi * 2;
    etat.pieces += gainPieces;
    Sound.coin();
    gagnerXP(gainXP);
    mettreAJourCompteurs();
    sauvegarderEtatCloud();
  } else {
    Sound.error();
  }

  afficherResultatCombat(victoire, puissanceEnnemi, gainPieces, gainXP);
}

function afficherResultatCombat(victoire, puissanceEnnemi, gainPieces, gainXP) {
  const res = document.getElementById('combatResult');
  if (!res) return;

  res.innerHTML = `
    <div style="margin-top:.5rem;padding:.75rem;border-radius:12px;text-align:center;
      background:${victoire ? 'rgba(34,197,94,.1)' : 'rgba(248,113,113,.1)'};
      border:1px solid ${victoire ? 'rgba(34,197,94,.4)' : 'rgba(248,113,113,.4)'}">
      <div style="font-size:1.5rem">${victoire ? '🏆' : '💀'}</div>
      <div style="font-weight:900;color:${victoire ? '#22c55e' : '#f87171'}">
        ${victoire ? 'Victoire !' : 'Défaite...'}
      </div>
      <div style="font-size:.75rem;color:var(--text-muted);margin-top:.2rem">
        Ennemi : ⚔️ ${puissanceEnnemi}
      </div>
      ${victoire
        ? `<div style="font-size:.8rem;color:#fbbf24;margin-top:.3rem">+${gainPieces} 💰 &nbsp; +${gainXP} XP</div>`
        : ''}
    </div>
  `;
}
