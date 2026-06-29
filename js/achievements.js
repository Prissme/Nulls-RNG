/* ════════════════════════════════════════════════
   achievements.js — Système de succès permanents
════════════════════════════════════════════════ */

/* ── Définitions des succès ── */
const ACHIEVEMENTS_DEF = [
  {
    id: 'shelly_streak_10',
    icone: '🔫',
    nom: 'Lucky Shelly',
    desc: 'Obtenir 20 Shelly d\'affilée',
    couleur: '#94a3b8',
    rewardXP: 500,
  },
  {
    id: 'index_complet',
    icone: '📖',
    nom: 'Collectionneur Ultime',
    desc: 'Obtenir au moins 1 exemplaire de chaque brawler (toutes variantes)',
    couleur: '#e879f9',
    rewardXP: 2000,
  },
  {
    id: 'all_robots_beaten',
    icone: '🤖',
    nom: 'Exterminateur',
    desc: 'Battre chaque type de robot au moins une fois',
    couleur: '#f97316',
    rewardXP: 800,
  },
  {
    id: 'all_cristaux_max',
    icone: '🔮',
    nom: 'Maître des Cristaux',
    desc: 'Maxer toutes les améliorations de cristaux',
    couleur: '#a855f7',
    rewardXP: 3000,
  },
  {
    id: 'naell_vaincu',
    icone: '⌨️',
    nom: 'Plus Rapide que Naell',
    desc: 'Vaincre Naell',
    couleur: '#e879f9',
    rewardXP: 1500,
  },
];

/* ── État des succès (initialisé dans etat via state.js) ── */
// etat.achievements = { [id]: { debloque: bool, reclamee: bool, progres: any } }

function initAchievements() {
  if (!etat.achievements) etat.achievements = {};
  for (const def of ACHIEVEMENTS_DEF) {
    // Ne pas écraser un achievement déjà chargé depuis le cloud save
    if (!etat.achievements[def.id]) {
      etat.achievements[def.id] = { debloque: false, reclamee: false };
    }
  }
  if (typeof etat.shellyStreak === 'undefined') etat.shellyStreak = 0;
  if (!etat.robotsBattus) etat.robotsBattus = {};
}

/* ── Débloquer un succès ── */
function debloquerAchievement(id) {
  const ach = etat.achievements[id];
  if (!ach || ach.debloque) return;
  ach.debloque = true;

  const def = ACHIEVEMENTS_DEF.find(d => d.id === id);
  if (!def) return;

  // Notification visuelle
  const notif = document.createElement('div');
  notif.style.cssText = `
    position:fixed;bottom:80px;left:50%;transform:translateX(-50%) translateY(20px);
    background:rgba(10,10,20,.97);border:1px solid ${def.couleur}88;
    border-radius:14px;padding:.65rem 1.2rem;z-index:9999;
    box-shadow:0 0 24px ${def.couleur}44;
    animation:achieveIn .45s cubic-bezier(.22,.68,0,1.2) forwards;
    display:flex;align-items:center;gap:.65rem;min-width:240px;max-width:320px;
  `;
  notif.innerHTML = `
    <span style="font-size:1.6rem">${def.icone}</span>
    <div>
      <div style="font-size:.65rem;font-weight:800;color:${def.couleur};letter-spacing:.08em;text-transform:uppercase">
        🏆 Succès débloqué !
      </div>
      <div style="font-size:.82rem;font-weight:800;color:#e2e8f0;margin-top:.1rem">${def.nom}</div>
      <div style="font-size:.65rem;color:var(--text-muted);margin-top:.05rem">${def.desc}</div>
    </div>
  `;
  document.body.appendChild(notif);
  setTimeout(() => {
    notif.style.animation = 'achieveOut .35s ease-in forwards';
    setTimeout(() => notif.remove(), 380);
  }, 4000);

  // XP immédiat si pas de claim nécessaire
  if (typeof gagnerXP === 'function') gagnerXP(def.rewardXP);

  if (typeof afficherAchievements === 'function') afficherAchievements();
  if (typeof sauvegarderEtatCloud === 'function') sauvegarderEtatCloud();
}

/* ── Vérifications déclenchées à chaque événement ── */

/* Appelé après chaque roll */
function checkAchievementsRoll(brawlerId, variante) {
  initAchievements();

  // Shelly streak
  if (brawlerId === 1 && variante === 'normal') {
    etat.shellyStreak = (etat.shellyStreak || 0) + 1;
  } else {
    etat.shellyStreak = 0;
  }
  if (etat.shellyStreak >= 20) {
    debloquerAchievement('shelly_streak_10');
    etat.shellyStreak = 0; // reset après déclenchement
  }

  // Index complet : tous les brawlers × toutes variantes
  checkIndexComplet();
}

function checkIndexComplet() {
  const variantes = ['normal', 'shiny', 'golden', 'rainbow'];
  const complet = BRAWLERS.every(b =>
    variantes.every(v => (etat.inventaire[cle(b.id, v)] || 0) >= 1)
  );
  if (complet) debloquerAchievement('index_complet');
}

/* Appelé après une victoire en combat */
function checkAchievementsVictoire(robotId) {
  initAchievements();
  if (!etat.robotsBattus) etat.robotsBattus = {};
  etat.robotsBattus[robotId] = true;
  const tousTypes = Object.values(APPARITIONS_ROBOTS).every(r => etat.robotsBattus[r.id]);
  if (tousTypes) debloquerAchievement('all_robots_beaten');
}

/* Appelé après chaque achat de cristaux */
function checkAchievementsCristaux() {
  initAchievements();
  const tousMax = PRESTIGE_UPGRADES.every(up =>
    (etat.prestigeUpgrades[up.id] || 0) >= up.maxNiveau
  );
  if (tousMax) debloquerAchievement('all_cristaux_max');
}

/* ── Rendu du panneau succès ── */
function afficherAchievements() {
  const container = document.getElementById('achievementsList');
  if (!container) return;
  initAchievements();
  container.innerHTML = '';

  for (const def of ACHIEVEMENTS_DEF) {
    const ach     = etat.achievements[def.id] || {};
    const done    = ach.debloque;

    const card = document.createElement('div');
    card.style.cssText = `
      display:flex;align-items:center;gap:.75rem;
      padding:.65rem .85rem;border-radius:12px;
      background:${done ? `rgba(${hexToRgb(def.couleur)},.07)` : 'var(--bg-panel)'};
      border:1px solid ${done ? def.couleur + '55' : 'var(--border)'};
      opacity:${done ? '1' : '.65'};margin-bottom:.5rem;
      transition:all .2s;
    `;

    card.innerHTML = `
      <span style="font-size:1.5rem;filter:${done ? 'none' : 'grayscale(1)'}">${def.icone}</span>
      <div style="flex:1;min-width:0">
        <div style="font-size:.8rem;font-weight:800;color:${done ? def.couleur : 'var(--text-dim)'};margin-bottom:.1rem">
          ${def.nom}
        </div>
        <div style="font-size:.65rem;color:var(--text-muted);line-height:1.4">${def.desc}</div>
        <div style="font-size:.62rem;color:#fbbf24;margin-top:.2rem">+${def.rewardXP} XP</div>
      </div>
      <span style="font-size:1.1rem">${done ? '✅' : '🔒'}</span>
    `;
    container.appendChild(card);
  }
}

/* ── Utilitaire hex → rgb ── */
function hexToRgb(hex) {
  const r = parseInt(hex.slice(1,3),16);
  const g = parseInt(hex.slice(3,5),16);
  const b = parseInt(hex.slice(5,7),16);
  return `${r},${g},${b}`;
}
