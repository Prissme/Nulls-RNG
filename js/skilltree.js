/* ════════════════════════════════════════════════
   skilltree.js — Arbre de Compétences INDIVIDUEL par Brawler
   Monnaie : Points de Pouvoir (PP), gagnés en combat
   Chaque brawler (id+variante) a ses propres PP et skills.
   On accède au skill tree en cliquant sur un brawler dans l'inventaire.
════════════════════════════════════════════════ */

/* ── Définition des compétences ── */
const SKILL_TREE = [
  /* Rang 1 — toujours accessible */
  {
    id: 'hp1',
    nom: 'Constitution I',
    icone: '❤️',
    desc: '+20% de HP max en combat',
    cout: 2,
    rangee: 1,
    requis: [],
    effet: { hp: 0.20 },
  },
  {
    id: 'atk1',
    nom: 'Force I',
    icone: '⚔️',
    desc: '+20% d\'ATK en combat',
    cout: 2,
    rangee: 1,
    requis: [],
    effet: { atk: 0.20 },
  },
  {
    id: 'special1',
    nom: 'Maîtrise I',
    icone: '✦',
    desc: 'La spéciale inflige ×3 au lieu de ×2.5',
    cout: 3,
    rangee: 1,
    requis: [],
    effet: { specialMult: 0.5 },
  },

  /* Rang 2 — nécessitent 1 compétence de rang 1 */
  {
    id: 'hp2',
    nom: 'Constitution II',
    icone: '💖',
    desc: '+35% de HP max supplémentaires',
    cout: 5,
    rangee: 2,
    requis: ['hp1'],
    effet: { hp: 0.35 },
  },
  {
    id: 'atk2',
    nom: 'Force II',
    icone: '🗡️',
    desc: '+35% d\'ATK supplémentaire',
    cout: 5,
    rangee: 2,
    requis: ['atk1'],
    effet: { atk: 0.35 },
  },
  {
    id: 'bouclier',
    nom: 'Blindage',
    icone: '🛡️',
    desc: 'Défense réduit les dégâts de 60% au lieu de 40%',
    cout: 4,
    rangee: 2,
    requis: ['hp1'],
    effet: { bouclierBonus: 0.20 },
  },
  {
    id: 'riposte',
    nom: 'Riposte',
    icone: '🔄',
    desc: 'Riposte en Défense = 80% ATK au lieu de 50%',
    cout: 4,
    rangee: 2,
    requis: ['atk1'],
    effet: { riposteMult: 0.30 },
  },

  /* Rang 3 — nécessitent 2 compétences de rang 2 */
  {
    id: 'titan',
    nom: 'Titan',
    icone: '🏔️',
    desc: '+50% HP et +50% ATK — ce brawler devient redoutable',
    cout: 10,
    rangee: 3,
    requis: ['hp2', 'atk2'],
    effet: { hp: 0.50, atk: 0.50 },
  },
  {
    id: 'fureur',
    nom: 'Fureur',
    icone: '🔥',
    desc: 'Chaque KO ennemi donne +10% ATK pour ce combat',
    cout: 8,
    rangee: 3,
    requis: ['atk2'],
    effet: { fureur: true },
  },
  {
    id: 'resilience',
    nom: 'Résilience',
    icone: '🌿',
    desc: 'Si HP < 30% : soigne 10% HP max au début du tour',
    cout: 8,
    rangee: 3,
    requis: ['hp2', 'bouclier'],
    effet: { resilience: true },
  },
];

/* ── État de la modale skill tree (brawler actuellement affiché) ── */
let _skillTreeBrawlerId = null;
let _skillTreeVariante  = null;

/* ── Ouvrir le skill tree d'un brawler spécifique ── */
function ouvrirSkillTreeBrawler(brawlerId, variante) {
  _skillTreeBrawlerId = brawlerId;
  _skillTreeVariante  = variante;
  ouvrirModal('modalSkillTree');
  afficherSkillTree();
}

/* ── Getters par brawler ── */
function skillAcheteBrawler(brawlerId, variante, skillId) {
  return brawlerSkillAchete(brawlerId, variante, skillId);
}

