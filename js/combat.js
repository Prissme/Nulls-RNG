/* ════════════════════════════════════════════════
   combat.js — Combat Tour par Tour
   Équipe de brawlers équipés vs Vague de robots ennemis

   15 levels de progression, à chaque victoire on avance d'un level.
   Le level est cyclique : après 15, on repart mais les robots sont plus forts.

   Système de rôles :
     💥 Burst contre 🛡️ Tank/Aggro contre 🎯 Poke/Sniper contre 💥 Burst
     💚 Soutien : toujours neutre, soigne son équipe (spéciale)
════════════════════════════════════════════════ */

const APPARITIONS_ROBOTS = {
  robot:     { id:'robot',     nom:'Robot Standard', image:'Robot.webp',       couleur:'#94a3b8', desc:'Un bot basique.',                              role:'burst', hpMult:1.0, atkMult:1.0 },
  boxer:     { id:'boxer',     nom:'Robot Boxeur',   image:'BoxerRobot.webp',  couleur:'#f97316', desc:'Frappe fort, encaisse bien.',                  role:'tank',  hpMult:1.4, atkMult:1.2 },
  sniper:    { id:'sniper',    nom:'Robot Sniper',   image:'SniperRobot.webp', couleur:'#38bdf8', desc:'Attaque à distance avec précision.',           role:'poke',  hpMult:0.8, atkMult:1.5 },
  big_robot: { id:'big_robot', nom:'Giga Robot',     image:'BigRobot.webp',    couleur:'#ef4444', desc:'Le boss. Seule une équipe soudée peut vaincre.', role:'tank', hpMult:2.5, atkMult:1.8 },
};

/* ── Les 15 levels : tableau de vagues ── */
const LEVELS_COMBAT = [
  /* L1  — Tutorial : 1 robot basique */
  [{ type:'robot',     n:1  }],
  /* L2  — Intro tank */
  [{ type:'boxer',     n:1  }],
  /* L3  — Duo sniper, faut un tank ou un burst */
  [{ type:'sniper',    n:2  }],
  /* L4  — Mix tank + robot, composition burst conseillée */
  [{ type:'boxer',     n:2  }, { type:'robot', n:2 }],
  /* L5  — Premier Boss, HP x2.5 — seule un soutien peut tenir */
  [{ type:'big_robot', n:1  }],
  /* L6  — 5 snipers, ATK élevée — tank ou soutien obligatoire */
  [{ type:'sniper',    n:5  }],
  /* L7  — Flanc tank + poke — mix de rôles nécessaire */
  [{ type:'boxer',     n:3  }, { type:'sniper', n:3 }],
  /* L8  — Horde de robots, volume écrasant */
  [{ type:'robot',     n:10 }],
  /* L9  — Trio infernal, toutes compositions testées */
  [{ type:'sniper',    n:4  }, { type:'boxer', n:3 }, { type:'robot', n:3 }],
  /* L10 — Boss + escorte de robots, milestone critique */
  [{ type:'big_robot', n:1  }, { type:'robot', n:8 }],
  /* L11 — Deux boss + mix, sans soutien c'est la défaite */
  [{ type:'big_robot', n:2  }, { type:'boxer', n:2 }, { type:'sniper', n:2 }],
  /* L12 — Trois boss, ATK dévastatrice */
  [{ type:'big_robot', n:3  }],
  /* L13 — Armée de choc : boss + boxeurs + snipers */
  [{ type:'big_robot', n:2  }, { type:'boxer', n:4 }, { type:'sniper', n:4 }],
  /* L14 — Vague de 20 robots — défense et soutien indispensables */
  [{ type:'robot',     n:20 }],
  /* L15 — HARDCORE : le chaos absolu, seule la meilleure compo survit */
  [{ type:'big_robot', n:4  }, { type:'boxer', n:6 }, { type:'sniper', n:8 }, { type:'robot', n:12 }],
];

