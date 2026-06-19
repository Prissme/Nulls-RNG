/* ════════════════════════════════════════════════
   autoroll.js — Auto-Roll & CPS (pièces/seconde)
════════════════════════════════════════════════ */

function toggleAutoRoll() {
  etat.autoRollActif = !etat.autoRollActif;
  const toggle = document.getElementById('autoToggle');
  const label  = document.getElementById('autoLabel');

  if (etat.autoRollActif) {
    toggle.classList.add('on');
    label.textContent = 'ON';
    label.style.color = '#a855f7';
    Sound.autoOn();
    redemarrerAutoRoll();
  } else {
    toggle.classList.remove('on');
    label.textContent = 'OFF';
    label.style.color = 'var(--text-muted)';
    Sound.autoOff();
    clearInterval(etat.autoInterval);
  }
}

/* Délai de base de l'Auto-Roll (ms), réduit par l'amélioration
   permanente de Prestige "Vélocité" (-5%/niveau, plancher à ×0.3) */
function delaiAutoRollBase() {
  return Math.max(80, Math.round(1000 * vitesseAutoMult()));
}

function redemarrerAutoRoll() {
  if (!etat.autoRollActif) return;
  clearInterval(etat.autoInterval);
  const base  = delaiAutoRollBase();
  const delai = etat.speedActive ? Math.round(base / 3) : base;
  etat.autoInterval = setInterval(effectuerRoll, delai);
  document.getElementById('autoSpeedBadge').classList.toggle('hidden', !etat.speedActive);
}

function demarrerCPS() {
  clearInterval(etat.cpsInterval);
  etat.cpsInterval = setInterval(() => {
    const gain = totalCPS();
    if (gain > 0) {
      etat.pieces += gain;
      mettreAJourCompteurs();
      floatCPS(gain);
    }
    progresserQuete('cps');
  }, 1000);
}

function floatCPS(gain) {
  const chip = document.getElementById('coinChip');
  const el   = document.createElement('span');
  el.className   = 'cps-float';
  el.textContent = `+${gain}`;
  el.style.top   = '-10px';
  el.style.left  = '50%';
  chip.appendChild(el);
  setTimeout(() => el.remove(), 900);
}