function skillDebloqueBrawler(brawlerId, variante, skillId) {
  const sk = SKILL_TREE.find(s => s.id === skillId);
  if (!sk) return false;
  return sk.requis.every(r => skillAcheteBrawler(brawlerId, variante, r));
}

/* ── Bonus HP multiplicateur pour un brawler donné ── */
function bonusHPBrawler(brawlerId, variante) {
  let mult = 1;
  SKILL_TREE.forEach(sk => {
    if (sk.effet.hp && skillAcheteBrawler(brawlerId, variante, sk.id)) mult += sk.effet.hp;
  });
  return mult;
}

function bonusATKBrawler(brawlerId, variante) {
  let mult = 1;
  SKILL_TREE.forEach(sk => {
    if (sk.effet.atk && skillAcheteBrawler(brawlerId, variante, sk.id)) mult += sk.effet.atk;
  });
  return mult;
}

function bonusSpecialBrawler(brawlerId, variante) {
  let extra = 0;
  SKILL_TREE.forEach(sk => {
    if (sk.effet.specialMult && skillAcheteBrawler(brawlerId, variante, sk.id)) extra += sk.effet.specialMult;
  });
  return extra;
}

function bonusBouclierBrawler(brawlerId, variante) {
  let extra = 0;
  SKILL_TREE.forEach(sk => {
    if (sk.effet.bouclierBonus && skillAcheteBrawler(brawlerId, variante, sk.id)) extra += sk.effet.bouclierBonus;
  });
  return extra;
}

function bonusRiposteBrawler(brawlerId, variante) {
  let extra = 0;
  SKILL_TREE.forEach(sk => {
    if (sk.effet.riposteMult && skillAcheteBrawler(brawlerId, variante, sk.id)) extra += sk.effet.riposteMult;
  });
  return extra;
}

function hasFureurBrawler(brawlerId, variante)     { return skillAcheteBrawler(brawlerId, variante, 'fureur'); }
function hasResilienceBrawler(brawlerId, variante) { return skillAcheteBrawler(brawlerId, variante, 'resilience'); }

/* ── Rétro-compat : fonctions globales utilisées dans combat.js (remplacées par version par-brawler) ── */
function bonusHPSkills()       { return 1; }
function bonusATKSkills()      { return 1; }
function bonusSpecialMult()    { return 0; }
function bonusBouclierReduction() { return 0; }
function bonusRiposteMult()    { return 0; }
function hasFureur()           { return false; }
function hasResilience()       { return false; }

/* ── Acheter une compétence pour le brawler courant ── */
function acheterSkill(skillId) {
  const bId = _skillTreeBrawlerId;
  const var_ = _skillTreeVariante;
  if (bId === null || !var_) return;

  const sk = SKILL_TREE.find(s => s.id === skillId);
  if (!sk) return;
  if (skillAcheteBrawler(bId, var_, skillId)) return;
  if (!skillDebloqueBrawler(bId, var_, skillId)) return;

  const pp = getBrawlerPP(bId, var_);
  if (pp < sk.cout) return;

  setBrawlerPP(bId, var_, pp - sk.cout);
  if (!etat.brawlerSkills[cle(bId, var_)]) etat.brawlerSkills[cle(bId, var_)] = {};
  etat.brawlerSkills[cle(bId, var_)][skillId] = true;

  if (typeof mettreAJourCompteurs === 'function') mettreAJourCompteurs();
  if (typeof sauvegarderEtatCloud  === 'function') sauvegarderEtatCloud();
  afficherSkillTree();
  // Rafraîchir l'inventaire pour mettre à jour le badge PP
  if (typeof afficherInventaire === 'function') afficherInventaire();

  Sound.roll && Sound.roll();
}

/* ════════════════════════════════════════════════
   RENDU
════════════════════════════════════════════════ */

