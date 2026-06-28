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
  // Si le boost HugeWished est actif, déléguer à sa propre fonction
  if (typeof hwBoostActif !== 'undefined' && hwBoostActif) {
    redemarrerAutoRollHW();
    return;
  }
  clearInterval(etat.autoInterval);
  const base  = delaiAutoRollBase();
  // Wished (×6.7) > Speed (×3) ; on prend le meilleur actif
  let delai = base;
  let badgeText = '';
  if (etat.wishedActive) {
    delai = Math.max(30, Math.round(base / POTIONS.wished.speedMult));
    badgeText = `×${POTIONS.wished.speedMult}`;
  } else if (etat.speedActive) {
    delai = Math.round(base / 3);
    badgeText = 'x3';
  }
  etat.autoInterval = setInterval(effectuerRoll, delai);
  const badge = document.getElementById('autoSpeedBadge');
  if (badge) {
    badge.textContent = badgeText;
    badge.style.background = etat.wishedActive ? 'rgba(245,158,11,.18)' : 'rgba(56,189,248,.12)';
    badge.style.color = etat.wishedActive ? '#f59e0b' : 'var(--accent-sky)';
    badge.classList.toggle('hidden', !etat.speedActive && !etat.wishedActive);
  }
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