/* ── Multiplicateurs de stats par palier de level (dans un cycle de 15) ── */
function statMultiplierForLevel(levelInCycle) {
  // L1–5 : apprentissage (x1 → x2)
  if (levelInCycle <= 5)  return 1 + (levelInCycle - 1) * 0.25;
  // L6–10 : intermédiaire (x2.25 → x4)
  if (levelInCycle <= 10) return 2.25 + (levelInCycle - 6) * 0.35;
  // L11–14 : difficile (x4.5 → x7)
  if (levelInCycle <= 14) return 4.5 + (levelInCycle - 11) * 0.83;
  // L15 : HARDCORE (x9)
  return 9;
}

/* ── État du combat ── */
let combat = null;

/* ── Level sélectionné pour le farm (null = prochain level normal) ── */
let farmLevel = null;

/* ── Créer la liste de robots pour un level donné ── */
function creerVague(level) {
  /* level est 1-indexé. Cycle sur 15. */
  const idx          = ((level - 1) % 15);
  const levelInCycle = idx + 1;
  const cycle        = Math.floor((level - 1) / 15); // combien de fois on a bouclé

  /* Scaling intra-cycle (L1→L15 de plus en plus dur) + bonus inter-cycle */
  const intraScale = statMultiplierForLevel(levelInCycle);
  const cycleScale = 1 + cycle * 0.75; // +75% puissance par cycle (au lieu de +50%)
  const scaleMult  = intraScale * cycleScale;

  const baseHP  = 120; // augmenté de 80 → 120
  const baseATK = 22;  // augmenté de 15 → 22

  const robots = [];
  LEVELS_COMBAT[idx].forEach(groupe => {
    const proto = APPARITIONS_ROBOTS[groupe.type];
    for (let i = 0; i < groupe.n; i++) {
      const hp  = Math.round(baseHP  * proto.hpMult  * scaleMult);
      const atk = Math.round(baseATK * proto.atkMult * scaleMult);
      robots.push({
        ...proto,
        nom:  groupe.n > 1 ? `${proto.nom} #${i + 1}` : proto.nom,
        hpMax: hp,
        hp,
        atk,
        mort: false,
      });
    }
  });
  return robots;
}

function creerEtatCombat() {
  const nextLevel = (etat.combatsGagnes || 0) + 1;
  const level     = farmLevel !== null ? farmLevel : nextLevel;
  const isFarm    = farmLevel !== null && farmLevel < nextLevel;

  const vague = creerVague(level);

  /* ── Stats brawlers : individuelles selon les skills de chaque brawler ── */
  const brawlers = etat.petsEquipes
    .filter(p => p !== null)
    .map(p => {
      const hpMult  = typeof bonusHPBrawler  === 'function' ? bonusHPBrawler(p.brawler.id, p.variante)  : 1;
      const atkMult = typeof bonusATKBrawler === 'function' ? bonusATKBrawler(p.brawler.id, p.variante) : 1;
      const hpMax = Math.round(100 * hpMult);
      const atk   = Math.round(20  * atkMult);
      return {
        brawler:  p.brawler,
        variante: p.variante,
        hpMax, hp: hpMax, atk,
        mort: false, special: true, bouclier: false,
      };
    });

  /* Calcul des récompenses : somme des HP de tous les robots */
  const totalHPVague = vague.reduce((s, r) => s + r.hpMax, 0);
  /* En mode farm : pièces/XP réduits à 30%, PP réduits à 1 fixe */
  const farmMult = isFarm ? 0.3 : 1;

  return {
    phase:        'combat',
    tour:         1,
    actifIndex:   0,
    brawlers,
    vague,
    robotIndex:   0,
    log:          [],
    en_cours:     false,
    victoire:     null,
    gainPieces:   Math.round(totalHPVague * 0.5 * farmMult),
    gainXP:       Math.round(totalHPVague * 0.2 * farmMult),
    gainGemmes:   Math.max(1, Math.round(totalHPVague * 0.015 * farmMult)),
    gainPP:       0,
    fureurStacks: 0,
    level,
    isFarm,
  };
}

/* ── Robot actuellement ciblé ── */
function robotActuel(c) {
  return c.vague[c.robotIndex] || null;
}

/* ── Utilitaires ── */
function brawlerVivant(c) { return c.brawlers.filter(b => !b.mort); }