function afficherSkillTree() {
  const zone = document.getElementById('skillTreeZone');
  if (!zone) return;

  const bId     = _skillTreeBrawlerId;
  const variante = _skillTreeVariante;

  if (bId === null || !variante) {
    const titleEl = document.getElementById('skillTreeTitle');
    if (titleEl) titleEl.textContent = '⚡ Arbre de Compétences';
    zone.innerHTML = `
      <div style="text-align:center;padding:2rem;color:var(--text-muted)">
        <div style="font-size:2rem;margin-bottom:.5rem">⚡</div>
        <div style="font-weight:700;color:#e2e8f0;margin-bottom:.4rem">Skill Tree individuel</div>
        <div style="font-size:.8rem;line-height:1.5">
          Clique sur un brawler dans l'inventaire<br>pour accéder à son arbre de compétences.
        </div>
      </div>`;
    return;
  }

  const b      = BRAWLERS.find(x => x.id === bId);
  if (!b) return;
  const v      = VARIANTES[variante];
  /* Mettre à jour le titre de la modale */
  const titleEl = document.getElementById('skillTreeTitle');
  if (titleEl) titleEl.textContent = `⚡ ${b.nom} — Skills`;
  const color  = couleurVariante(b, variante);
  const pp     = getBrawlerPP(bId, variante);
  const skills = getBrawlerSkills(bId, variante);
  const totalAchetes = Object.keys(skills).length;
  const rangees = [1, 2, 3];

  const imgFilter = variante === 'shiny'      ? 'drop-shadow(0 0 8px #38bdf8) brightness(1.15)'
                  : variante === 'golden'     ? 'drop-shadow(0 0 8px #fbbf24) sepia(0.4) brightness(1.2)'
                  : variante === 'rainbow'    ? 'drop-shadow(0 0 10px #e879f9) saturate(1.6)'
                  : variante === 'monochrome' ? 'drop-shadow(0 0 10px #f8fafc) grayscale(1) contrast(1.2)'
                  : `drop-shadow(0 0 4px ${color}66)`;

  zone.innerHTML = `
    <!-- En-tête brawler -->
    <div style="display:flex;align-items:center;gap:.75rem;margin-bottom:1rem;
      padding:.6rem .8rem;background:rgba(0,0,0,.3);border-radius:12px;
      border:1px solid ${color}40">
      <img src="${b.img}" alt="${b.nom}"
        style="width:52px;height:52px;object-fit:contain;filter:${imgFilter}"
        onerror="this.style.display='none'">
      <div style="flex:1;min-width:0">
        <div style="font-weight:900;font-size:.9rem;color:${color}">${b.nom}</div>
        <div style="font-size:.65rem;color:var(--text-muted)">${v.emoji ? v.emoji + ' ' : ''}${v.label}</div>
        <div style="font-size:.65rem;color:var(--text-muted);margin-top:.1rem">
          ${totalAchetes} compétence${totalAchetes !== 1 ? 's' : ''} acquise${totalAchetes !== 1 ? 's' : ''}
        </div>
      </div>
      <div style="text-align:right">
        <div style="font-size:.6rem;color:var(--text-muted);text-transform:uppercase;letter-spacing:.06em">PP dispo</div>
        <div style="font-size:1.4rem;font-weight:900;color:#a855f7">⚡ ${pp}</div>
        <div style="font-size:.55rem;color:var(--text-muted)">gagnés en combat</div>
      </div>
    </div>

    ${rangees.map(r => {
      const sks = SKILL_TREE.filter(s => s.rangee === r);
      const labelRangee = r === 1 ? 'Rang 1 — Bases' : r === 2 ? 'Rang 2 — Spécialisations' : 'Rang 3 — Maîtrises';
      return `
        <div style="margin-bottom:.9rem">
          <div style="font-size:.6rem;font-weight:800;text-transform:uppercase;letter-spacing:.1em;
            color:var(--text-muted);margin-bottom:.45rem;text-align:center">${labelRangee}</div>
          <div style="display:flex;gap:.55rem;justify-content:center;flex-wrap:wrap">
            ${sks.map(sk => renderSkillCard(sk, bId, variante, pp)).join('')}
          </div>
        </div>
      `;
    }).join('')}

    <div style="font-size:.6rem;color:var(--text-muted);text-align:center;margin-top:.5rem;padding:.5rem;
      background:rgba(168,85,247,.06);border-radius:8px;border:1px solid rgba(168,85,247,.15)">
      💡 Ces améliorations s'appliquent uniquement à
      <b style="color:${color}">${b.nom} ${v.label}</b> en combat.
      Chaque brawler a son propre arbre et ses propres PP.
    </div>
  `;
}

