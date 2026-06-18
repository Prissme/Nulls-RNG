/* ════════════════════════════════════════════════
   combat.js — Combat Tour par Tour
   Équipe de brawlers équipés vs Robot ennemi
════════════════════════════════════════════════ */

const APPARITIONS_ROBOTS = [
  { id:'robot',     nom:'Robot Standard', image:'Robot.webp',      mult:0.7, couleur:'#94a3b8', desc:'Un bot basique, idéal pour s\'échauffer.' },
  { id:'boxer',     nom:'Robot Boxeur',   image:'BoxerRobot.webp', mult:1.0, couleur:'#f97316', desc:'Frappe fort, encaisse bien.' },
  { id:'sniper',    nom:'Robot Sniper',   image:'SniperRobot.webp',mult:1.3, couleur:'#38bdf8', desc:'Attaque à distance avec précision. Dangereux.' },
  { id:'big_robot', nom:'Giga Robot',     image:'BigRobot.webp',   mult:1.8, couleur:'#ef4444', desc:'Le boss. Seule une équipe soudée peut le vaincre.' },
];

/* ── État du combat ── */
let combat = null;

function creerEtatCombat() {
  const puissanceTotale = Math.max(10, totalCPS());
  const robotBase = APPARITIONS_ROBOTS[Math.floor(Math.random() * APPARITIONS_ROBOTS.length)];
  const variation = 0.8 + Math.random() * 0.4;
  const puissanceEnnemi = Math.max(5, Math.round(puissanceTotale * robotBase.mult * variation));

  const brawlers = etat.petsEquipes
    .filter(p => p !== null)
    .map(p => {
      const cps = calcCPS(p.brawler, p.variante);
      const hpMax = Math.max(30, cps * 15);
      const atk   = Math.max(5,  cps * 3);
      return {
        brawler:   p.brawler,
        variante:  p.variante,
        hpMax,
        hp:        hpMax,
        atk,
        mort:      false,
        special:   true,  // disponible 1x par combat
        bouclier:  false, // actif ce tour si Défense
      };
    });

  return {
    phase:       'intro',  // intro | combat | fin
    tour:        1,
    actifIndex:  0,        // index du brawler qui joue
    brawlers,
    robot: {
      ...robotBase,
      hpMax: puissanceEnnemi * 12,
      hp:    puissanceEnnemi * 12,
      atk:   Math.max(3, Math.round(puissanceEnnemi * 2)),
    },
    log:         [],
    en_cours:    false,    // verrou anti-double clic
    victoire:    null,
    gainPieces:  0,
    gainXP:      0,
  };
}

/* ── Utilitaires ── */
function brawlerVivant(c) {
  return c.brawlers.filter(b => !b.mort);
}

function prochainBrawlerVivant(c) {
  const vivants = c.brawlers.filter(b => !b.mort);
  return vivants[c.actifIndex % vivants.length] || null;
}

function logCombat(msg, classe = '') {
  combat.log.unshift({ msg, classe, id: Date.now() + Math.random() });
  if (combat.log.length > 20) combat.log.pop();
  rendreLog();
}

function couleurVarianteLocal(b, v) {
  if (v === 'rainbow') return '#e879f9';
  if (v === 'golden')  return '#fbbf24';
  if (v === 'shiny')   return '#38bdf8';
  return b.couleur;
}

/* ════════════════════════════════════════════════
   RENDU
════════════════════════════════════════════════ */

function afficherCombat() {
  const zone = document.getElementById('combatZone');
  if (!zone) return;

  if (!combat) {
    combat = creerEtatCombat();
  }

  if (combat.brawlers.length === 0) {
    zone.innerHTML = `
      <div style="text-align:center;padding:2rem;color:var(--text-muted)">
        <div style="font-size:2rem;margin-bottom:.5rem">⚠️</div>
        <div style="font-weight:700;color:#e2e8f0;margin-bottom:.3rem">Aucun pet équipé</div>
        <div style="font-size:.8rem">Équipe des brawlers depuis l'inventaire pour combattre !</div>
      </div>`;
    return;
  }

  rendreCombat();
}

