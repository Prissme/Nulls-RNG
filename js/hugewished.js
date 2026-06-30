/* ════════════════════════════════════════════════
   hugewished.js — HugeWished : apparition aléatoire
   • 1 chance sur 6700 par seconde d'apparaître
   • Se déplace à travers l'écran en 6,7 secondes
   • Cliquer dessus → boost ×6,7 roll speed pendant 67s
════════════════════════════════════════════════ */

const HUGEWISHED = {
  PROBA:      1 / 6700,   // chance par seconde
  DUREE_MS:   6700,       // durée de traversée
  BOOST_MULT: 6.7,        // multiplicateur de vitesse
  BOOST_DUR:  67_000,     // durée du boost en ms
};

let hwInterval      = null;   // tick de 1s pour tenter l'apparition
let hwEl            = null;   // élément DOM actif
let hwBoostActif    = false;
let hwBoostFin      = 0;
let hwBoostTimeout  = null;
let hwTraversee     = null;   // animation en cours

/* ── Démarre le système (appelé au chargement) ── */
function demarrerHugeWished() {
  if (hwInterval) clearInterval(hwInterval);
  hwInterval = setInterval(tenterApparition, 1000);
}

/* ── Tentative d'apparition toutes les secondes ── */
function tenterApparition() {
  if (hwEl) return;                          // déjà affiché
  if (Math.random() > HUGEWISHED.PROBA) return; // pas de chance
  afficherHugeWished();
}

/* ── Affichage et traversée de l'écran ── */
function afficherHugeWished() {
  if (hwEl) hwEl.remove();

  const el = document.createElement('div');
  hwEl = el;

  // Taille : entre 80px et 140px pour varier
  const size    = 80 + Math.floor(Math.random() * 60);
  // Hauteur aléatoire (10% – 80% de la fenêtre)
  const topPct  = 10 + Math.random() * 70;
  // Direction : gauche→droite ou droite→gauche
  const ltr     = Math.random() > 0.5;
  const startX  = ltr ? -size - 10 : window.innerWidth + 10;
  const endX    = ltr ? window.innerWidth + size + 10 : -size - 10;

  el.style.cssText = `
    position: fixed;
    top: ${topPct}%;
    left: ${startX}px;
    width: ${size}px;
    height: ${size}px;
    z-index: 8888;
    cursor: pointer;
    pointer-events: auto;
    filter: drop-shadow(0 0 18px #f59e0b) drop-shadow(0 0 36px #f59e0baa);
    transition: transform .12s, filter .12s;
    user-select: none;
  `;

  const img = document.createElement('img');
  img.src   = 'HugeWished.webp';
  img.alt   = 'HugeWished';
  img.style.cssText = `
    width: 100%; height: 100%; object-fit: contain;
    animation: hwBob 0.9s ease-in-out infinite alternate;
  `;

  // Injection du keyframe si pas encore présent
  if (!document.getElementById('hw-style')) {
    const s = document.createElement('style');
    s.id = 'hw-style';
    s.textContent = `
      @keyframes hwBob {
        from { transform: translateY(0) rotate(-4deg) scale(1); }
        to   { transform: translateY(-10px) rotate(4deg) scale(1.06); }
      }
      @keyframes hwPop {
        0%   { transform: scale(1); }
        40%  { transform: scale(1.35); }
        100% { transform: scale(0) rotate(20deg); opacity: 0; }
      }
      #hwBoostBar {
        position: fixed; bottom: 0; left: 0; right: 0;
        height: 5px; z-index: 9990; pointer-events: none;
        background: linear-gradient(90deg, #f59e0b, #fbbf24, #f59e0b);
        background-size: 200% 100%;
        animation: hwBarShine 1.5s linear infinite;
        transform-origin: left center;
      }
      @keyframes hwBarShine {
        0%   { background-position: 0% 0%; }
        100% { background-position: 200% 0%; }
      }
      #hwBoostNotif {
        position: fixed; top: 70px; left: 50%; transform: translateX(-50%);
        background: linear-gradient(135deg, #92400e, #b45309);
        border: 2px solid #fbbf24;
        color: #fef3c7; font-weight: 900; font-size: .95rem;
        padding: .6rem 1.5rem; border-radius: 14px; z-index: 9991;
        box-shadow: 0 0 30px rgba(251,191,36,.6);
        white-space: nowrap;
        animation: hwNotifIn .4s cubic-bezier(.22,.68,0,1.2) forwards;
      }
      @keyframes hwNotifIn {
        from { transform: translateX(-50%) scale(.5); opacity: 0; }
        to   { transform: translateX(-50%) scale(1);  opacity: 1; }
      }
    `;
    document.head.appendChild(s);
  }

  el.appendChild(img);
  document.body.appendChild(el);

  // Animation de traversée
  const debut = performance.now();
  const dist  = endX - startX;

  function animer(now) {
    if (!hwEl || hwEl !== el) return;
    const t = Math.min(1, (now - debut) / HUGEWISHED.DUREE_MS);
    el.style.left = (startX + dist * t) + 'px';
    if (t < 1) {
      hwTraversee = requestAnimationFrame(animer);
    } else {
      // Sorti de l'écran sans être cliqué
      el.remove();
      hwEl = null;
    }
  }
  hwTraversee = requestAnimationFrame(animer);

  // Click : déclenche le boost
  el.addEventListener('click', () => {
    if (hwTraversee) cancelAnimationFrame(hwTraversee);
    // Animation pop puis suppression
    img.style.animation = 'hwPop .4s ease forwards';
    setTimeout(() => { el.remove(); hwEl = null; }, 420);
    activerBoostHugeWished();
  });
}