/* ── Brawler actif courant ──
   FIX désync des tours : l'ancienne logique faisait
   `vivants[combat.actifIndex % vivants.length]`, où `vivants` est
   recalculé (tableau des survivants). Dès qu'un brawler meurt, ce
   tableau rétrécit et le modulo change de "cible" pour le même
   actifIndex → un brawler pouvait rejouer immédiatement ou un autre se
   faire sauter son tour, juste au moment d'une mort.
   Ici, actifIndex est un index FIXE dans combat.brawlers (jamais
   recalculé) : on avance dedans en sautant les morts, ce qui garantit
   une rotation stable et équitable quel que soit l'ordre des morts. */
function brawlerActifCourant(c) {
  if (!c || !c.brawlers || c.brawlers.length === 0) return null;
  const n = c.brawlers.length;
  for (let i = 0; i < n; i++) {
    const idx = (c.actifIndex + i) % n;
    if (!c.brawlers[idx].mort) return { brawler: c.brawlers[idx], index: idx };
  }
  return null; // plus personne en vie
}

function logCombat(msg, classe = '') {
  combat.log.unshift({ msg, classe, id: Date.now() + Math.random() });
  if (combat.log.length > 20) combat.log.pop();
  rendreLog();
}

function couleurVarianteLocal(b, v) {
  if (v === 'monochrome') return '#f8fafc';
  if (v === 'rainbow') return '#e879f9';
  if (v === 'golden')  return '#fbbf24';
  if (v === 'shiny')   return '#38bdf8';
  return b.couleur;
}

function roleBadge(role, taille = '.55rem') {
  const r = ROLES[role];
  if (!r) return '';
  return `<span style="font-size:${taille};font-weight:800;color:${r.couleur};white-space:nowrap">${r.emoji} ${r.label}</span>`;
}

function suffixeAvantage(mult) {
  if (mult > 1) return ` <span style="color:#22c55e;font-weight:800">(avantage ×${mult})</span>`;
  if (mult < 1) return ` <span style="color:#ef4444;font-weight:800">(désavantage ×${mult})</span>`;
  return '';
}

/* ════════════════════════════════════════════════
   RENDU
════════════════════════════════════════════════ */

