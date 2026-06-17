/* ════════════════════════════════════════════════
   quetes.js — Système de quêtes (refresh 5 min)
   Les quêtes ne donnent plus de pièces : elles donnent de l'XP
   pour faire progresser le niveau de compte.
════════════════════════════════════════════════ */

const QUETE_REFRESH_MS = 5 * 60 * 1000; // 5 minutes

/* Templates de quêtes possibles */
const QUETE_TEMPLATES = [
  // Rolls
  { type:'rolls', id:'r1', label: n => `Effectuer ${n} rolls`,         cible: () => randOf([5,10,20,50]),      reward: n => n * 3,        icone:'🎲' },
  { type:'rolls', id:'r2', label: n => `Faire ${n} rolls d'affilée`,   cible: () => randOf([15,30,50]),        reward: n => n * 4,        icone:'⚡' },
  // Potions
  { type:'potions', id:'p1', label: n => `Boire ${n} potion(s)`,       cible: () => randOf([1,2,3]),           reward: n => n * 60,       icone:'🧪' },
  { type:'potions', id:'p2', label: n => `Acheter ${n} potions de chance`, cible: () => randOf([1,2]),         reward: n => n * 80,       icone:'✨' },
  // Craft
  { type:'craft', id:'c1', label: n => `Crafter ${n} Shiny`,           cible: () => randOf([1,2,3]),           reward: n => n * 120,      icone:'✦'  },
  { type:'craft', id:'c2', label: n => `Crafter ${n} Golden`,          cible: () => randOf([1,2]),             reward: n => n * 400,      icone:'★'  },
  { type:'craft', id:'c3', label: n => `Crafter ${n} Rainbow`,         cible: () => 1,                         reward: () => 1200,        icone:'🌈' },
  // Brawlers spécifiques (pack = obtenir)
  { type:'pack', id:'b1', label: (n, b) => `Obtenir ${n} ${b.nom}`,   cible: () => randOf([1,2,3]),
    reward: (n, b) => Math.round(n * b.div * 2),  icone: null /* emoji du brawler */ },
  // Variantes
  { type:'variante', id:'v1', label: (n, v) => `Obtenir ${n} brawler(s) ${v}`,
    cible: () => randOf([1,2,3]),
    reward: (n, v) => n * ({ shiny:50, golden:150, rainbow:500 }[v] || 20), icone:'🌟' },
  // CPS
  { type:'cps', id:'cps1', label: () => `Atteindre 20 💰/s`,           cible: () => 20,                        reward: () => 200,         icone:'💰' },
  { type:'cps', id:'cps2', label: () => `Atteindre 50 💰/s`,           cible: () => 50,                        reward: () => 600,         icone:'💰' },
];