/* ── Active le boost ×6,7 vitesse pendant 67s ── */
function activerBoostHugeWished() {
  // Annuler un boost précédent si encore actif
  if (hwBoostTimeout) clearTimeout(hwBoostTimeout);
  supprimerUIBoost();

  hwBoostActif = true;
  hwBoostFin   = Date.now() + HUGEWISHED.BOOST_DUR;

  Sound.golden && Sound.golden();   // son "golden" pour l'impact

  // Notification
  const notif = document.createElement('div');
  notif.id = 'hwBoostNotif';
  notif.innerHTML = `🌟 HugeWished ! ×${HUGEWISHED.BOOST_MULT} vitesse — 67s`;
  document.body.appendChild(notif);
  setTimeout(() => notif.remove(), 2800);

  // Barre de progression en bas
  const bar = document.createElement('div');
  bar.id = 'hwBoostBar';
  document.body.appendChild(bar);

  // Réduction progressive de la barre
  const barDebut = Date.now();
  const barInterval = setInterval(() => {
    const reste = hwBoostFin - Date.now();
    if (reste <= 0) { clearInterval(barInterval); return; }
    const pct = (reste / HUGEWISHED.BOOST_DUR) * 100;
    bar.style.width = pct + '%';
    // Mise à jour du label vitesse dans le header
    const lbl = document.getElementById('speedLabel');
    if (lbl) lbl.textContent = `×${HUGEWISHED.BOOST_MULT}`;
  }, 100);

  // Applique le boost à l'auto-roll
  redemarrerAutoRollHW();

  // Fin du boost
  hwBoostTimeout = setTimeout(() => {
    hwBoostActif = false;
    clearInterval(barInterval);
    supprimerUIBoost();
    const lbl = document.getElementById('speedLabel');
    if (lbl) lbl.textContent = 'x1';
    redemarrerAutoRoll();   // revient à la vitesse normale
  }, HUGEWISHED.BOOST_DUR);
}

/* ── Redémarre l'auto-roll avec le multiplicateur HugeWished ── */
function redemarrerAutoRollHW() {
  if (!etat.autoRollActif) return;
  clearInterval(etat.autoInterval);
  const base = delaiAutoRollBase();

  // FIX : le speed Naël (×2 permanent) se cumule aussi avec le boost HugeWished
  const naellMult = etat.naellSpeedUnlocked ? 2 : 1;
  const mult  = HUGEWISHED.BOOST_MULT * naellMult;
  const delai = Math.max(
    (typeof AUTOROLL_DELAI_PLANCHER_MS === 'number') ? AUTOROLL_DELAI_PLANCHER_MS : 30,
    Math.round(base / mult)
  );
  etat.autoInterval = setInterval(effectuerRoll, delai);
  const badge = document.getElementById('autoSpeedBadge');
  if (badge) {
    badge.textContent = naellMult > 1 ? `×${HUGEWISHED.BOOST_MULT} ×2 👑` : `×${HUGEWISHED.BOOST_MULT}`;
    badge.classList.remove('hidden');
    badge.style.background  = 'rgba(251,191,36,.2)';
    badge.style.color       = '#fbbf24';
  }
}

/* ── Nettoie l'UI du boost ── */
function supprimerUIBoost() {
  const bar = document.getElementById('hwBoostBar');
  if (bar) bar.remove();
}
