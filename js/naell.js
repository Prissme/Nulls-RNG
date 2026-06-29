/* ════════════════════════════════════════════════
   naell.js — Easter Egg : Naell le légende
   Déclenché par 10+ clics/s pendant 10s sur le bouton Roll
════════════════════════════════════════════════ */

const NAELL_TEXTE = "Naell écrase absolument toute la concurrence sur Null's Brawl cette année. Son skill légendaire, ses mécaniques parfaites et sa vision de jeu inégalée font de lui le meilleur joueur de tous les temps. Personne ne rivalise avec sa domination sur le serveur. C'est une évidence pour toute la communauté : Naell sera sacré Ballon d'Or Null's Brawl 2026.";
const NAELL_TEMPS_LIMITE = 60; // secondes
const NAELL_CPS_REQUIS   = 10; // clics/s
const NAELL_DUREE_SEUIL  = 10; // secondes à maintenir le CPS
const NAELL_COOLDOWN_MS  = 60 * 60 * 1000; // 1 heure

/* ── État interne ── */
let _naellActif         = false;
let _naellCooldownFin   = 0;
let _naellClicRecents   = []; // timestamps
let _naellDebutSeuil    = null; // moment où on a commencé à maintenir 10cps
let _naellTypingInterval = null;
let _naellTypingRestant  = NAELL_TEMPS_LIMITE;

/* ── Appelé à chaque clic sur rollBtn (depuis anticheat.js / index.html) ── */
/* ── Indicateur CPS debug (affiché pendant le clic rapide) ── */
let _naellDebugEl = null;
let _naellDebugTimeout = null;

function _naellShowDebug(cpsActuel) {
  if (!_naellDebugEl) {
    _naellDebugEl = document.createElement('div');
    _naellDebugEl.style.cssText = `
      position: fixed;
      bottom: 1.5rem;
      left: 50%;
      transform: translateX(-50%);
      z-index: 9999;
      background: rgba(9,9,15,.92);
      border: 1px solid rgba(139,92,246,.4);
      border-radius: 12px;
      padding: .5rem 1.2rem;
      font-family: var(--font-mono, monospace);
      font-size: .85rem;
      font-weight: 700;
      color: #e2e2f0;
      pointer-events: none;
      transition: opacity .2s;
      display: flex;
      align-items: center;
      gap: .6rem;
      white-space: nowrap;
    `;
    document.body.appendChild(_naellDebugEl);
  }

  const requis = NAELL_CPS_REQUIS;
  const ok = cpsActuel >= requis;
  const progSecs = _naellDebutSeuil ? ((Date.now() - _naellDebutSeuil) / 1000).toFixed(1) : '0.0';
  const totalSecs = NAELL_DUREE_SEUIL;

  const cpsColor = ok ? '#4ade80' : '#f87171';
  const barPct = ok ? Math.min(100, ((Date.now() - _naellDebutSeuil) / (NAELL_DUREE_SEUIL * 1000)) * 100) : 0;

  _naellDebugEl.innerHTML = `
    <span style="color:${cpsColor};font-size:1rem">${cpsActuel}</span>
    <span style="color:var(--text-muted, #5a5a7a);font-size:.7rem">/ ${requis} clic/s</span>
    ${ok ? `<span style="color:#a855f7;font-size:.72rem">⏱ ${progSecs}s</span>` : ''}
    <span style="display:inline-block;width:60px;height:4px;background:rgba(255,255,255,.1);border-radius:2px;overflow:hidden;vertical-align:middle">
      <span style="display:block;height:100%;width:${barPct}%;background:#a855f7;border-radius:2px;transition:width .1s"></span>
    </span>
  `;
  _naellDebugEl.style.opacity = '1';

  clearTimeout(_naellDebugTimeout);
  _naellDebugTimeout = setTimeout(() => {
    if (_naellDebugEl) {
      _naellDebugEl.style.opacity = '0';
      setTimeout(() => {
        if (_naellDebugEl) { _naellDebugEl.remove(); _naellDebugEl = null; }
      }, 200);
    }
  }, 1200);
}

