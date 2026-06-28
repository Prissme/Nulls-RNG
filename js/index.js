/* ════════════════════════════════════════════════
   index.js — Index des Brawlers & Récompenses de Luck
   Chaque fois qu'une rareté est complète (tous les brawlers
   d'une rareté possédés dans une variante), un bonus de luck
   permanent est débloqué.
   
   Bonus :
     Full [rareté] Normal  → +5%  luck
     Full [rareté] Shiny   → +10% luck
     Full [rareté] Golden  → +15% luck
     Full [rareté] Rainbow → +20% luck
════════════════════════════════════════════════ */

const INDEX_LUCK_BONUS = {
  normal:  0.05,  // +5%
  shiny:   0.10,  // +10%
  golden:  0.15,  // +15%
  rainbow: 0.20,  // +20%
};

/* Retourne la liste des raretés présentes dans BRAWLERS */
function getRarityGroups() {
  const groups = {};
  for (const b of BRAWLERS) {
    if (!groups[b.rarity]) groups[b.rarity] = [];
    groups[b.rarity].push(b);
  }
  return groups;
}

/* Vérifie si le joueur a au moins 1 exemplaire de chaque brawler
   d'une rareté donnée, dans une variante donnée */
function isRarityComplete(rarityKey, variante) {
  const group = BRAWLERS.filter(b => b.rarity === rarityKey);
  return group.every(b => (etat.inventaire[cle(b.id, variante)] || 0) >= 1);
}

/* Calcule le bonus de luck total de l'index (somme de tous les sets complets) */
function luckBonusIndex() {
  let bonus = 0;
  const rarityKeys = [...new Set(BRAWLERS.map(b => b.rarity))];
  for (const rarityKey of rarityKeys) {
    for (const [variante, pct] of Object.entries(INDEX_LUCK_BONUS)) {
      if (isRarityComplete(rarityKey, variante)) {
        bonus += pct;
      }
    }
  }
  return bonus;
}

/* Override luckMultiplierTotal pour inclure le bonus index */
const _origLuckMultiplierTotal = luckMultiplierTotal;
// On réécrit la fonction dans state.js via une closure :
// (on utilise un patch post-chargement)
function luckMultiplierTotalAvecIndex() {
  return _origLuckMultiplierTotal() * (1 + luckBonusIndex());
}

/* Patch : remplacer luckMultiplierTotal globalement */
window.luckMultiplierTotal = luckMultiplierTotalAvecIndex;

