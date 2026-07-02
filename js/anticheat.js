/* ════════════════════════════════════════════════
   anticheat.js — Anti Auto-Clicker + Anti-Exploit Console
════════════════════════════════════════════════ */

/* ── FIX SÉCURITÉ ──
   Tout le fichier est encapsulé dans une IIFE, comme roll.js.
   Avant ce fix, _invWriteAllowed, _acBloque, _exploitDetecte, etc.
   étaient déclarées avec `let` au niveau racine du script. Dans un
   <script> classique (non-module), ces bindings restent visibles et
   RÉASSIGNABLES depuis la console DevTools (même scope global lexical
   que la page) : un joueur pouvait taper `_invWriteAllowed = true`
   dans la console pour désactiver entièrement la protection inventaire
   puis injecter ce qu'il voulait. En les enfermant dans cette IIFE,
   elles deviennent de vraies variables privées de closure, inaccessibles
   depuis la console. Seules les fonctions réellement appelées depuis
   l'extérieur (onclick HTML, main.js) sont exposées sur window. */
(function () {

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
 *
 * FIX : l'ancienne tolérance de "+1" par tick (3s) supposait un auto-roll au
 * mieux à 1 roll/sec. Depuis la correction du rate-limit (qui bloquait à tort
 * les rolls rapides), l'auto-roll légitime peut atteindre AUTOROLL_DELAI_PLANCHER_MS
 * (25ms) avec les boosts cumulés, soit jusqu'à ~120 rolls en 3s — ce qui
 * dépassait l'ancienne tolérance et déclenchait un blocage instantané sur un
 * autoroll parfaitement normal. La vraie protection contre l'injection directe
 * est le Proxy synchrone (SECTION 1, plus haut) : ce check périodique n'est
 * qu'un filet de sécurité redondant pour un cas résiduel (remplacement de la
 * référence d'objet avant l'installation du Proxy). On peut donc se permettre
 * une tolérance large, calée sur le pire débit légitime possible.
 */
const INV_CHECK_INTERVALLE_MS = 3000;
const INV_CHECK_TOLERANCE = Math.ceil(INV_CHECK_INTERVALLE_MS / 25) + 20; // ~140

let _invCheckInterval = null;
function _demarrerVerificationInventaire() {
  _recalcSnapshot();
  _invCheckInterval = setInterval(() => {
    const total = Object.values(etat.inventaire).reduce((a, b) => a + (b || 0), 0);
    if (total > _invSnapshot + INV_CHECK_TOLERANCE) {
      _signalExploit(`total inventaire passé de ${_invSnapshot} à ${total} sans mutation légitime`);
      // Rollback impossible sans backup — on bloque le jeu
      _bloquerJeu();
    }
    // Resync si la valeur a légitimement baissé (vente/craft) ou est correcte
    if (total <= _invSnapshot + INV_CHECK_TOLERANCE) _invSnapshot = total;
  }, INV_CHECK_INTERVALLE_MS);
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
    position:fixed;top:calc(var(--header-h, 96px) + 10px);left:50%;transform:translateX(-50%);
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


/* ══════════════════════════════════════════════
   SECTION 3 : RATE-LIMIT SUR effectuerRoll()
   Bloque les appels directs depuis la console
   (ex: for(let i=0;i<9999;i++) effectuerRoll())
   Le vrai effectuerRoll est wrappé ici au moment
   où initProtectionRoll() est appelé — après que
   roll.js a posé window.effectuerRoll.
══════════════════════════════════════════════ */

/* FIX faux positifs (v3) : les versions précédentes jugeaient sur des
   MICRO-intervalles entre deux appels (12-30ms). Problème structurel : ce
   genre de mesure est intrinsèquement fragile face au jank du thread
   principal (reflow d'animation, GC, allocations DOM à 40 rolls/sec...).
   Un joueur légitime à vitesse max peut voir ses appels s'agglutiner sur
   quelques ms sans avoir triché, et ça peut se reproduire assez souvent
   pour accumuler des strikes même avec le système de tolérance précédent.

   Changement d'approche : on ne regarde plus QUAND les appels arrivent
   dans le temps, mais COMBIEN il y en a sur une fenêtre large (2s) — et on
   compare ce débit réel au débit légitime MAXIMUM calculé EN DIRECT depuis
   l'état de jeu actuel (delaiAutoRollBase + boosts Wished/Speed/Naël/
   HugeWished réellement actifs), et non plus une constante figée pire-cas.
   Le jank redistribue seulement QUAND les appels tombent dans la fenêtre,
   pas COMBIEN il y en a au total sur 2s — cette méthode est donc insensible
   par construction au jank, tout en repérant un vrai script qui pousse
   plus de rolls que ce que le jeu autorise réellement à cet instant. */
const ROLL_RATELIMIT = {
  FENETRE_DEBIT_MS:     2000,  // fenêtre glissante d'analyse du débit réel
  MARGE_DEBIT:            1.6, // tolérance ×1.6 vs le débit légitime théorique
  MARGE_DEBIT_FIXE:        10, // + tolérance additive fixe (petites fenêtres, arrondis)

  FENETRE_FLOOD_MS:       100, // sous-fenêtre très courte pour un flood évident
  BURST_INSTANTANE:        40, // ex: boucle synchrone qui spam effectuerRoll()

  STRIKES_MAX:               3,  // nb de dépassements de débit tolérés avant blocage réel
  STRIKES_FENETRE_MS:   15000,   // ...s'ils se répètent dans cette fenêtre glissante
};

let _rrTimestamps = [];  // horodatages des derniers effectuerRoll() (fenêtre débit)
let _rrStrikes    = [];  // horodatages des dépassements de débit récents

function _rrEnregistrerStrike(now) {
  _rrStrikes.push(now);
  _rrStrikes = _rrStrikes.filter(t => now - t <= ROLL_RATELIMIT.STRIKES_FENETRE_MS);
  return _rrStrikes.length;
}

/* Débit légitime maximum ACTUEL (ms entre deux rolls), recalculé à chaque
   appel à partir du véritable état de jeu — pas une constante figée.
   Reproduit la logique de autoroll.js / hugewished.js. Défensif : si une
   fonction/variable attendue n'existe pas encore (ordre de chargement des
   scripts, sauvegarde en cours de restauration, etc.), on retombe sur le
   plancher théorique connu plutôt que de faire planter la protection. */
function _rrDelaiLegitimeActuel() {
  try {
    const base = (typeof delaiAutoRollBase === 'function') ? delaiAutoRollBase() : 1000;
    let mult = 1;

    if (typeof hwBoostActif !== 'undefined' && hwBoostActif && typeof HUGEWISHED !== 'undefined') {
      mult *= HUGEWISHED.BOOST_MULT;
    } else if (typeof etat !== 'undefined' && etat.wishedActive && typeof POTIONS !== 'undefined') {
      mult *= POTIONS.wished.speedMult;
    } else if (typeof etat !== 'undefined' && etat.speedActive) {
      mult *= 3;
    }
    if (typeof etat !== 'undefined' && etat.naellSpeedUnlocked) mult *= 2;

    const plancher = (typeof AUTOROLL_DELAI_PLANCHER_MS === 'number') ? AUTOROLL_DELAI_PLANCHER_MS : 25;
    return mult > 1 ? Math.max(plancher, Math.round(base / mult)) : base;
  } catch (_) {
    return 25; // fallback prudent : plancher théorique connu du jeu
  }
}

function initProtectionRoll() {
  const _rollOriginal = window.effectuerRoll;
  if (typeof _rollOriginal !== 'function') {
    console.warn('[NullsRNG] initProtectionRoll : effectuerRoll introuvable.');
    return;
  }

  window.effectuerRoll = function (...args) {
    const now = Date.now();

    _rrTimestamps.push(now);
    _rrTimestamps = _rrTimestamps.filter(t => now - t <= ROLL_RATELIMIT.FENETRE_DEBIT_MS);

    // ── Flood évident sur une fenêtre très courte (boucle synchrone) ──
    const recents = _rrTimestamps.filter(t => now - t <= ROLL_RATELIMIT.FENETRE_FLOOD_MS).length;
    if (recents > ROLL_RATELIMIT.BURST_INSTANTANE) {
      _signalExploit(`effectuerRoll flood : ${recents} appels en ${ROLL_RATELIMIT.FENETRE_FLOOD_MS}ms`);
      return;
    }

    // ── Débit réel vs débit légitime max actuel, sur la fenêtre large ──
    const delaiLegit    = _rrDelaiLegitimeActuel();
    const debitAttendu  = Math.ceil(ROLL_RATELIMIT.FENETRE_DEBIT_MS / delaiLegit);
    const seuil         = Math.ceil(debitAttendu * ROLL_RATELIMIT.MARGE_DEBIT) + ROLL_RATELIMIT.MARGE_DEBIT_FIXE;

    if (_rrTimestamps.length > seuil) {
      const nbStrikes = _rrEnregistrerStrike(now);
      if (nbStrikes >= ROLL_RATELIMIT.STRIKES_MAX) {
        _signalExploit(`débit anormal soutenu : ${_rrTimestamps.length} rolls / ${ROLL_RATELIMIT.FENETRE_DEBIT_MS}ms (seuil ${seuil}), ${nbStrikes} strikes`);
        return;
      }
    }

    return _rollOriginal.apply(this, args);
  };
}

/* ── Exposition contrôlée sur window ──
   Uniquement les fonctions appelées depuis l'extérieur de ce fichier
   (onclick dans index.html, main.js). Tout le reste reste privé. */
window.initProtectionInventaire = initProtectionInventaire;
window.initProtectionRoll       = initProtectionRoll;
window.acEnregistrerClic        = acEnregistrerClic;
window.acRollAutorise           = acRollAutorise;
// _invMutation doit rester accessible : roll.js, craft.js, inventory.js,
// prestige.js, cloudsave.js et offline.js l'appellent toutes pour leurs
// mutations légitimes d'inventaire. L'exposer ne réintroduit pas la faille :
// c'est juste la fonction qui pose le flag de façon synchrone (0ms), pas le
// flag lui-même — la faille corrigée était l'accès direct à _invWriteAllowed.
window._invMutation             = _invMutation;

})(); // fin IIFE anticheat.js
