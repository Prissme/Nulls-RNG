/* ════════════════════════════════════════════════
   anticheat.js — Anti Auto-Clicker
   Détecte les clics trop réguliers / trop rapides
   sur le bouton Roll et bloque temporairement.
════════════════════════════════════════════════ */

const ANTICHEAT = {
  FENETRE_MS:      3000,   // fenêtre d'analyse
  MAX_CLICS:       18,     // max clics humains dans la fenêtre (≈6/s)
  INTERVALLE_MIN:  60,     // ms minimum entre 2 clics (en dessous = bot)
  REGULARITE_SEUIL: 0.08,  // écart-type normalisé max (bot = très régulier)
  BLOCAGE_MS:      15000,  // durée de blocage en ms
};

let _acTimestamps  = [];   // timestamps des derniers clics manuels
let _acBloque      = false;
let _acBlocageFin  = 0;
let _acBlocageTimer = null;

/* ── Appeler à chaque clic manuel sur le bouton Roll ── */
function acEnregistrerClic() {
  if (_acBloque) return false; // clic refusé

  const now = Date.now();
  _acTimestamps.push(now);

  // Garder seulement la fenêtre d'analyse
  _acTimestamps = _acTimestamps.filter(t => now - t <= ANTICHEAT.FENETRE_MS);

  if (_acTimestamps.length >= ANTICHEAT.MAX_CLICS) {
    if (_acDetecterBot()) {
      _acDeclencher();
      return false;
    }
  }

  return true; // clic autorisé
}

/* ── Détection : intervalle trop court OU trop régulier ── */
function _acDetecterBot() {
  const ts = _acTimestamps;
  if (ts.length < 5) return false;

  // Calculer les intervalles
  const intervalles = [];
  for (let i = 1; i < ts.length; i++) {
    intervalles.push(ts[i] - ts[i - 1]);
  }

  // Trop rapide ?
  const minInterval = Math.min(...intervalles);
  if (minInterval < ANTICHEAT.INTERVALLE_MIN) return true;

  // Trop régulier ? (écart-type faible = bot)
  const moy = intervalles.reduce((a, b) => a + b, 0) / intervalles.length;
  const variance = intervalles.reduce((sum, v) => sum + Math.pow(v - moy, 2), 0) / intervalles.length;
  const ecartType = Math.sqrt(variance);
  const regularite = ecartType / moy; // coefficient de variation

  if (regularite < ANTICHEAT.REGULARITE_SEUIL) return true;

  return false;
}

/* ── Déclenche le blocage ── */
function _acDeclencher() {
  _acBloque     = true;
  _acBlocageFin = Date.now() + ANTICHEAT.BLOCAGE_MS;
  _acTimestamps = [];

  // Désactiver le bouton Roll
  const btn = document.getElementById('rollBtn');
  if (btn) {
    btn.disabled = true;
    btn.style.opacity = '.4';
    btn.style.cursor  = 'not-allowed';
  }

  // Notification
  const notif = document.createElement('div');
  notif.id = 'acNotif';
  notif.style.cssText = `
    position:fixed;top:70px;left:50%;transform:translateX(-50%);
    background:rgba(239,68,68,.15);border:1px solid rgba(239,68,68,.5);
    color:#fca5a5;font-weight:800;font-size:.85rem;
    padding:.65rem 1.4rem;border-radius:14px;z-index:9999;
    box-shadow:0 0 24px rgba(239,68,68,.3);
    white-space:nowrap;text-align:center;
  `;
  notif.innerHTML = `⛔ Auto-clicker détecté — Roll bloqué <span id="acCountdown">${ANTICHEAT.BLOCAGE_MS / 1000}s</span>`;
  document.body.appendChild(notif);

  // Countdown
  const interval = setInterval(() => {
    const restant = Math.ceil((_acBlocageFin - Date.now()) / 1000);
    const cd = document.getElementById('acCountdown');
    if (cd) cd.textContent = `${restant}s`;
  }, 500);

  // Fin du blocage
  _acBlocageTimer = setTimeout(() => {
    clearInterval(interval);
    _acBloque = false;
    _acTimestamps = [];
    const btn = document.getElementById('rollBtn');
    if (btn) {
      btn.disabled = false;
      btn.style.opacity = '';
      btn.style.cursor  = '';
    }
    const n = document.getElementById('acNotif');
    if (n) n.remove();
  }, ANTICHEAT.BLOCAGE_MS);
}

/* ── Vérifie si le roll manuel est autorisé ── */
function acRollAutorise() {
  if (!_acBloque) return true;
  // Secouer le bouton pour feedback
  secouerBouton('rollBtn');
  return false;
}
