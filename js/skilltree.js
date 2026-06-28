/* ════════════════════════════════════════════════
   skilltree.js — Arbre de Compétences des Brawlers
   Monnaie : Points de Pouvoir (PP), gagnés en combat
   Les compétences améliorent les stats en combat
   (HP, ATK, spéciale) de façon permanente.
════════════════════════════════════════════════ */

/* ── Définition des compétences ── */
const SKILL_TREE = [
  /* Ligne 1 — toujours accessible */
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
    effet: { specialMult: 0.5 }, // +0.5 au ×2.5 de base
  },

  /* Ligne 2 — nécessitent 1 compétence de ligne 1 */
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
    effet: { bouclierBonus: 0.20 }, // réduction supplémentaire
  },
  {
    id: 'riposte',
    nom: 'Riposte',
    icone: '🔄',
    desc: 'L\'ATK de riposte en Défense = 80% au lieu de 50%',
    cout: 4,
    rangee: 2,
    requis: ['atk1'],
    effet: { riposteMult: 0.30 }, // +0.30 au 0.50 de base
  },

  /* Ligne 3 — nécessitent 2 compétences */
  {
    id: 'titan',
    nom: 'Titan',
    icone: '🏔️',
    desc: '+50% HP et +50% ATK — le brawler devient redoutable',
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
    desc: 'Si HP < 30% : soigne 10% des HP max au début du tour',
    cout: 8,
    rangee: 3,
    requis: ['hp2', 'bouclier'],
    effet: { resilience: true },
  },
];

/* ── Getters rapides ── */
const skillAchete  = (id) => !!(etat.skillsAchetes && etat.skillsAchetes[id]);
const skillDebloque = (id) => {
  const sk = SKILL_TREE.find(s => s.id === id);
  if (!sk) return false;
  return sk.requis.every(r => skillAchete(r));
};

/* ── Bonus HP multiplicateur cumulé ── */
function bonusHPSkills() {
  let mult = 1;
  SKILL_TREE.forEach(sk => {
    if (sk.effet.hp && skillAchete(sk.id)) mult += sk.effet.hp;
  });
  return mult;
}

function bonusATKSkills() {
  let mult = 1;
  SKILL_TREE.forEach(sk => {
    if (sk.effet.atk && skillAchete(sk.id)) mult += sk.effet.atk;
  });
  return mult;
}

function bonusSpecialMult() {
  let extra = 0;
  SKILL_TREE.forEach(sk => {
    if (sk.effet.specialMult && skillAchete(sk.id)) extra += sk.effet.specialMult;
  });
  return extra; // s'additionne au ×2.5 de base
}

function bonusBouclierReduction() {
  let extra = 0;
  SKILL_TREE.forEach(sk => {
    if (sk.effet.bouclierBonus && skillAchete(sk.id)) extra += sk.effet.bouclierBonus;
  });
  return extra; // s'additionne à la réduction de base 0.40
}

function bonusRiposteMult() {
  let extra = 0;
  SKILL_TREE.forEach(sk => {
    if (sk.effet.riposteMult && skillAchete(sk.id)) extra += sk.effet.riposteMult;
  });
  return extra; // s'additionne au 0.50 de base
}

const hasFureur     = () => skillAchete('fureur');
const hasResilience = () => skillAchete('resilience');

/* ── Acheter une compétence ── */
function acheterSkill(id) {
  const sk = SKILL_TREE.find(s => s.id === id);
  if (!sk) return;
  if (skillAchete(id)) return;
  if (!skillDebloque(id)) return;
  if ((etat.pointsPouvoir || 0) < sk.cout) return;

  etat.pointsPouvoir = (etat.pointsPouvoir || 0) - sk.cout;
  if (!etat.skillsAchetes) etat.skillsAchetes = {};
  etat.skillsAchetes[id] = true;

  if (typeof mettreAJourCompteurs === 'function') mettreAJourCompteurs();
  if (typeof sauvegarderEtatCloud  === 'function') sauvegarderEtatCloud();
  afficherSkillTree();

  Sound.roll && Sound.roll();
}

/* ════════════════════════════════════════════════
   RENDU
════════════════════════════════════════════════ */

function afficherSkillTree() {
  const zone = document.getElementById('skillTreeZone');
  if (!zone) return;

  const pp = etat.pointsPouvoir || 0;
  const totalAchetes = Object.keys(etat.skillsAchetes || {}).length;

  /* Grouper par rangée */
  const rangees = [1, 2, 3];

  zone.innerHTML = `
    <div style="text-align:center;margin-bottom:1rem">
      <div style="font-size:.7rem;color:var(--text-muted);margin-bottom:.2rem;text-transform:uppercase;letter-spacing:.08em">
        Points de Pouvoir disponibles
      </div>
      <div style="font-size:1.6rem;font-weight:900;color:#a855f7">
        ⚡ ${pp} PP
      </div>
      <div style="font-size:.65rem;color:var(--text-muted);margin-top:.2rem">
        Gagnés en remportant des combats • ${totalAchetes} compétence${totalAchetes !== 1 ? 's' : ''} acquise${totalAchetes !== 1 ? 's' : ''}
      </div>
    </div>

    ${rangees.map(r => {
      const skills = SKILL_TREE.filter(s => s.rangee === r);
      const labelRangee = r === 1 ? 'Rang 1 — Bases' : r === 2 ? 'Rang 2 — Spécialisations' : 'Rang 3 — Maîtrises';
      return `
        <div style="margin-bottom:1rem">
          <div style="font-size:.6rem;font-weight:800;text-transform:uppercase;letter-spacing:.1em;
            color:var(--text-muted);margin-bottom:.5rem;text-align:center">${labelRangee}</div>
          <div style="display:flex;gap:.6rem;justify-content:center;flex-wrap:wrap">
            ${skills.map(sk => renderSkillCard(sk, pp)).join('')}
          </div>
        </div>
      `;
    }).join('')}

    <div style="font-size:.6rem;color:var(--text-muted);text-align:center;margin-top:.5rem;padding:.5rem;
      background:rgba(168,85,247,.06);border-radius:8px;border:1px solid rgba(168,85,247,.15)">
      💡 Ces améliorations s'appliquent à <b style="color:#e2e8f0">tous tes brawlers</b> en combat.
      Elles sont permanentes et ne se réinitialisent pas avec la Renaissance.
    </div>
  `;
}

function renderSkillCard(sk, pp) {
  const achete   = skillAchete(sk.id);
  const debloque = skillDebloque(sk.id);
  const peutAcheter = debloque && !achete && pp >= sk.cout;
  const locked   = !debloque;

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
      ${achete ? `<div style="position:absolute;top:.3rem;right:.4rem;font-size:.6rem;color:#22c55e;font-weight:900">✓ ACQUIS</div>` : ''}
      ${locked ? `<div style="position:absolute;top:.3rem;right:.4rem;font-size:.65rem">🔒</div>` : ''}

      <div style="font-size:1.5rem">${sk.icone}</div>
      <div style="font-size:.72rem;font-weight:900;color:#e2e8f0;text-align:center;line-height:1.2">${sk.nom}</div>
      <div style="font-size:.62rem;color:var(--text-muted);text-align:center;line-height:1.3;flex:1">${sk.desc}</div>

      ${sk.requis.length > 0 ? `
        <div style="font-size:.55rem;color:var(--text-muted);text-align:center">
          Nécessite : <span style="color:${sk.requis.every(r => skillAchete(r)) ? '#22c55e' : '#f59e0b'}">${reqLabels}</span>
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