function renderSkillCard(sk, bId, variante, pp) {
  const achete      = skillAcheteBrawler(bId, variante, sk.id);
  const debloque    = skillDebloqueBrawler(bId, variante, sk.id);
  const peutAcheter = debloque && !achete && pp >= sk.cout;
  const locked      = !debloque;

  const borderColor = achete ? '#22c55e'
                    : peutAcheter ? '#a855f7'
                    : locked ? 'rgba(148,163,184,.2)'
                    : 'rgba(168,85,247,.3)';

  const bg = achete ? 'rgba(34,197,94,.10)'
           : peutAcheter ? 'rgba(168,85,247,.12)'
           : 'rgba(30,30,50,.4)';

  const reqLabels = sk.requis.map(r => {
    const parent = SKILL_TREE.find(s => s.id === r);
    return parent ? parent.nom : r;
  }).join(', ');

  return `
    <div style="
      width:130px;min-height:130px;border-radius:12px;padding:.7rem .6rem;
      background:${bg};border:1.5px solid ${borderColor};
      opacity:${locked ? 0.5 : 1};
      display:flex;flex-direction:column;align-items:center;gap:.3rem;
      transition:all .2s;position:relative;
    ">
      ${achete   ? `<div style="position:absolute;top:.3rem;right:.4rem;font-size:.6rem;color:#22c55e;font-weight:900">✓ ACQUIS</div>` : ''}
      ${locked   ? `<div style="position:absolute;top:.3rem;right:.4rem;font-size:.65rem">🔒</div>` : ''}

      <div style="font-size:1.5rem">${sk.icone}</div>
      <div style="font-size:.72rem;font-weight:900;color:#e2e8f0;text-align:center;line-height:1.2">${sk.nom}</div>
      <div style="font-size:.62rem;color:var(--text-muted);text-align:center;line-height:1.3;flex:1">${sk.desc}</div>

      ${sk.requis.length > 0 ? `
        <div style="font-size:.55rem;color:var(--text-muted);text-align:center">
          Nécessite : <span style="color:${sk.requis.every(r => skillAcheteBrawler(bId, variante, r)) ? '#22c55e' : '#f59e0b'}">${reqLabels}</span>
        </div>` : ''}

      ${!achete ? `
        <button onclick="acheterSkill('${sk.id}')"
          style="
            margin-top:.2rem;width:100%;padding:.3rem;border-radius:8px;border:none;cursor:${peutAcheter ? 'pointer' : 'not-allowed'};
            font-weight:900;font-size:.7rem;
            background:${peutAcheter ? 'linear-gradient(135deg,#7c3aed,#a855f7)' : 'rgba(100,100,120,.3)'};
            color:${peutAcheter ? '#fff' : 'var(--text-muted)'};
            box-shadow:${peutAcheter ? '0 0 10px rgba(168,85,247,.3)' : 'none'};
          "
          ${!peutAcheter ? 'disabled' : ''}
        >⚡ ${sk.cout} PP</button>
      ` : ''}
    </div>
  `;
}

/* ── Compatibilité : ancienne ouverture via bouton global PP ── */
function ouvrirSkillTreeGlobal() {
  /* Si un seul brawler équipé, ouvrir le sien directement */
  const equipes = etat.petsEquipes.filter(p => p !== null);
  if (equipes.length === 1) {
    ouvrirSkillTreeBrawler(equipes[0].brawler.id, equipes[0].variante);
  } else {
    /* Sinon : ouvrir sans contexte, montrer un message d'orientation */
    _skillTreeBrawlerId = null;
    _skillTreeVariante  = null;
    ouvrirModal('modalSkillTree');
    afficherSkillTree();
  }
}