/* ── Rendu de la modal Index ── */
function afficherIndex() {
  const zone = document.getElementById('indexZone');
  if (!zone) return;

  const rarityKeys  = ['super-rare', 'rare', 'common'];
  const variantes   = ['normal', 'shiny', 'golden', 'rainbow'];
  const varLabels   = { normal: 'Normal', shiny: 'Shiny', golden: 'Golden', rainbow: 'Rainbow' };
  const varColors   = { normal: '#94a3b8', shiny: '#38bdf8', golden: '#fbbf24', rainbow: '#e879f9' };
  const varEmojis   = { normal: '', shiny: '✦', golden: '★', rainbow: '🌈' };

  const totalBonusIndex = luckBonusIndex();
  const groups = getRarityGroups();

  let html = `
    <div style="margin-bottom:.75rem;padding:.6rem .9rem;border-radius:10px;
      background:rgba(168,85,247,.08);border:1px solid rgba(168,85,247,.25);
      display:flex;align-items:center;justify-content:space-between;gap:.5rem;flex-wrap:wrap">
      <span style="font-size:.78rem;font-weight:700;color:#e2e2f0">🍀 Bonus Luck Total (Index)</span>
      <span style="font-family:var(--font-mono);font-weight:900;font-size:.9rem;color:#a855f7">
        +${Math.round(totalBonusIndex * 100)}%
      </span>
    </div>
    <div style="font-size:.62rem;color:var(--text-muted);margin-bottom:.85rem;line-height:1.5">
      Complète chaque rareté dans toutes les variantes pour gagner de la luck permanente.
      <br>Normal <span style="color:#94a3b8">+5%</span> &nbsp;•&nbsp;
      Shiny <span style="color:#38bdf8">+10%</span> &nbsp;•&nbsp;
      Golden <span style="color:#fbbf24">+15%</span> &nbsp;•&nbsp;
      Rainbow <span style="color:#e879f9">+20%</span>
    </div>
  `;

  for (const rarityKey of rarityKeys) {
    const r     = RARITIES[rarityKey];
    const group = groups[rarityKey] || [];
    if (!group.length) continue;

    html += `
      <div style="margin-bottom:1rem">
        <div style="display:flex;align-items:center;gap:.5rem;margin-bottom:.4rem;
          padding-bottom:.3rem;border-bottom:1px solid ${r.borderCss}">
          <span style="font-size:.65rem;font-weight:900;text-transform:uppercase;
            letter-spacing:.07em;color:${r.couleur}">${r.label}</span>
          <span style="font-size:.6rem;color:var(--text-muted)">(${group.length} brawlers)</span>
        </div>
    `;

    /* Grille : brawler en ligne, variantes en colonnes */
    html += `
      <div style="display:grid;grid-template-columns:1fr repeat(4,36px);gap:.2rem .3rem;
        font-size:.58rem;font-weight:700;text-align:center;margin-bottom:.2rem;padding:0 .1rem">
        <span style="color:var(--text-muted);text-align:left">Brawler</span>
        <span style="color:#94a3b8">Nor.</span>
        <span style="color:#38bdf8">Shi.</span>
        <span style="color:#fbbf24">Gol.</span>
        <span style="color:#e879f9">Rain.</span>
      </div>
    `;

    for (const b of group) {
      html += `
        <div style="display:grid;grid-template-columns:1fr repeat(4,36px);gap:.2rem .3rem;
          align-items:center;padding:.25rem .1rem;border-radius:6px;
          background:rgba(255,255,255,.02);margin-bottom:.15rem">
          <span style="display:flex;align-items:center;gap:.35rem">
            ${brawlerImg(b, 'w-5 h-5')}
            <span style="color:${r.couleur};font-weight:700;font-size:.65rem">${b.nom}</span>
          </span>
      `;
      for (const v of variantes) {
        const has = (etat.inventaire[cle(b.id, v)] || 0) >= 1;
        html += `
          <span style="text-align:center;font-size:.8rem" title="${has ? 'Obtenu !' : 'Pas encore'}">
            ${has ? '<span style="color:#4ade80">✓</span>' : '<span style="color:var(--text-dim)">·</span>'}
          </span>
        `;
      }
      html += `</div>`;
    }

    /* Ligne de totaux + récompenses pour cette rareté */
    html += `<div style="display:grid;grid-template-columns:1fr repeat(4,36px);gap:.2rem .3rem;
      margin-top:.35rem;padding-top:.3rem;border-top:1px solid rgba(255,255,255,.05)">
      <span style="font-size:.6rem;color:var(--text-muted);font-weight:700">Récompense</span>`;
    for (const v of variantes) {
      const complete = isRarityComplete(rarityKey, v);
      const pct      = Math.round(INDEX_LUCK_BONUS[v] * 100);
      html += `
        <span style="text-align:center;font-size:.62rem;font-weight:900;
          color:${complete ? varColors[v] : 'var(--text-dim)'}"
          title="${complete ? 'Débloqué !' : 'Encore ' + (BRAWLERS.filter(b=>b.rarity===rarityKey).filter(b=>(etat.inventaire[cle(b.id,v)]||0)<1).length) + ' brawler(s) manquant(s)'}">
          ${complete ? '🔓' : '🔒'}<br>+${pct}%
        </span>
      `;
    }
    html += `</div></div>`;
  }

  zone.innerHTML = html;
}