function randOf(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

/* Génère 4 quêtes aléatoires différentes */
function genererQuetes() {
  const shuffled = [...QUETE_TEMPLATES].sort(() => Math.random() - .5);
  const choisies = shuffled.slice(0, 4);
  const now      = Date.now();

  return choisies.map((tpl, i) => {
    const brawler   = BRAWLERS[Math.floor(Math.random() * BRAWLERS.length)];
    const varianteQ = randOf(['shiny','golden','rainbow']);
    const cible     = tpl.cible(brawler);
    const reward    = tpl.reward(cible, tpl.type === 'pack' ? brawler : varianteQ);

    return {
      uid:      `${now}_${i}`,
      type:     tpl.type,
      templateId: tpl.id,
      label:    tpl.type === 'pack'
                  ? tpl.label(cible, brawler)
                  : tpl.type === 'variante'
                    ? tpl.label(cible, varianteQ)
                    : tpl.label(cible),
      icone:    tpl.type === 'pack' ? brawler.emoji : tpl.icone,
      cible,
      progres:  0,
      reward,
      complete: false,
      reclamee: false,
      // données contextuelles
      brawlerId:   tpl.type === 'pack' ? brawler.id : null,
      variante:    tpl.type === 'variante' ? varianteQ : null,
      cpsCible:    (tpl.id === 'cps1' || tpl.id === 'cps2') ? cible : null,
    };
  });
}

/* ── Initialiser / refresh quêtes ── */
function initialiserQuetes() {
  etat.quetes           = genererQuetes();
  etat.quetesRefreshFin = Date.now() + QUETE_REFRESH_MS;
  afficherQuetes();
  demarrerTimerQuetes();
}

function demarrerTimerQuetes() {
  clearInterval(etat.quetesInterval);
  etat.quetesInterval = setInterval(() => {
    const restant = Math.max(0, etat.quetesRefreshFin - Date.now());
    afficherTimerQuetes(restant);
    if (restant <= 0) {
      initialiserQuetes();
    }
  }, 1000);
}

function afficherTimerQuetes(restant) {
  const el = document.getElementById('quetesTimer');
  if (!el) return;
  const m = Math.floor(restant / 60000);
  const s = Math.floor((restant % 60000) / 1000);
  el.textContent = `🔄 Refresh dans ${m}:${String(s).padStart(2,'0')}`;
}

/* ── Progression d'une quête depuis un événement ── */
function progresserQuete(type, data = {}) {
  let changed = false;

  for (const q of etat.quetes) {
    if (q.complete || q.reclamee) continue;

    let gain = 0;

    if (type === 'roll' && q.type === 'rolls') {
      gain = 1;
    }
    if (type === 'roll' && q.type === 'pack' && data.brawlerId === q.brawlerId) {
      gain = 1;
    }
    if (type === 'roll' && q.type === 'variante' && data.variante === q.variante) {
      gain = 1;
    }
    if (type === 'potion' && q.type === 'potions') {
      gain = 1;
    }
    if (type === 'potionLuck' && q.templateId === 'p2') {
      gain = 1;
    }
    if (type === 'craft' && q.type === 'craft') {
      const map = { shiny: 'c1', golden: 'c2', rainbow: 'c3' };
      if (map[data.variante] === q.templateId) gain = 1;
    }
    if (type === 'cps' && q.type === 'cps') {
      // Quête CPS : on check le total actuel
      q.progres = Math.min(q.cible, totalCPS());
      if (q.progres >= q.cible) q.complete = true;
      changed = true;
      continue;
    }

    if (gain > 0) {
      q.progres = Math.min(q.cible, q.progres + gain);
      if (q.progres >= q.cible) q.complete = true;
      changed = true;
    }
  }

  if (changed) afficherQuetes();
}

/* ── Réclamer la récompense ── */
function reclamerQuete(uid) {
  const q = etat.quetes.find(q => q.uid === uid);
  if (!q || !q.complete || q.reclamee) return;

  q.reclamee = true;
  gagnerXP(q.reward);

  // Flash récompense
  const notif = document.createElement('div');
  notif.style.cssText = `position:fixed;top:80px;left:50%;transform:translateX(-50%);
    background:var(--bg-card);border:1px solid #fbbf24;color:#fbbf24;
    font-weight:900;font-size:.9rem;padding:.6rem 1.4rem;border-radius:12px;
    z-index:999;box-shadow:0 0 20px #fbbf2455;
    animation:craftIn .4s cubic-bezier(.22,.68,0,1.2) forwards`;
  notif.textContent = `🎉 +${q.reward} XP !`;
  document.body.appendChild(notif);
  setTimeout(() => notif.remove(), 2000);

  afficherQuetes();
}

/* ── Rendu panneau quêtes ── */
function afficherQuetes() {
  const container = document.getElementById('quetesList');
  if (!container) return;
  container.innerHTML = '';

  for (const q of etat.quetes) {
    const pct     = Math.min(100, (q.progres / q.cible) * 100);
    const done    = q.complete;
    const claimed = q.reclamee;

    const card = document.createElement('div');
    card.style.cssText = `padding:.6rem .75rem;border-radius:10px;
      background:${done && !claimed ? 'rgba(251,191,36,.08)' : claimed ? 'rgba(255,255,255,.03)' : 'var(--bg-panel)'};
      border:1px solid ${done && !claimed ? '#fbbf2466' : claimed ? 'var(--border)' : 'var(--border)'};
      opacity:${claimed ? '.5' : '1'};margin-bottom:.4rem;`;

    card.innerHTML = `
      <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:.5rem">
        <div style="flex:1;min-width:0">
          <div style="display:flex;align-items:center;gap:.4rem;margin-bottom:.3rem">
            <span style="font-size:1rem">${q.icone}</span>
            <span style="font-size:.75rem;font-weight:700;color:${claimed ? 'var(--text-muted)' : '#e2e8f0'};
              text-decoration:${claimed ? 'line-through' : 'none'}">${q.label}</span>
          </div>
          <div style="height:4px;background:var(--border);border-radius:2px;overflow:hidden;margin-bottom:.25rem">
            <div style="height:100%;width:${pct}%;background:${done ? '#fbbf24' : '#7c3aed'};
              border-radius:2px;transition:width .3s"></div>
          </div>
          <div style="font-size:.65rem;color:var(--text-muted)">
            ${q.type === 'cps'
              ? `${q.progres}/${q.cible} 💰/s`
              : `${q.progres}/${q.cible}`}
            <span style="color:#fbbf24;margin-left:.4rem">+${q.reward} XP</span>
          </div>
        </div>
        ${done && !claimed
          ? `<button onclick="reclamerQuete('${q.uid}')"
              style="flex-shrink:0;padding:.3rem .65rem;border-radius:8px;font-size:.7rem;
                font-weight:800;border:1px solid #fbbf24;background:rgba(251,191,36,.2);
                color:#fbbf24;cursor:pointer">Réclamer</button>`
          : claimed
            ? `<span style="font-size:.7rem;color:var(--text-muted);flex-shrink:0">✓ Réclamée</span>`
            : `<span style="font-size:.7rem;color:var(--text-muted);flex-shrink:0;white-space:nowrap">
                ${Math.round(pct)}%</span>`
        }
      </div>
    `;
    container.appendChild(card);
  }
}