function naellEnregistrerClic() {
  // Déjà actif ou en cooldown → rien
  if (_naellActif) return;
  if (Date.now() < _naellCooldownFin) return;
  if (etat.naellSpeedUnlocked) return; // déjà débloqué

  const now = Date.now();
  _naellClicRecents.push(now);
  // Garder seulement la dernière seconde
  _naellClicRecents = _naellClicRecents.filter(t => now - t <= 1000);

  const cpsActuel = _naellClicRecents.length;

  // Afficher l'indicateur debug
  _naellShowDebug(cpsActuel);

  if (cpsActuel >= NAELL_CPS_REQUIS) {
    if (_naellDebutSeuil === null) {
      _naellDebutSeuil = now;
    } else if (now - _naellDebutSeuil >= NAELL_DUREE_SEUIL * 1000) {
      // 10 secondes maintenues à 10+ cps → déclencher !
      _naellDebutSeuil = null;
      _naellClicRecents = [];
      if (_naellDebugEl) { _naellDebugEl.remove(); _naellDebugEl = null; }
      _naellOuvrirDialogue();
    }
  } else {
    // CPS retombé → reset le compteur de durée
    _naellDebutSeuil = null;
  }
}

/* ── Dialogue d'intro ── */
function _naellOuvrirDialogue() {
  _naellActif = true;

  const lignes = [
    "Salut mec.",
    "Crois pas que t'es fast pour cliquer t'es nul",
    "Je vais te montrer c'est quoi de la vraie rapidité",
  ];

  const overlay = document.createElement('div');
  overlay.id = 'naellOverlay';
  overlay.style.cssText = `
    position:fixed;inset:0;z-index:99999;
    background:rgba(0,0,0,.85);backdrop-filter:blur(6px);
    display:flex;align-items:center;justify-content:center;
    animation:fadeIn .3s ease;
  `;

  overlay.innerHTML = `
    <div id="naellBox" style="
      background:linear-gradient(135deg,#0f0c1a,#1a1230);
      border:2px solid rgba(168,85,247,.5);border-radius:20px;
      padding:2rem 2.5rem;max-width:420px;width:90%;
      box-shadow:0 0 60px rgba(168,85,247,.3);
      text-align:center;
    ">
      <div style="font-weight:900;font-size:1.1rem;color:#e879f9;margin-bottom:.6rem">
        NAELL
      </div>
      <img src="./Naell.webp" alt="Naell"
        style="width:110px;height:110px;object-fit:contain;
          filter:drop-shadow(0 0 18px rgba(168,85,247,.6));
          margin-bottom:1rem"
        onerror="this.style.display='none'">
      <div id="naellDialogueLigne" style="
        font-size:.9rem;color:#e2e8f0;font-weight:600;
        min-height:2.5rem;line-height:1.5;margin-bottom:1.5rem;
      "></div>
      <button id="naellSuiteBtn" onclick="_naellSuiteLigne()" style="
        background:linear-gradient(135deg,#7c3aed,#a855f7);
        border:none;border-radius:12px;color:#fff;
        font-weight:900;font-size:.85rem;padding:.65rem 1.8rem;
        cursor:pointer;box-shadow:0 0 16px rgba(168,85,247,.4);
      ">Continuer →</button>
    </div>
  `;

  document.body.appendChild(overlay);

  let ligneIdx = 0;
  const el = document.getElementById('naellDialogueLigne');

  function afficherLigne() {
    el.textContent = '';
    const texte = lignes[ligneIdx];
    let i = 0;
    const iv = setInterval(() => {
      el.textContent += texte[i];
      i++;
      if (i >= texte.length) clearInterval(iv);
    }, 30);
  }

  afficherLigne();

  window._naellSuiteLigne = function() {
    ligneIdx++;
    if (ligneIdx < lignes.length) {
      afficherLigne();
    } else {
      // Lancer le typing game
      overlay.remove();
      _naellLancerTyping();
    }
  };
}

