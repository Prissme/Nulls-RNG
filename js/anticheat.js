/* ════════════════════════════════════════════════
   anticheat.js — Anti Auto-Clicker + Anti-Exploit Console
════════════════════════════════════════════════ */

/* ══════════════════════════════════════════════
   SECTION 1 : PROTECTION INVENTAIRE
   Bloque les injections directes via la console
   (ex: etat.inventaire["1_rainbow"] = 999)
══════════════════════════════════════════════ */

// Flag interne : autorise temporairement une écriture légitime
let _invWriteAllowed = false;

/**
 * Toutes les fonctions du jeu qui modifient etat.inventaire DOIVENT
 * passer par cette fonction. Elle pose le flag, exécute la mutation,
 * puis retire le flag — la fenêtre d'autorisation est synchrone (0ms).
 */
function _invMutation(fn) {
  _invWriteAllowed = true;
  try { fn(); } finally { _invWriteAllowed = false; }
}

/**
 * Installe un Proxy sur etat.inventaire qui rejette toute écriture
 * externe (console, script injecté) qui ne passe pas par _invMutation().
 * Appelé une fois après que etat est défini, dans initProtectionInventaire().
 */
function _installerProxyInventaire() {
  const handler = {
    set(target, prop, value) {
      if (!_invWriteAllowed) {
        // Écriture non autorisée détectée
        _signalExploit(`SET inventaire["${String(prop)}"] = ${JSON.stringify(value)}`);
        return true; // Silencieux côté console (ne throw pas, évite les traces utiles au tricheur)
      }
      target[prop] = value;
      return true;
    },
    deleteProperty(target, prop) {
      if (!_invWriteAllowed) {
        _signalExploit(`DELETE inventaire["${String(prop)}"]`);
        return true;
      }
      delete target[prop];
      return true;
    }
  };
  etat.inventaire = new Proxy(etat.inventaire, handler);
}

/* ── Snapshot de contrôle ──
   Recalcule la somme totale des items pour détecter une injection
   qui aurait eu lieu AVANT l'install du Proxy (ex: au load via cloudsave).
   Mis à jour après chaque mutation légitime. */
let _invSnapshot = 0;

function _recalcSnapshot() {
  _invSnapshot = Object.values(etat.inventaire).reduce((a, b) => a + (b || 0), 0);
}

/**
 * Vérification périodique : si le total des items a augmenté sans passer
 * par une mutation légitime, c'est un exploit.
 * (Ne couvre pas les cas où le tricheur enlève des items, ce qui n'a pas d'intérêt.)
 */
let _invCheckInterval = null;
function _demarrerVerificationInventaire() {
  _recalcSnapshot();
  _invCheckInterval = setInterval(() => {
    const total = Object.values(etat.inventaire).reduce((a, b) => a + (b || 0), 0);
    if (total > _invSnapshot + 1) { // +1 de tolérance pour la latence
      _signalExploit(`total inventaire passé de ${_invSnapshot} à ${total} sans mutation légitime`);
      // Rollback impossible sans backup — on bloque le jeu
      _bloquerJeu();
    }
    // Resync si la valeur a légitimement baissé (vente/craft) ou est correcte
    if (total <= _invSnapshot + 1) _invSnapshot = total;
  }, 3000);
}

/* ── Protection etat global ──
   Empêche de remplacer etat.inventaire entièrement depuis la console
   (ex: etat.inventaire = {monBrawler: 9999}) */
function _protegerEtatGlobal() {
  const originalInventaire = etat.inventaire;

  // On surveille les tentatives de remplacement de etat.inventaire lui-même
  Object.defineProperty(etat, 'inventaire', {
    get() { return originalInventaire; },
    set(val) {
      if (!_invWriteAllowed) {
        _signalExploit('Tentative de remplacement de etat.inventaire');
        return;
      }
      // Remplacement légitime (prestige reset ou cloudsave) :
      // on remplace le contenu du Proxy, pas la référence
      Object.keys(originalInventaire).forEach(k => delete originalInventaire[k]);
      if (val && typeof val === 'object') {
        Object.assign(originalInventaire, val);
      }
    },
    configurable: false
  });

  // Protéger aussi pieces et totalRolls contre l'injection directe
  let _pieces = etat.pieces;
  let _totalRolls = etat.totalRolls;

  Object.defineProperty(etat, 'pieces', {
    get() { return _pieces; },
    set(val) {
      if (!_invWriteAllowed && val > _pieces + 1e9) {
        _signalExploit(`pieces: ${_pieces} → ${val}`);
        return;
      }
      _pieces = val;
    },
    configurable: false
  });

  Object.defineProperty(etat, 'totalRolls', {
    get() { return _totalRolls; },
    set(val) {
      if (!_invWriteAllowed && val > _totalRolls + 10000) {
        _signalExploit(`totalRolls: ${_totalRolls} → ${val}`);
        return;
      }
      _totalRolls = val;
    },
    configurable: false
  });
}

/* ── Réaction à un exploit détecté ── */
let _exploitDetecte = false;