function rendreCombat() {
  const zone = document.getElementById('combatZone');
  if (!zone || !combat) return;

  zone.innerHTML = `
    <div id="cb-team" class="cb-team"></div>
    <div id="cb-vs" class="cb-vs-row">
      <div id="cb-robot-card" class="cb-robot-card"></div>
      <div id="cb-log" class="cb-log"></div>
    </div>
    <div id="cb-actions" class="cb-actions"></div>
  `;

  rendreEquipe();
  rendreRobot();
  rendreLog();
  rendreActions();
}

function rendreEquipe() {
  const el = document.getElementById('cb-team');
  if (!el) return;
  el.innerHTML = combat.brawlers.map((b, i) => {
    const vivants = brawlerVivant(combat);
    const estActif = !b.mort && vivants.indexOf(b) === (combat.actifIndex % vivants.length);
    const color    = couleurVarianteLocal(b.brawler, b.variante);
    const pct      = Math.max(0, Math.round((b.hp / b.hpMax) * 100));
    const barColor = pct > 50 ? '#22c55e' : pct > 20 ? '#f59e0b' : '#ef4444';

    return `
      <div class="cb-brawler-card ${b.mort ? 'cb-mort' : ''} ${estActif ? 'cb-actif' : ''}"
           id="cb-br-${i}" style="border-color:${b.mort ? 'var(--border)' : color}44">
        <div style="font-size:.6rem;font-weight:900;text-transform:uppercase;letter-spacing:.08em;
          color:${b.mort ? 'var(--text-muted)' : color};margin-bottom:.2rem">
          ${b.mort ? '☠️ KO' : estActif ? '▶ En jeu' : ''}
        </div>
        <img src="${b.brawler.img}" alt="${b.brawler.nom}"
          style="width:48px;height:48px;object-fit:contain;opacity:${b.mort ? 0.3 : 1};
            ${b.mort ? 'filter:grayscale(1)' : ''}" 
          onerror="this.style.display='none'">
        <div style="font-size:.72rem;font-weight:800;color:${b.mort ? 'var(--text-muted)' : '#e2e8f0'};
          white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:80px">${b.brawler.nom}</div>
        <div style="width:100%;height:5px;background:var(--border);border-radius:3px;overflow:hidden;margin-top:.2rem">
          <div style="height:100%;width:${pct}%;background:${barColor};border-radius:3px;transition:width .4s ease"></div>
        </div>
        <div style="font-size:.6rem;color:var(--text-muted);margin-top:.1rem">${Math.max(0,b.hp)}/${b.hpMax}</div>
        ${!b.mort && b.special ? `<div style="font-size:.55rem;color:#a855f7;font-weight:700">✦ SPÉCIALE DISPO</div>` : ''}
      </div>
    `;
  }).join('');
}

function rendreRobot() {
  const el = document.getElementById('cb-robot-card');
  if (!el || !combat) return;
  const r   = combat.robot;
  const pct = Math.max(0, Math.round((r.hp / r.hpMax) * 100));
  const barColor = pct > 50 ? '#22c55e' : pct > 20 ? '#f59e0b' : '#ef4444';

  el.innerHTML = `
    <div style="font-size:.65rem;font-weight:900;text-transform:uppercase;color:${r.couleur};letter-spacing:.1em;margin-bottom:.3rem">
      ⚔️ Adversaire
    </div>
    <img src="./images/${r.image}" alt="${r.nom}" id="cb-robot-img"
      style="width:80px;height:80px;object-fit:contain"
      onerror="this.style.display='none'">
    <div style="font-weight:900;color:${r.couleur};font-size:.85rem;margin-top:.3rem">${r.nom}</div>
    <div style="font-size:.65rem;color:var(--text-muted);margin-bottom:.3rem">${r.desc}</div>
    <div style="width:100%;height:7px;background:var(--border);border-radius:4px;overflow:hidden;margin-bottom:.2rem">
      <div id="cb-robot-bar" style="height:100%;width:${pct}%;background:${barColor};border-radius:4px;transition:width .4s ease"></div>
    </div>
    <div style="font-size:.7rem;color:var(--text-muted)">${Math.max(0,r.hp)} / ${r.hpMax} HP</div>
    <div style="margin-top:.4rem;display:flex;gap:.5rem;justify-content:center;flex-wrap:wrap">
      <span style="font-size:.65rem;font-weight:700;background:rgba(239,68,68,.15);color:#ef4444;
        padding:.15rem .5rem;border-radius:6px">⚔️ ATK ${r.atk}</span>
    </div>
  `;
}