/* ── Mini-jeu Typing Race ── */
function _naellLancerTyping() {
  _naellTypingRestant = NAELL_TEMPS_LIMITE;

  const overlay = document.createElement('div');
  overlay.id = 'naellTypingOverlay';
  overlay.style.cssText = `
    position:fixed;inset:0;z-index:99999;
    background:rgba(0,0,0,.9);backdrop-filter:blur(8px);
    display:flex;align-items:center;justify-content:center;
    padding:1rem;
  `;

  overlay.innerHTML = `
    <div style="
      background:linear-gradient(135deg,#0f0c1a,#1a1230);
      border:2px solid rgba(168,85,247,.5);border-radius:20px;
      padding:1.5rem;max-width:520px;width:100%;
      box-shadow:0 0 60px rgba(168,85,247,.3);
    ">
      <div style="display:flex;align-items:center;gap:.75rem;margin-bottom:1rem">
        <img src="./Naell.webp" alt="Naell"
          style="width:44px;height:44px;object-fit:cover;border-radius:50%;
            border:2px solid #a855f7;"
          onerror="this.style.display='none'">
        <div>
          <div style="font-weight:900;font-size:.85rem;color:#e879f9">NAELL — Typing Race</div>
          <div style="font-size:.72rem;color:var(--text-muted)">Écris le texte en moins de 60 secondes</div>
        </div>
        <div style="margin-left:auto;text-align:right">
          <div id="naellTimer" style="font-size:1.4rem;font-weight:900;color:#fbbf24;font-family:monospace">60</div>
          <div style="font-size:.6rem;color:var(--text-muted)">secondes</div>
        </div>
      </div>

      <!-- Texte à taper avec highlighting -->
      <div id="naellTexteAffiche" style="
        font-size:.78rem;line-height:1.8;color:#64748b;
        background:rgba(0,0,0,.3);border-radius:10px;
        padding:.75rem;margin-bottom:.8rem;
        font-family:monospace;word-break:break-word;
        border:1px solid rgba(255,255,255,.08);
        user-select:none;
      "></div>

      <!-- Zone de saisie -->
      <textarea id="naellInput" rows="3" placeholder="Commence à taper ici..." style="
        width:100%;background:rgba(0,0,0,.4);
        border:1px solid rgba(168,85,247,.4);border-radius:10px;
        color:#e2e8f0;font-size:.78rem;font-family:monospace;
        padding:.6rem;resize:none;outline:none;
        box-sizing:border-box;line-height:1.6;
      "></textarea>

      <div style="display:flex;justify-content:space-between;align-items:center;margin-top:.5rem">
        <div id="naellProgres" style="font-size:.72rem;color:var(--text-muted)">0 / ${NAELL_TEXTE.length} caractères</div>
        <div id="naellFeedback" style="font-size:.72rem;font-weight:700"></div>
      </div>
    </div>
  `;

  document.body.appendChild(overlay);

  // Rendre le texte avec highlighting
  _naellRendreTexte('');

  const input = document.getElementById('naellInput');
  input.focus();

  // Timer
  _naellTypingInterval = setInterval(() => {
    _naellTypingRestant--;
    const timerEl = document.getElementById('naellTimer');
    if (timerEl) {
      timerEl.textContent = _naellTypingRestant;
      timerEl.style.color = _naellTypingRestant <= 10 ? '#ef4444' : '#fbbf24';
    }
    if (_naellTypingRestant <= 0) {
      clearInterval(_naellTypingInterval);
      _naellEchec();
    }
  }, 1000);

  input.addEventListener('input', () => {
    const saisi = input.value;
    _naellRendreTexte(saisi);

    const progres = document.getElementById('naellProgres');
    if (progres) progres.textContent = `${saisi.length} / ${NAELL_TEXTE.length} caractères`;

    // Vérifier victoire
    if (saisi === NAELL_TEXTE) {
      clearInterval(_naellTypingInterval);
      _naellVictoire();
    }
  });

  // Empêcher coller
  input.addEventListener('paste', e => e.preventDefault());
}