function afficherCombat() {
  const zone = document.getElementById('combatZone');
  if (!zone) return;
  if (!combat) combat = creerEtatCombat();
  if (combat.brawlers.length === 0 && combat.phase !== 'fin') {
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

function rendreFarmSelector() {
  const maxBattu = etat.combatsGagnes || 0;
  if (maxBattu < 2) return ''; // pas encore de levels à farmer

  const currentFarm = farmLevel;
  const nextLevel   = maxBattu + 1;

  // Construit les options : levels 1 → maxBattu (déjà battus)
  const options = [];
  for (let i = 1; i <= maxBattu; i++) {
    const inCycle = ((i - 1) % 15) + 1;
    const selected = currentFarm === i ? 'selected' : '';
    options.push(`<option value="${i}" ${selected}>Level ${inCycle}/15 (×${Math.floor((i-1)/15)+1})</option>`);
  }

  const modeActif = currentFarm !== null && currentFarm < nextLevel;

  return `
    <div style="display:flex;align-items:center;gap:.5rem;flex-wrap:wrap;
      padding:.4rem .6rem;background:rgba(251,191,36,.06);border-radius:10px;
      border:1px solid rgba(251,191,36,.2);margin-bottom:.5rem">
      <span style="font-size:.7rem;font-weight:800;color:#fbbf24;white-space:nowrap">🔄 FARM</span>
      <select id="farmLevelSelect" onchange="setFarmLevel(this.value)"
        style="background:#1e1b2e;color:#e2e8f0;border:1px solid rgba(255,255,255,.15);
          border-radius:8px;padding:.2rem .4rem;font-size:.7rem;font-weight:700;cursor:pointer;flex:1">
        <option value="" ${!modeActif ? 'selected' : ''}>⚔️ Prochain level (${((nextLevel-1)%15)+1}/15)</option>
        ${options.join('')}
      </select>
      ${modeActif ? `<span style="font-size:.6rem;color:#fbbf24;white-space:nowrap">récomp. ×0.3</span>` : ''}
    </div>
  `;
}

function setFarmLevel(val) {
  const nextLevel = (etat.combatsGagnes || 0) + 1;
  farmLevel = val === '' ? null : parseInt(val);
  // Si le combat actuel n'est pas en cours, on relance
  if (!combat || combat.phase === 'fin' || combat.phase === 'combat' && combat.tour === 1 && combat.log.length === 0) {
    combat = creerEtatCombat();
  }
  rendreCombat();
}

function rendreCombat() {
  const zone = document.getElementById('combatZone');
  if (!zone || !combat) return;
  zone.innerHTML = `
    <div id="cb-farm-selector">${rendreFarmSelector()}</div>
    <div id="cb-level-bar"></div>
    <div id="cb-team" class="cb-team"></div>
    <div id="cb-vs" class="cb-vs-row">
      <div id="cb-robot-card" class="cb-robot-card"></div>
      <div id="cb-log" class="cb-log"></div>
    </div>
    <div id="cb-actions" class="cb-actions"></div>
  `;
  rendreLevelBar();
  rendreEquipe();
  rendreRobot();
  rendreLog();
  rendreActions();
}

/* ── Barre de progression du level ── */
function rendreLevelBar() {
  const el = document.getElementById('cb-level-bar');
  if (!el || !combat) return;
  const level        = combat.level;
  const cycle        = Math.floor((level - 1) / 15);
  const levelInCycle = ((level - 1) % 15) + 1;
  const robot        = robotActuel(combat);
  const vivants      = combat.vague.filter(r => !r.mort);
  const total        = combat.vague.length;
  const ko           = total - vivants.length;

  /* Indicateur de difficulté */
  let diffLabel, diffColor;
  if (levelInCycle <= 5)       { diffLabel = '🟢 Facile';    diffColor = '#22c55e'; }
  else if (levelInCycle <= 9)  { diffLabel = '🟡 Normal';    diffColor = '#f59e0b'; }
  else if (levelInCycle <= 13) { diffLabel = '🔴 Difficile'; diffColor = '#ef4444'; }
  else if (levelInCycle === 14){ diffLabel = '☠️ Extrême';   diffColor = '#f97316'; }
  else                         { diffLabel = '💀 HARDCORE';  diffColor = '#a855f7'; }

  el.innerHTML = `
    <div style="display:flex;align-items:center;justify-content:space-between;
      margin-bottom:.5rem;padding:.4rem .6rem;background:rgba(168,85,247,.08);
      border-radius:10px;border:1px solid rgba(168,85,247,.2)">
      <div style="display:flex;align-items:center;gap:.5rem">
        <span style="font-size:.8rem;font-weight:900;color:#a855f7">
          ⚡ Level ${levelInCycle}/15
        </span>
        ${cycle > 0 ? `<span style="font-size:.6rem;color:#f59e0b">Cycle ${cycle + 1}</span>` : ''}
        <span style="font-size:.65rem;font-weight:800;color:${diffColor}">${diffLabel}</span>
      </div>
      <div style="font-size:.65rem;color:var(--text-muted)">
        ${ko}/${total} robots éliminés
      </div>
    </div>
    <div style="display:flex;gap:4px;flex-wrap:wrap;margin-bottom:.6rem;justify-content:center">
      ${combat.vague.map((r, i) => `
        <div title="${r.nom}" style="
          width:22px;height:22px;border-radius:5px;border:1.5px solid ${r.mort ? 'rgba(100,100,120,.3)' : r.couleur};
          background:${r.mort ? 'rgba(30,30,50,.4)' : r.couleur + '22'};
          display:flex;align-items:center;justify-content:center;font-size:.65rem;
          ${i === combat.robotIndex && !r.mort ? 'box-shadow:0 0 6px ' + r.couleur + ';' : ''}
          opacity:${r.mort ? 0.3 : 1};
        ">${r.mort ? '☠️' : i === combat.robotIndex ? '▶' : '🤖'}</div>
      `).join('')}
    </div>
  `;
}

function rendreEquipe() {
  const el = document.getElementById('cb-team');
  if (!el) return;
  const actif = brawlerActifCourant(combat);
  el.innerHTML = combat.brawlers.map((b, i) => {
    const estActif = !b.mort && !!actif && actif.index === i;
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
        <div style="position:relative;display:inline-block">
          <img src="${b.brawler.img}" alt="${b.brawler.nom}"
            style="width:60px;height:60px;object-fit:contain;opacity:${b.mort ? 0.3 : 1};
              ${b.mort ? 'filter:grayscale(1)' : ''}"
            onerror="this.style.display='none'">
          ${!b.mort ? `<div style="position:absolute;top:-6px;right:-6px;line-height:0">${roleIcon(b.brawler.role,'22px')}</div>` : ''}
        </div>
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
  const r = robotActuel(combat);
  if (!r) return;
  const pct      = Math.max(0, Math.round((r.hp / r.hpMax) * 100));
  const barColor = pct > 50 ? '#22c55e' : pct > 20 ? '#f59e0b' : '#ef4444';
  const vivants  = combat.vague.filter(v => !v.mort);
  const restants = vivants.length - 1; // hors celui en cours

  el.innerHTML = `
    <div style="font-size:.65rem;font-weight:900;text-transform:uppercase;color:${r.couleur};letter-spacing:.1em;margin-bottom:.3rem">
      ⚔️ Adversaire
    </div>
    <div style="position:relative;display:inline-block">
      <img src="./images/${r.image}" alt="${r.nom}" id="cb-robot-img"
        style="width:80px;height:80px;object-fit:contain"
        onerror="this.style.display='none'">
      <div style="position:absolute;top:-6px;right:-6px;line-height:0">${roleIcon(r.role,'22px')}</div>
    </div>
    <div style="font-weight:900;color:${r.couleur};font-size:.85rem;margin-top:.3rem">${r.nom}</div>
    <div style="font-size:.65rem;color:var(--text-muted);margin-bottom:.25rem">${r.desc}</div>
    ${restants > 0 ? `<div style="font-size:.6rem;color:#f59e0b;margin-bottom:.2rem">+${restants} robot${restants > 1 ? 's' : ''} en attente</div>` : ''}
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
    const w    = combat.victoire;
    const farm = combat.isFarm;
    el.innerHTML = `
      <div style="text-align:center;padding:.5rem 0">
        <div style="font-size:1.8rem">${w ? (farm ? '🔄' : '🏆') : '💀'}</div>
        <div style="font-weight:900;font-size:1rem;color:${w ? (farm ? '#fbbf24' : '#22c55e') : '#ef4444'};margin:.2rem 0">
          ${w ? (farm ? `Farm L${((combat.level-1)%15)+1} réussi !` : `Level ${((combat.level - 1) % 15) + 1} terminé !`) : 'Défaite…'}
        </div>
        ${w ? `
          <div style="font-size:.8rem;color:#fbbf24;margin-bottom:.3rem">
            +${combat.gainPieces} 💰 &nbsp; +${combat.gainGemmes}${gemmeImg('w-3 h-3 inline-block')} &nbsp; +${combat.gainXP} XP &nbsp; +${combat.gainPP} ⚡PP
            ${farm ? '<span style="color:#94a3b8;font-size:.65rem"> (×0.3)</span>' : ''}
          </div>
          ${!farm ? `<div style="font-size:.7rem;color:#a855f7;margin-bottom:.5rem">
            ➡️ Prochain : Level ${((combat.level) % 15) + 1}/15
          </div>` : ''}
        ` : `
          <div style="font-size:.75rem;color:var(--text-muted);margin-bottom:.5rem">
            Ton équipe a été mise hors de combat.
          </div>
        `}
        <button onclick="nouveauCombat()" style="
          background:${farm ? 'linear-gradient(135deg,#92400e,#f59e0b)' : 'linear-gradient(135deg,#7c3aed,#a855f7)'};border:none;border-radius:12px;
          color:#fff;font-weight:900;font-size:.85rem;padding:.7rem 1.6rem;cursor:pointer;
          box-shadow:0 0 16px ${farm ? 'rgba(245,158,11,.4)' : 'rgba(168,85,247,.4)'}">
          ${w ? (farm ? '🔄 Refarm' : '⚔️ Level suivant') : '⚔️ Réessayer'}
        </button>
      </div>
    `;
    return;
  }

  const actif      = brawlerActifCourant(combat);
  const bActif     = actif ? actif.brawler : null;
  const bloque     = combat.en_cours || !bActif;
  const estSoutien = bActif && bActif.brawler.role === 'soutien';

  el.innerHTML = `
    <div style="font-size:.7rem;color:var(--text-muted);text-align:center;margin-bottom:.2rem">
      Tour ${combat.tour} —
      ${bActif ? `<span style="color:${couleurVarianteLocal(bActif.brawler, bActif.variante)};font-weight:800">${bActif.brawler.nom}</span> agit` : ''}
      ${combat.fureurStacks > 0 ? `<span style="color:#f59e0b;font-weight:800;margin-left:.4rem">🔥 Fureur +${combat.fureurStacks * 10}%</span>` : ''}
    </div>
    <div style="font-size:.6rem;color:var(--text-muted);text-align:center;margin-bottom:.4rem">
      💥 Burst ▸ 🛡️ Tank ▸ 🎯 Poke ▸ 💥 Burst &nbsp;·&nbsp; 💚 Soutien soigne l'équipe
    </div>
    <div style="display:flex;gap:.5rem;flex-wrap:wrap;justify-content:center">
      <button class="cb-btn cb-btn-atk" onclick="actionCombat('attaque')" ${bloque ? 'disabled' : ''}>
        ⚔️ Attaque
      </button>
      <button class="cb-btn cb-btn-spe" onclick="actionCombat('speciale')"
        ${bloque || (bActif && !bActif.special) ? 'disabled' : ''}
        style="${bActif && !bActif.special ? 'opacity:.35' : ''}">
        ${estSoutien ? '💚 Soin' : '✦ Spéciale'}${bActif && !bActif.special ? ' (utilisée)' : ''}
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
  const actif = brawlerActifCourant(combat);
  if (!actif) return;

  combat.en_cours = true;
  rendreActions();

  const bActif = actif.brawler;
  const vivants = brawlerVivant(combat); // utilisé plus bas pour le soin du Soutien
  const robot  = robotActuel(combat);
  if (!robot) { combat.en_cours = false; return; }

  /* ── Résilience : soin passif si HP < 30% ── */
  if (typeof hasResilienceBrawler === 'function' && hasResilienceBrawler(bActif.brawler.id, bActif.variante)) {
    if (bActif.hp < bActif.hpMax * 0.30) {
      const soinRes = Math.round(bActif.hpMax * 0.10);
      bActif.hp = Math.min(bActif.hpMax, bActif.hp + soinRes);
      logCombat(`🌿 <b style="color:#22c55e">Résilience</b> soigne ${bActif.brawler.nom} de <b>+${soinRes} HP</b>`, 'cb-log-soin');
    }
  }

  const role = bActif.brawler.role;
  let degatJoueur = 0, msgJoueur = '', estSoin = false;

  if (action === 'attaque') {
    const mult       = multiplicateurRole(role, robot.role);
    const fureurMult = (typeof hasFureurBrawler === 'function' && hasFureurBrawler(bActif.brawler.id, bActif.variante)) ? (1 + combat.fureurStacks * 0.10) : 1;
    degatJoueur = Math.round(bActif.atk * (0.85 + Math.random() * 0.3) * mult * fureurMult);
    msgJoueur   = `⚔️ <b style="color:${couleurVarianteLocal(bActif.brawler, bActif.variante)}">${bActif.brawler.nom}</b> attaque${suffixeAvantage(mult)} : <b style="color:#ef4444">-${degatJoueur} HP</b>`;
    Sound.roll && Sound.roll();

  } else if (action === 'speciale') {
    if (!bActif.special) { combat.en_cours = false; return; }
    bActif.special = false;
    if (role === 'soutien') {
      estSoin = true;
      const soin = Math.round(bActif.atk * 1.8);
      vivants.forEach(b => { b.hp = Math.min(b.hpMax, b.hp + soin); });
      msgJoueur = `💚 <b style="color:#22c55e">${bActif.brawler.nom} SOUTIEN</b> : équipe soignée de <b style="color:#22c55e">+${soin} HP</b> !`;
      Sound.golden && Sound.golden();
    } else {
      const mult            = multiplicateurRole(role, robot.role);
      const specialMultBonus = typeof bonusSpecialBrawler === 'function' ? bonusSpecialBrawler(bActif.brawler.id, bActif.variante) : 0;
      degatJoueur = Math.round(bActif.atk * (2.5 + specialMultBonus) * (0.9 + Math.random() * 0.2) * mult);
      msgJoueur   = `✦ <b style="color:#a855f7">${bActif.brawler.nom} SPÉCIALE</b>${suffixeAvantage(mult)} : <b style="color:#ef4444">-${degatJoueur} HP !</b>`;
      Sound.golden && Sound.golden();
    }

  } else if (action === 'defense') {
    bActif.bouclier = true;
    const mult        = multiplicateurRole(role, robot.role);
    const riposteBase = typeof bonusRiposteBrawler === 'function' ? 0.5 + bonusRiposteBrawler(bActif.brawler.id, bActif.variante) : 0.5;
    degatJoueur = Math.round(bActif.atk * riposteBase * (0.8 + Math.random() * 0.4) * mult);
    msgJoueur   = `🛡️ <b style="color:#38bdf8">${bActif.brawler.nom}</b> se défend et riposte${suffixeAvantage(mult)} : <b style="color:#ef4444">-${degatJoueur} HP</b>`;
  }

  robot.hp -= degatJoueur;
  logCombat(msgJoueur, estSoin ? 'cb-log-soin' : 'cb-log-joueur');
  if (estSoin) rendreEquipe();
  if (!estSoin) flashElement('cb-robot-img', '#ef4444');
  rendreRobot();
  rendreLevelBar();

  await attendre(500);

  /* ── Robot actuel vaincu ? ── */
  if (robot.hp <= 0) {
    robot.hp   = 0;
    robot.mort = true;
    logCombat(`💥 <b style="color:#22c55e">${robot.nom} éliminé !</b>`, 'cb-log-victoire');
    Sound.golden && Sound.golden();

    /* Cherche le prochain robot vivant */
    const prochainIdx = combat.vague.findIndex((r, i) => i > combat.robotIndex && !r.mort);

    if (prochainIdx !== -1) {
      /* Il reste des robots dans la vague */
      combat.robotIndex = prochainIdx;
      logCombat(`➡️ <b style="color:#f59e0b">${combat.vague[prochainIdx].nom}</b> entre en jeu !`, '');
      rendreRobot();
      rendreLevelBar();
      await attendre(600);

    } else {
      /* Toute la vague est vaincue → victoire du level */

      // FIX succès "Exterminateur" : l'ancien code appelait
      // checkAchievementsVictoire('level') — une chaîne littérale, jamais
      // un vrai id de robot — donc etat.robotsBattus['robot']/['boxer']/
      // ['sniper']/['big_robot'] n'étaient jamais renseignés et le succès
      // était strictement impossible à débloquer. On enregistre ici
      // chaque TYPE de robot réellement présent dans la vague vaincue
      // (farm inclus : les robots sont bel et bien battus dans ce mode aussi).
      if (typeof checkAchievementsVictoire === 'function') {
        const typesVaincus = [...new Set(combat.vague.map(r => r.id))];
        typesVaincus.forEach(t => checkAchievementsVictoire(t));
      }

      if (combat.isFarm) {
        /* Mode farm : pas de progression, 1 PP fixe, récompenses réduites */
        combat.gainPP = 1;
        etat.pieces  += combat.gainPieces;
        etat.gemmes   = (etat.gemmes || 0) + combat.gainGemmes;
        combat.brawlers.forEach(b => {
          const k = cle(b.brawler.id, b.variante);
          if (!etat.brawlerPP) etat.brawlerPP = {};
          etat.brawlerPP[k] = (etat.brawlerPP[k] || 0) + combat.gainPP;
        });
        if (typeof gagnerXP === 'function') gagnerXP(combat.gainXP);
        if (typeof mettreAJourCompteurs === 'function') mettreAJourCompteurs();
        if (typeof sauvegarderEtatCloud  === 'function') sauvegarderEtatCloud();
        logCombat(`🔄 <b style="color:#fbbf24">Farm terminé ! (×0.3 récomp.)</b>`, 'cb-log-victoire');
      } else {
        /* Mode normal : progression */
        const winsApres = (etat.combatsGagnes || 0) + 1;
        combat.gainPP   = 1 + (winsApres % 5 === 0 ? 2 : 0);
        etat.pieces        += combat.gainPieces;
        etat.gemmes         = (etat.gemmes || 0) + combat.gainGemmes;
        etat.combatsGagnes  = winsApres;
        combat.brawlers.forEach(b => {
          const k = cle(b.brawler.id, b.variante);
          if (!etat.brawlerPP) etat.brawlerPP = {};
          etat.brawlerPP[k] = (etat.brawlerPP[k] || 0) + combat.gainPP;
        });
        if (typeof gagnerXP === 'function') gagnerXP(combat.gainXP);
        if (typeof mettreAJourCompteurs === 'function') mettreAJourCompteurs();
        if (typeof sauvegarderEtatCloud  === 'function') sauvegarderEtatCloud();
        logCombat(`🏆 <b style="color:#22c55e">Level ${((combat.level - 1) % 15) + 1} terminé !</b>`, 'cb-log-victoire');
      }
      combat.victoire  = true;
      combat.phase     = 'fin';
      combat.en_cours  = false;
      rendreRobot();
      rendreLevelBar();
      rendreActions();
      return;
    }
  }

  /* ── Contre-attaque du robot ── */
  await attendre(300);

  const bouclierBonus   = typeof bonusBouclierBrawler === 'function' ? bonusBouclierBrawler(bActif.brawler.id, bActif.variante) : 0;
  const reductionBouclier = bActif.bouclier ? Math.max(0.1, 0.4 - bouclierBonus) : 1;
  const multDef  = multiplicateurRole(robot.role, role);
  const degatRobot = Math.round(robot.atk * (0.8 + Math.random() * 0.4) * reductionBouclier * multDef);
  bActif.bouclier = false;

  const cibleMsg = reductionBouclier < 1
    ? `🛡️ ${bActif.brawler.nom} bloque ! <b style="color:#f59e0b">-${degatRobot} HP</b> (réduit)`
    : `🤖 ${robot.nom} contre-attaque${suffixeAvantage(multDef)} <b style="color:#38bdf8">${bActif.brawler.nom}</b> : <b style="color:#f59e0b">-${degatRobot} HP</b>`;

  bActif.hp -= degatRobot;
  logCombat(cibleMsg, 'cb-log-robot');
  flashElement(`cb-br-${actif.index}`, '#f59e0b');

  if (bActif.hp <= 0) {
    bActif.hp = 0; bActif.mort = true;
    logCombat(`☠️ <b style="color:#ef4444">${bActif.brawler.nom} est KO !</b>`, 'cb-log-ko');
    Sound.error && Sound.error();
  }

  /* ── Fureur ── */
  if (typeof hasFureurBrawler === 'function' && hasFureurBrawler(bActif.brawler.id, bActif.variante) && !bActif.mort) {
    combat.fureurStacks++;
    if (combat.fureurStacks <= 5)
      logCombat(`🔥 <b style="color:#f59e0b">Fureur</b> +${combat.fureurStacks * 10}% ATK`, '');
  }

  combat.actifIndex = (actif.index + 1) % combat.brawlers.length;
  combat.tour++;

  /* ── Défaite ── */
  if (brawlerVivant(combat).length === 0) {
    logCombat(`💀 <b style="color:#ef4444">Défaite… Tous les brawlers sont KO.</b>`, 'cb-log-ko');
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
function attendre(ms) { return new Promise(res => setTimeout(res, ms)); }

function flashElement(id, color) {
  const el = document.getElementById(id);
  if (!el) return;
  el.style.transition = 'filter .1s';
  el.style.filter = `drop-shadow(0 0 10px ${color}) brightness(1.5)`;
  setTimeout(() => { el.style.filter = ''; }, 300);
}

function lancerCombat() { actionCombat('attaque'); }
