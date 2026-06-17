/* ════════════════════════════════════════════════
   autoroll.js — Auto-Roll & CPS (pièces/seconde)
════════════════════════════════════════════════ */

/* ── Auto-Roll ── */
function toggleAutoRoll() {
  etat.autoRollActif = !etat.autoRollActif;
  const toggle = document.getElementById('autoToggle');
  const label  = document.getElementById('autoLabel');

  if (etat.autoRollActif) {
    toggle.classList.add('on');
    label.textContent = 'ON';
    label.style.color = '#a855f7';
    redemarrerAutoRoll();
  } else {
    toggle.classList.remove('on');
    label.textContent = 'OFF';
    label.style.color = 'var(--text-muted)';
    clearInterval(etat.autoInterval);
  }
}

/* Relance l'intervalle avec la bonne vitesse (normale ou ×3 speed potion) */
function redemarrerAutoRoll() {
  if (!etat.autoRollActif) return;
  clearInterval(etat.autoInterval);
  const delai = etat.speedActive ? Math.round(1000 / 3) : 1000;
  etat.autoInterval = setInterval(effectuerRoll, delai);
  document.getElementById('autoSpeedBadge').classList.toggle('hidden', !etat.speedActive);
}

/* ── CPS tick (toutes les secondes) ── */
function demarrerCPS() {
  clearInterval(etat.cpsInterval);
  etat.cpsInterval = setInterval(() => {
    const gain = totalCPS();
    if (gain > 0) {
      etat.pieces += gain;
      mettreAJourCompteurs();
      floatCPS(gain);
    }
  }, 1000);
}

/* Animation flottante sur la chip de pièces */
function floatCPS(gain) {
  const chip = document.getElementById('coinChip');
  const el   = document.createElement('span');
  el.className    = 'cps-float';
  el.textContent  = `+${gain}`;
  el.style.top    = '-10px';
  el.style.left   = '50%';
  chip.appendChild(el);
  setTimeout(() => el.remove(), 900);
}
