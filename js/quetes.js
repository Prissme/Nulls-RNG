/* ════════════════════════════════════════════════
   quetes.js — Quêtes normales (5 min) + Quêtes difficiles (24h)
════════════════════════════════════════════════ */

const QUETE_REFRESH_MS      = 5 * 60 * 1000;
const QUETE_DIFF_REFRESH_MS = 24 * 60 * 60 * 1000;

function randOf(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

/* ── Templates normaux (inchangés) ── */
const QUETE_TEMPLATES = [
  { type:'rolls',   id:'r1', label: n => `Effectuer ${n} rolls`,             cible: () => randOf([5,10,20,50]),  reward: n => n * 3,   icone:'🎲' },
  { type:'rolls',   id:'r2', label: n => `Faire ${n} rolls d'affilée`,       cible: () => randOf([15,30,50]),    reward: n => n * 4,   icone:'⚡' },
  { type:'potions', id:'p1', label: n => `Boire ${n} potion(s)`,             cible: () => randOf([1,2,3]),       reward: n => n * 60,  icone:'🧪' },
  { type:'potions', id:'p2', label: n => `Acheter ${n} potions de chance`,   cible: () => randOf([1,2]),         reward: n => n * 80,  icone:'✨' },
  { type:'craft',   id:'c1', label: n => `Crafter ${n} Shiny`,               cible: () => randOf([1,2,3]),       reward: n => n * 120, icone:'✦'  },
  { type:'craft',   id:'c2', label: n => `Crafter ${n} Golden`,              cible: () => randOf([1,2]),         reward: n => n * 400, icone:'★'  },
  { type:'craft',   id:'c3', label: n => `Crafter ${n} Rainbow`,             cible: () => 1,                     reward: () => 1200,   icone:'🌈' },
  { type:'pack',    id:'b1', label: (n, b) => `Obtenir ${n} ${b.nom}`,       cible: () => randOf([1,2,3]),
    reward: (n, b) => Math.round(n * b.div * 2), icone: null },
  { type:'variante',id:'v1', label: (n, v) => `Obtenir ${n} brawler(s) ${v}`,
    cible: () => randOf([1,2,3]),
    reward: (n, v) => n * ({ shiny:50, golden:150, rainbow:500 }[v] || 20), icone:'🌟' },
  { type:'cps',     id:'cps1', label: () => `Atteindre 20 💰/s`,             cible: () => 20,  reward: () => 200,  icone:'💰' },
  { type:'cps',     id:'cps2', label: () => `Atteindre 50 💰/s`,             cible: () => 50,  reward: () => 600,  icone:'💰' },
];

/* ── Templates difficiles (journaliers) ── */
const QUETE_DIFF_TEMPLATES = [
  // Rolls massifs
  { type:'rolls',    id:'dr1', label: n => `Effectuer ${n} rolls aujourd'hui`,
    cible: () => randOf([500, 1000, 2000]),   reward: n => n * 12,     icone:'🎲' },
  { type:'rolls',    id:'dr2', label: n => `Enchaîner ${n} rolls sans pause`,
    cible: () => randOf([200, 500]),          reward: n => n * 18,     icone:'⚡' },
  // Craft rare
  { type:'craft',    id:'dc1', label: n => `Crafter ${n} Rainbow en une journée`,
    cible: () => randOf([3, 5, 8]),           reward: n => n * 3000,   icone:'🌈' },
  { type:'craft',    id:'dc2', label: n => `Crafter ${n} Monochrome`,
    cible: () => randOf([1, 2]),              reward: n => n * 15000,  icone:'◐'  },
  // Brawlers épiques spécifiques
  { type:'pack',     id:'db1', label: (n, b) => `Obtenir ${n} ${b.nom} aujourd'hui`,
    cible: () => randOf([3, 5, 10]),
    reward: (n, b) => Math.round(n * b.div * 8), icone: null },
  // Variantes
  { type:'variante', id:'dv1', label: (n, v) => `Obtenir ${n} brawler(s) ${v} aujourd'hui`,
    cible: () => randOf([3, 5, 8]),
    reward: (n, v) => n * ({ shiny:200, golden:800, rainbow:3000, monochrome:20000 }[v] || 100), icone:'🌟' },
  { type:'variante', id:'dv2', label: n => `Obtenir ${n} brawler(s) Monochrome`,
    cible: () => randOf([1, 2, 3]),
    reward: n => n * 25000, icone:'◐' },
  // CPS
  { type:'cps',      id:'dcps1', label: () => `Atteindre 200 💰/s`,
    cible: () => 200,                        reward: () => 8000,       icone:'💰' },
  { type:'cps',      id:'dcps2', label: () => `Atteindre 500 💰/s`,
    cible: () => 500,                        reward: () => 25000,      icone:'💰' },
  // Potions enchaînées
  { type:'potions',  id:'dp1', label: n => `Boire ${n} potions aujourd'hui`,
    cible: () => randOf([8, 15, 25]),        reward: n => n * 500,     icone:'🧪' },
  // Rolls sous potion
  { type:'rollsShiny', id:'drs1', label: n => `Effectuer ${n} rolls avec la potion Shiny active`,
    cible: () => randOf([100, 250, 500]),    reward: n => n * 20,      icone:'✦'  },
  { type:'rollsGolden', id:'drg1', label: n => `Effectuer ${n} rolls avec la potion Golden active`,
    cible: () => randOf([50, 100, 200]),     reward: n => n * 45,      icone:'★'  },
];

/* ── Génération ── */
function _genererPool(templates, count) {
  const shuffled = [...templates].sort(() => Math.random() - .5);
  const choisies = shuffled.slice(0, count);
  const now      = Date.now();

  return choisies.map((tpl, i) => {
    const epicBrawlers = BRAWLERS.filter(b => b.rarity === 'epic');
    const brawler   = tpl.id === 'db1'
      ? epicBrawlers[Math.floor(Math.random() * epicBrawlers.length)]
      : BRAWLERS[Math.floor(Math.random() * BRAWLERS.length)];
    const varianteQ = tpl.id === 'dv2'
      ? 'monochrome'
      : randOf(['shiny','golden','rainbow','monochrome']);
    const cible  = tpl.cible(brawler);
    const reward = tpl.reward(cible, tpl.type === 'pack' ? brawler : varianteQ);

    return {
      uid:        `${now}_${i}_${tpl.id}`,
      type:       tpl.type,
      templateId: tpl.id,
      label:      tpl.type === 'pack'
                    ? tpl.label(cible, brawler)
                    : (tpl.type === 'variante' || tpl.id === 'dv2')
                      ? tpl.label(cible, varianteQ)
                      : tpl.label(cible),
      icone:      tpl.type === 'pack' ? brawler.emoji : tpl.icone,
      cible,
      progres:    0,
      reward,
      complete:   false,
      reclamee:   false,
      brawlerId:  tpl.type === 'pack' ? brawler.id : null,
      variante:   (tpl.type === 'variante' || tpl.id === 'dv2') ? varianteQ : null,
      cpsCible:   tpl.type === 'cps' ? cible : null,
    };
  });
}

function genererQuetes()     { return _genererPool(QUETE_TEMPLATES,      4); }
function genererQuetesDiff() { return _genererPool(QUETE_DIFF_TEMPLATES, 3); }

/* ── Init / refresh ── */
function initialiserQuetes() {
  const now = Date.now();

  // Quêtes normales : toujours refresh
  etat.quetes           = genererQuetes();
  etat.quetesRefreshFin = now + QUETE_REFRESH_MS;

  // Quêtes difficiles : ne refresh que si expirées (ou première fois)
  if (!etat.quetesDiff || !etat.quetesDiff.length || now >= etat.quetesDiffRefreshFin) {
    etat.quetesDiff           = genererQuetesDiff();
    etat.quetesDiffRefreshFin = now + QUETE_DIFF_REFRESH_MS;
  }

  afficherQuetes();
  demarrerTimerQuetes();
}

function demarrerTimerQuetes() {
  clearInterval(etat.quetesInterval);
  etat.quetesInterval = setInterval(() => {
    const restant = Math.max(0, etat.quetesRefreshFin - Date.now());
    afficherTimerQuetes(restant);
    if (restant <= 0) initialiserQuetes();

    // Refresh daily si expiré en cours de session
    const now = Date.now();
    if (etat.quetesDiff && etat.quetesDiff.length && now >= etat.quetesDiffRefreshFin) {
      etat.quetesDiff           = genererQuetesDiff();
      etat.quetesDiffRefreshFin = now + QUETE_DIFF_REFRESH_MS;
      afficherQuetes();
    }

    // Met à jour le timer journalier dans l'UI
    const restantDiff = Math.max(0, etat.quetesDiffRefreshFin - now);
    afficherTimerQuetesDiff(restantDiff);
  }, 1000);
}

function afficherTimerQuetes(restant) {
  const el = document.getElementById('quetesTimer');
  if (!el) return;
  const m = Math.floor(restant / 60000);
  const s = Math.floor((restant % 60000) / 1000);
  el.textContent = `🔄 Refresh dans ${m}:${String(s).padStart(2,'0')}`;
}

function afficherTimerQuetesDiff(restant) {
  const el = document.getElementById('quetesDiffTimer');
  if (!el) return;
  const h = Math.floor(restant / 3600000);
  const m = Math.floor((restant % 3600000) / 60000);
  const s = Math.floor((restant % 60000) / 1000);
  el.textContent = `🔄 ${h}h ${String(m).padStart(2,'0')}min ${String(s).padStart(2,'0')}s`;
}

/* ── Progression ── */
function progresserQuete(type, data = {}) {
  let changed = false;

  const allQuetes = [...(etat.quetes || []), ...(etat.quetesDiff || [])];

  for (const q of allQuetes) {
    if (q.complete || q.reclamee) continue;
    let gain = 0;

    if ((type === 'roll') && (q.type === 'rolls'))   gain = 1;
    if (type === 'roll' && q.type === 'pack'     && data.brawlerId === q.brawlerId) gain = 1;
    if (type === 'roll' && q.type === 'variante' && data.variante  === q.variante)  gain = 1;
    if (type === 'potion'     && q.type === 'potions')   gain = 1;
    if (type === 'potionLuck' && q.templateId === 'p2')  gain = 1;
    if (type === 'craft' && q.type === 'craft') {
      const map = { shiny:'c1', golden:'c2', rainbow:'c3', monochrome:'dc2' };
      if (map[data.variante] === q.templateId) gain = 1;
    }
    // Rolls sous potion active
    if (type === 'roll' && q.type === 'rollsShiny'  && etat.shinyActive)  gain = 1;
    if (type === 'roll' && q.type === 'rollsGolden' && etat.goldenActive) gain = 1;

    if (type === 'cps' && q.type === 'cps') {
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

/* ── Réclamer ── */
function reclamerQuete(uid) {
  const allQuetes = [...(etat.quetes || []), ...(etat.quetesDiff || [])];
  const q = allQuetes.find(q => q.uid === uid);
  if (!q || !q.complete || q.reclamee) return;

  q.reclamee = true;
  gagnerXP(q.reward);

  const notif = document.createElement('div');
  const isDiff = etat.quetesDiff && etat.quetesDiff.some(qd => qd.uid === uid);
  notif.style.cssText = `position:fixed;top:80px;left:50%;transform:translateX(-50%);
    background:var(--bg-card);border:1px solid ${isDiff ? '#f97316' : '#fbbf24'};
    color:${isDiff ? '#f97316' : '#fbbf24'};
    font-weight:900;font-size:.9rem;padding:.6rem 1.4rem;border-radius:12px;
    z-index:999;box-shadow:0 0 20px ${isDiff ? '#f9731655' : '#fbbf2455'};
    animation:craftIn .4s cubic-bezier(.22,.68,0,1.2) forwards`;
  notif.textContent = `${isDiff ? '🔥' : '🎉'} +${q.reward.toLocaleString('fr-FR')} XP !`;
  document.body.appendChild(notif);
  setTimeout(() => notif.remove(), 2500);

  afficherQuetes();
  sauvegarderEtatCloud();
}

/* ── Rendu d'une carte de quête ── */
function _renderCarteQuete(q, isDiff) {
  const pct     = Math.min(100, (q.progres / q.cible) * 100);
  const done    = q.complete;
  const claimed = q.reclamee;

  const accentColor = isDiff ? '#f97316' : '#fbbf24';
  const barColor    = done ? accentColor : (isDiff ? '#ea580c' : '#7c3aed');

  return `
    <div style="padding:.6rem .75rem;border-radius:10px;margin-bottom:.4rem;
      background:${done && !claimed ? `rgba(${isDiff ? '249,115,22' : '251,191,36'},.08)` : claimed ? 'rgba(255,255,255,.03)' : 'var(--bg-panel)'};
      border:1px solid ${done && !claimed ? `${accentColor}66` : 'var(--border)'};
      opacity:${claimed ? '.5' : '1'};">
      <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:.5rem">
        <div style="flex:1;min-width:0">
          <div style="display:flex;align-items:center;gap:.4rem;margin-bottom:.3rem">
            <span style="font-size:1rem">${q.icone}</span>
            <span style="font-size:.75rem;font-weight:700;color:${claimed ? 'var(--text-muted)' : '#e2e8f0'};
              text-decoration:${claimed ? 'line-through' : 'none'}">${q.label}</span>
          </div>
          <div style="height:4px;background:var(--border);border-radius:2px;overflow:hidden;margin-bottom:.25rem">
            <div style="height:100%;width:${pct}%;background:${barColor};
              border-radius:2px;transition:width .3s"></div>
          </div>
          <div style="font-size:.65rem;color:var(--text-muted)">
            ${q.type === 'cps' ? `${q.progres}/${q.cible} 💰/s` : `${q.progres}/${q.cible}`}
            <span style="color:${accentColor};margin-left:.4rem;font-weight:800">+${q.reward.toLocaleString('fr-FR')} XP</span>
          </div>
        </div>
        ${done && !claimed
          ? `<button onclick="reclamerQuete('${q.uid}')"
              style="flex-shrink:0;padding:.3rem .65rem;border-radius:8px;font-size:.7rem;
                font-weight:800;border:1px solid ${accentColor};background:rgba(${isDiff ? '249,115,22' : '251,191,36'},.2);
                color:${accentColor};cursor:pointer">Réclamer</button>`
          : claimed
            ? `<span style="font-size:.7rem;color:var(--text-muted);flex-shrink:0">✓ Réclamée</span>`
            : `<span style="font-size:.7rem;color:var(--text-muted);flex-shrink:0;white-space:nowrap">${Math.round(pct)}%</span>`
        }
      </div>
    </div>`;
}

/* ── Rendu panneau ── */
function afficherQuetes() {
  const container = document.getElementById('quetesList');
  if (!container) return;

  let html = '';

  // Section quêtes normales
  html += `<div style="font-size:.65rem;font-weight:900;text-transform:uppercase;letter-spacing:.08em;
    color:var(--text-muted);margin-bottom:.4rem">Quêtes du moment</div>`;
  for (const q of (etat.quetes || [])) {
    html += _renderCarteQuete(q, false);
  }

  // Section quêtes difficiles
  html += `<div style="display:flex;align-items:center;justify-content:space-between;
    margin-top:.9rem;margin-bottom:.4rem">
    <div style="font-size:.65rem;font-weight:900;text-transform:uppercase;letter-spacing:.08em;
      color:#f97316">🔥 Défis Journaliers</div>
    <span id="quetesDiffTimer" style="font-family:var(--font-mono);font-size:.6rem;
      font-weight:700;color:var(--text-muted)"></span>
  </div>`;
  for (const q of (etat.quetesDiff || [])) {
    html += _renderCarteQuete(q, true);
  }

  container.innerHTML = html;

  // Injecter le timer journalier maintenant que le DOM est prêt
  const restantDiff = Math.max(0, (etat.quetesDiffRefreshFin || 0) - Date.now());
  afficherTimerQuetesDiff(restantDiff);
}