/* ── Rendu du texte avec highlighting ── */
function _naellRendreTexte(saisi) {
  const el = document.getElementById('naellTexteAffiche');
  if (!el) return;

  let html = '';
  for (let i = 0; i < NAELL_TEXTE.length; i++) {
    const c = NAELL_TEXTE[i];
    const affiche = c === ' ' ? '&nbsp;' : c === '\n' ? '<br>' : c.replace(/</g,'&lt;').replace(/>/g,'&gt;');
    if (i < saisi.length) {
      if (saisi[i] === NAELL_TEXTE[i]) {
        html += `<span style="color:#22c55e">${affiche}</span>`;
      } else {
        html += `<span style="color:#ef4444;background:rgba(239,68,68,.15)">${affiche}</span>`;
      }
    } else if (i === saisi.length) {
      html += `<span style="background:rgba(168,85,247,.4);color:#e2e8f0">${affiche}</span>`;
    } else {
      html += `<span style="color:#475569">${affiche}</span>`;
    }
  }
  el.innerHTML = html;
}

/* ── Victoire ── */
function _naellVictoire() {
  const overlay = document.getElementById('naellTypingOverlay');
  if (overlay) overlay.remove();

  // Débloquer le bonus permanent
  etat.naellSpeedUnlocked = true;
  if (typeof sauvegarderEtatCloud === 'function') sauvegarderEtatCloud();
  if (typeof redemarrerAutoRoll   === 'function') redemarrerAutoRoll();
  if (typeof mettreAJourCompteurs === 'function') mettreAJourCompteurs();

  _naellActif = false;

  _naellAfficherResultat(
    "Mouais t'as eu de la luck, prends ça.",
    "🏆 Roll Speed ×2 débloqué DÉFINITIVEMENT !",
    '#22c55e',
    true
  );
}

/* ── Échec ── */
function _naellEchec() {
  const overlay = document.getElementById('naellTypingOverlay');
  if (overlay) overlay.remove();

  _naellCooldownFin = Date.now() + NAELL_COOLDOWN_MS;
  _naellActif = false;

  _naellAfficherResultat(
    "HAHAHAHAHAHHAHAHHAHAHAHAHAHHAHAHAHAHAHAHAHHAHAHAHAHAHAHAHHAHAH MDRMDDMDMMDMMRMRMRMRMRMDMDMDMDMRMRMRMRMRRDRDRDRDR T'ES TROP NUL",
    "⏳ Réessaie dans 1 heure...",
    '#ef4444',
    false
  );
}

/* ── Écran résultat ── */
function _naellAfficherResultat(citation, sousTitre, couleur, victoire) {
  const overlay = document.createElement('div');
  overlay.style.cssText = `
    position:fixed;inset:0;z-index:99999;
    background:rgba(0,0,0,.85);backdrop-filter:blur(6px);
    display:flex;align-items:center;justify-content:center;
    padding:1rem;
  `;

  overlay.innerHTML = `
    <div style="
      background:linear-gradient(135deg,#0f0c1a,#1a1230);
      border:2px solid ${couleur}66;border-radius:20px;
      padding:2rem;max-width:400px;width:100%;
      box-shadow:0 0 60px ${couleur}33;
      text-align:center;
    ">
      <div style="font-weight:900;font-size:.8rem;color:#a855f7;margin-bottom:.5rem">NAELL</div>
      <img src="./Naell.webp" alt="Naell"
        style="width:90px;height:90px;object-fit:contain;
          filter:drop-shadow(0 0 16px ${couleur}99);
          margin-bottom:1rem"
        onerror="this.style.display='none'">
      <div style="font-size:.82rem;color:#e2e8f0;font-weight:600;
        line-height:1.5;margin-bottom:1rem;font-style:italic;
        word-break:break-word;overflow-wrap:break-word;max-width:100%">
        "${citation}"
      </div>
      <div style="font-size:.8rem;font-weight:800;color:${couleur};margin-bottom:1.5rem">
        ${sousTitre}
      </div>
      <button onclick="this.closest('div[style*=\"fixed\"]').remove()" style="
        background:linear-gradient(135deg,#7c3aed,#a855f7);
        border:none;border-radius:12px;color:#fff;
        font-weight:900;font-size:.85rem;padding:.65rem 1.8rem;
        cursor:pointer;
      ">OK</button>
    </div>
  `;

  document.body.appendChild(overlay);
}