function _signalExploit(detail) {
  if (_exploitDetecte) return;
  console.warn('[NullsRNG] Tentative d\'exploit détectée.'); // volontairement vague
  _bloquerJeu();
}

function _bloquerJeu() {
  if (_exploitDetecte) return;
  _exploitDetecte = true;

  // Désactiver tous les boutons d'action
  ['rollBtn', 'autoRollBtn'].forEach(id => {
    const btn = document.getElementById(id);
    if (btn) { btn.disabled = true; btn.style.opacity = '.3'; }
  });

  // Overlay de blocage
  const overlay = document.createElement('div');
  overlay.style.cssText = `
    position:fixed;inset:0;z-index:99999;
    background:rgba(0,0,0,.92);
    display:flex;flex-direction:column;align-items:center;justify-content:center;
    gap:1rem;font-family:var(--font-mono,monospace);
  `;
  overlay.innerHTML = `
    <div style="font-size:2.5rem">🚫</div>
    <div style="color:#f87171;font-size:1.1rem;font-weight:900;letter-spacing:.05em">SESSION INVALIDE</div>
    <div style="color:#94a3b8;font-size:.8rem;text-align:center;max-width:280px;line-height:1.6">
      Une manipulation non autorisée a été détectée.<br>
      Recharge la page pour continuer.
    </div>
    <button onclick="location.reload()"
      style="margin-top:.5rem;padding:.6rem 1.6rem;border-radius:10px;border:none;
        background:linear-gradient(135deg,#dc2626,#7f1d1d);color:#fff;
        font-weight:800;font-size:.9rem;cursor:pointer">
      Recharger
    </button>
  `;
  document.body.appendChild(overlay);

  // Couper le cloud save pour éviter d'écraser avec un état corrompu
  if (typeof cloudAutoSaveId !== 'undefined' && cloudAutoSaveId) {
    clearInterval(cloudAutoSaveId);
  }
}

/* ── Point d'entrée : appeler après init de etat + inventaire chargé ── */
function initProtectionInventaire() {
  _installerProxyInventaire();
  _protegerEtatGlobal();
  _demarrerVerificationInventaire();
}


/* ══════════════════════════════════════════════
   SECTION 2 : ANTI AUTO-CLICKER (inchangé)
══════════════════════════════════════════════ */

const ANTICHEAT = {
  FENETRE_MS:        3000,
  MAX_CLICS:         18,
  INTERVALLE_MIN:    50,
  RATIO_RAPIDE_SEUIL: 0.5,
  REGULARITE_SEUIL:  0.10,
  ECHANTILLON_MIN:   8,
  BLOCAGE_MS:        15000,
};

let _acTimestamps  = [];
let _acBloque      = false;
let _acBlocageFin  = 0;
let _acBlocageTimer = null;

function acEnregistrerClic() {
  if (_acBloque) return false;

  const now = Date.now();
  _acTimestamps.push(now);
  _acTimestamps = _acTimestamps.filter(t => now - t <= ANTICHEAT.FENETRE_MS);

  if (typeof naellEnregistrerClic === 'function') naellEnregistrerClic();

  if (_acTimestamps.length >= ANTICHEAT.MAX_CLICS) {
    if (_acDetecterBot()) {
      _acDeclencher();
      return false;
    }
  }

  return true;
}

function _acDetecterBot() {
  const ts = _acTimestamps;
  if (ts.length < ANTICHEAT.ECHANTILLON_MIN) return false;

  const intervalles = [];
  for (let i = 1; i < ts.length; i++) {
    intervalles.push(ts[i] - ts[i - 1]);
  }

  const nbTropRapides = intervalles.filter(i => i < ANTICHEAT.INTERVALLE_MIN).length;
  const ratioTropRapides = nbTropRapides / intervalles.length;

  const moy = intervalles.reduce((a, b) => a + b, 0) / intervalles.length;
  const variance = intervalles.reduce((sum, v) => sum + Math.pow(v - moy, 2), 0) / intervalles.length;
  const ecartType = Math.sqrt(variance);
  const regularite = ecartType / moy;

  const tropRapideSoutenu = ratioTropRapides >= ANTICHEAT.RATIO_RAPIDE_SEUIL;
  const tropRegulier      = regularite < ANTICHEAT.REGULARITE_SEUIL;

  return tropRapideSoutenu && tropRegulier;
}

function _acDeclencher() {
  _acBloque     = true;
  _acBlocageFin = Date.now() + ANTICHEAT.BLOCAGE_MS;
  _acTimestamps = [];

  const btn = document.getElementById('rollBtn');
  if (btn) {
    btn.disabled = true;
    btn.style.opacity = '.4';
    btn.style.cursor  = 'not-allowed';
  }

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

  const interval = setInterval(() => {
    const restant = Math.ceil((_acBlocageFin - Date.now()) / 1000);
    const cd = document.getElementById('acCountdown');
    if (cd) cd.textContent = `${restant}s`;
  }, 500);

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

function acRollAutorise() {
  if (!_acBloque) return true;
  secouerBouton('rollBtn');
  return false;
}