function rendreLog() {
  const el = document.getElementById('cb-log');
  if (!el || !combat) return;
  if (combat.log.length === 0) {
    el.innerHTML = `<div style="color:var(--text-muted);font-size:.72rem;text-align:center;padding:.5rem">
      Le combat va commencer…</div>`;
    return;
  }
  el.innerHTML = combat.log.slice(0, 8).map((entry, i) => `
    <div class="cb-log-entry ${entry.classe}" style="opacity:${1 - i * 0.1}">${entry.msg}</div>
  `).join('');
}

function rendreActions() {
  const el = document.getElementById('cb-actions');
  if (!el || !combat) return;

  if (combat.phase === 'fin') {
    const w = combat.victoire;
    el.innerHTML = `
      <div style="text-align:center;padding:.5rem 0">
        <div style="font-size:1.8rem">${w ? '🏆' : '💀'}</div>
        <div style="font-weight:900;font-size:1rem;color:${w ? '#22c55e' : '#ef4444'};margin:.2rem 0">
          ${w ? 'Victoire !' : 'Défaite…'}
        </div>
        ${w ? `<div style="font-size:.8rem;color:#fbbf24;margin-bottom:.5rem">
          +${combat.gainPieces} 💰 &nbsp; +${combat.gainXP} XP
        </div>` : `<div style="font-size:.75rem;color:var(--text-muted);margin-bottom:.5rem">
          Ton équipe a été mise hors de combat.
        </div>`}
        <button onclick="nouveauCombat()" style="
          background:linear-gradient(135deg,#7c3aed,#a855f7);border:none;border-radius:12px;
          color:#fff;font-weight:900;font-size:.85rem;padding:.7rem 1.6rem;cursor:pointer;
          box-shadow:0 0 16px rgba(168,85,247,.4)">
          ⚔️ Nouveau combat
        </button>
      </div>
    `;
    return;
  }

  const vivants = brawlerVivant(combat);
  const bActif  = vivants[combat.actifIndex % vivants.length];
  const bloque  = combat.en_cours || !bActif;

  el.innerHTML = `
    <div style="font-size:.7rem;color:var(--text-muted);text-align:center;margin-bottom:.4rem">
      Tour ${combat.tour} — 
      ${bActif ? `<span style="color:${couleurVarianteLocal(bActif.brawler, bActif.variante)};font-weight:800">${bActif.brawler.nom}</span> agit` : ''}
    </div>
    <div style="display:flex;gap:.5rem;flex-wrap:wrap;justify-content:center">
      <button class="cb-btn cb-btn-atk" onclick="actionCombat('attaque')" ${bloque ? 'disabled' : ''}>
        ⚔️ Attaque
      </button>
      <button class="cb-btn cb-btn-spe" onclick="actionCombat('speciale')"
        ${bloque || (bActif && !bActif.special) ? 'disabled' : ''}
        style="${bActif && !bActif.special ? 'opacity:.35' : ''}">
        ✦ Spéciale${bActif && !bActif.special ? ' (utilisée)' : ''}
      </button>
      <button class="cb-btn cb-btn-def" onclick="actionCombat('defense')" ${bloque ? 'disabled' : ''}>
        🛡️ Défense
      </button>
    </div>
  `;
}

/* ════════════════════════════════════════════════
   LOGIQUE DU COMBAT
════════════════════════════════════════════════ */

