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

/* Plancher absolu de délai entre deux rolls auto, tous boosts cumulés
   confondus. Partagé avec hugewished.js et avec ROLL_RATELIMIT dans
   anticheat.js (qui doit toujours rester EN DESSOUS de ce plancher,
   sinon on recrée le même faux-positif qu'avant). */
const AUTOROLL_DELAI_PLANCHER_MS = 25;

function redemarrerAutoRoll() {
  if (!etat.autoRollActif) return;
  // Si le boost HugeWished est actif, déléguer à sa propre fonction
  if (typeof hwBoostActif !== 'undefined' && hwBoostActif) {
    redemarrerAutoRollHW();
    return;
  }
  clearInterval(etat.autoInterval);
  const base = delaiAutoRollBase();

  // FIX : le speed Naël (×2 permanent) doit se CUMULER avec le boost
  // potion actif (Wished ×6.7 ou Speed ×3), pas être ignoré dès qu'une
  // potion est active. On multiplie tous les boosts actifs ensemble.
  let mult = 1;
  const badges = [];
  if (etat.wishedActive) {
    mult *= POTIONS.wished.speedMult;
    badges.push(`×${POTIONS.wished.speedMult}`);
  } else if (etat.speedActive) {
    mult *= 3;
    badges.push('×3');
  }
  if (etat.naellSpeedUnlocked) {
    mult *= 2;
    badges.push('×2 👑');
  }

  const delai = mult > 1
    ? Math.max(AUTOROLL_DELAI_PLANCHER_MS, Math.round(base / mult))
    : base;
  const badgeText = badges.join(' ');

  etat.autoInterval = setInterval(effectuerRoll, delai);
  const badge = document.getElementById('autoSpeedBadge');
  if (badge) {
    badge.textContent = badgeText;
    badge.style.background = etat.wishedActive ? 'rgba(245,158,11,.18)' : 'rgba(56,189,248,.12)';
    badge.style.color = etat.wishedActive ? '#f59e0b' : 'var(--accent-sky)';
    badge.classList.toggle('hidden', !etat.speedActive && !etat.wishedActive && !etat.naellSpeedUnlocked);
  }
}

function demarrerCPS() {
  clearInterval(etat.cpsInterval);
  etat.cpsInterval = setInterval(() => {
    const gain = totalCPS() * (typeof doubleGainMultiplier === 'function' ? doubleGainMultiplier() : 1);
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