async function actionCombat(action) {
  if (!combat || combat.en_cours || combat.phase === 'fin') return;
  const vivants = brawlerVivant(combat);
  if (vivants.length === 0) return;

  combat.en_cours = true;
  rendreActions();

  const bActif = vivants[combat.actifIndex % vivants.length];

  /* ── Tour du joueur ── */
  let degatJoueur = 0;
  let msgJoueur   = '';

  if (action === 'attaque') {
    degatJoueur = Math.round(bActif.atk * (0.85 + Math.random() * 0.3));
    msgJoueur   = `⚔️ <b style="color:${couleurVarianteLocal(bActif.brawler, bActif.variante)}">${bActif.brawler.nom}</b> attaque : <b style="color:#ef4444">-${degatJoueur} HP</b>`;
    Sound.roll && Sound.roll();
  } else if (action === 'speciale') {
    if (!bActif.special) { combat.en_cours = false; return; }
    bActif.special   = false;
    degatJoueur = Math.round(bActif.atk * 2.5 * (0.9 + Math.random() * 0.2));
    msgJoueur   = `✦ <b style="color:#a855f7">${bActif.brawler.nom} SPÉCIALE</b> : <b style="color:#ef4444">-${degatJoueur} HP !</b>`;
    Sound.golden && Sound.golden();
  } else if (action === 'defense') {
    bActif.bouclier = true;
    degatJoueur = Math.round(bActif.atk * 0.5 * (0.8 + Math.random() * 0.4));
    msgJoueur   = `🛡️ <b style="color:#38bdf8">${bActif.brawler.nom}</b> se défend et riposte : <b style="color:#ef4444">-${degatJoueur} HP</b>`;
  }

  combat.robot.hp -= degatJoueur;
  logCombat(msgJoueur, 'cb-log-joueur');

  /* Flash robot */
  flashElement('cb-robot-img', '#ef4444');
  rendreRobot();

  await attendre(500);

  /* ── Vérifier si le robot est vaincu ── */
  if (combat.robot.hp <= 0) {
    combat.robot.hp = 0;
    combat.victoire = true;
    combat.gainPieces = Math.round(combat.robot.hpMax * 0.5);
    combat.gainXP     = Math.round(combat.robot.hpMax * 0.2);
    etat.pieces += combat.gainPieces;
    if (typeof gagnerXP === 'function') gagnerXP(combat.gainXP);
    if (typeof mettreAJourCompteurs === 'function') mettreAJourCompteurs();
    if (typeof sauvegarderEtatCloud === 'function') sauvegarderEtatCloud();
    logCombat(`🏆 <b style="color:#22c55e">Victoire !</b> Robot vaincu.`, 'cb-log-victoire');
    combat.phase = 'fin';
    combat.en_cours = false;
    rendreRobot();
    rendreActions();
    return;
  }

  /* ── Contre-attaque du robot ── */
  await attendre(300);

  const reductionBouclier = bActif.bouclier ? 0.4 : 1;
  const degatRobot = Math.round(combat.robot.atk * (0.8 + Math.random() * 0.4) * reductionBouclier);
  bActif.bouclier  = false;

  const cibleMsg = reductionBouclier < 1
    ? `🛡️ ${bActif.brawler.nom} bloque ! <b style="color:#f59e0b">-${degatRobot} HP</b> (réduit)`
    : `🤖 ${combat.robot.nom} contre-attaque <b style="color:#38bdf8">${bActif.brawler.nom}</b> : <b style="color:#f59e0b">-${degatRobot} HP</b>`;

  bActif.hp -= degatRobot;
  logCombat(cibleMsg, 'cb-log-robot');

  /* Flash brawler touché */
  const brIdx = combat.brawlers.indexOf(bActif);
  flashElement(`cb-br-${brIdx}`, '#f59e0b');

  if (bActif.hp <= 0) {
    bActif.hp   = 0;
    bActif.mort = true;
    logCombat(`☠️ <b style="color:#ef4444">${bActif.brawler.nom} est KO !</b>`, 'cb-log-ko');
    Sound.error && Sound.error();
  }

  /* ── Passer au prochain brawler vivant ── */
  combat.actifIndex++;
  combat.tour++;

  /* ── Vérifier défaite ── */
  if (brawlerVivant(combat).length === 0) {
    logCombat(`💀 <b style="color:#ef4444">Défaite…</b> Tous tes brawlers sont KO.`, 'cb-log-ko');
    combat.victoire = false;
    combat.phase    = 'fin';
    combat.en_cours = false;
    rendreEquipe();
    rendreActions();
    return;
  }

  combat.en_cours = false;
  rendreEquipe();
  rendreActions();
  rendreRobot();
}

function nouveauCombat() {
  combat = creerEtatCombat();
  rendreCombat();
}

/* ── Helpers ── */
function attendre(ms) {
  return new Promise(res => setTimeout(res, ms));
}

function flashElement(id, color) {
  const el = document.getElementById(id);
  if (!el) return;
  el.style.transition = 'filter .1s';
  el.style.filter = `drop-shadow(0 0 10px ${color}) brightness(1.5)`;
  setTimeout(() => { el.style.filter = ''; }, 300);
}

/* Compatibilité avec l'ancienne fonction modale */
function lancerCombat() {
  actionCombat('attaque');
}
