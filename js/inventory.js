/* ════════════════════════════════════════════════
   inventory.js — Inventaire : vente, filtre, tri, rendu
════════════════════════════════════════════════ */

/* ── Vendre un item ── */
function vendreItem(brawlerId, variante) {
  const k = cle(brawlerId, variante);
  if (!etat.inventaire[k] || etat.inventaire[k] <= 0) return;

  const estEquipe = etat.petsEquipes.some(p =>
    p && p.brawler.id === brawlerId && p.variante === variante);
  if (estEquipe) return;

  const b       = BRAWLERS.find(b => b.id === brawlerId);
  const v       = VARIANTES[variante];
  const prix    = Math.round(b.sellValue * v.sellMult * venteBonusPrestige());
  etat.pieces  += prix;
  etat.inventaire[k]--;
  if (etat.inventaire[k] === 0) delete etat.inventaire[k];

  Sound.coin();
  mettreAJourCompteurs();
  afficherInventaire();
  sauvegarderEtatCloud();
}

/* ── Filtre par variante ── */
function filtrerVariante(variante, btn) {
  etat.filtreVariante = variante;
  document.querySelectorAll('#variantTabs .tab-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  afficherInventaire();
}

/* ── Tri ── */
function trierInventaire(mode, btn) {
  etat.triInventaire = mode;
  document.querySelectorAll('#sortTabs .tab-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  afficherInventaire();
}

/* ── Rendu de la grille inventaire ── */
function afficherInventaire() {
  const grid = document.getElementById('inventoryGrid');
  grid.innerHTML = '';

  const entries = Object.entries(etat.inventaire)
    .filter(([k, qty]) => qty > 0)
    .map(([k]) => parseKey(k))
    .filter(({ variante }) => etat.filtreVariante === 'all' || variante === etat.filtreVariante)
    .sort((a, b) => {
      const ba = BRAWLERS.find(x => x.id === a.brawlerId);
      const bb = BRAWLERS.find(x => x.id === b.brawlerId);
      if (etat.triInventaire === 'revenus') {
        return calcCPS(bb, b.variante) - calcCPS(ba, a.variante);
      }
      return scoreRarete(bb, b.variante) - scoreRarete(ba, a.variante);
    });

  if (entries.length === 0) {
    grid.innerHTML = `<p class="col-span-2 text-center text-xs py-6" style="color:var(--text-muted)">
      ${etat.filtreVariante !== 'all'
        ? 'Aucun item dans cette catégorie.'
        : 'Lance un Roll pour obtenir des brawlers !'}
    </p>`;
    return;
  }

  for (const { brawlerId, variante } of entries) {
    const k   = cle(brawlerId, variante);
    const qty = etat.inventaire[k] || 0;
    if (qty === 0) continue;

    const b     = BRAWLERS.find(b => b.id === brawlerId);
    const v     = VARIANTES[variante];
    const prix  = Math.round(b.sellValue * v.sellMult * venteBonusPrestige());
    const cps   = Math.round(calcCPS(b, variante) * 10) / 10;
    const color = couleurVariante(b, variante);
    const proba = (b.div * v.chanceMult).toLocaleString('fr-FR');

    const estEquipe   = etat.petsEquipes.some(p => p && p.brawler.id === brawlerId && p.variante === variante);
    const slotsDispo  = etat.petsEquipes.filter(p => p === null).length;
    const peutEquiper = !estEquipe && slotsDispo > 0;

    const imgFilter = variante === 'shiny'   ? 'drop-shadow(0 0 8px #38bdf8) brightness(1.15)'
                    : variante === 'golden'  ? 'drop-shadow(0 0 8px #fbbf24) sepia(0.4) brightness(1.2)'
                    : variante === 'rainbow' ? 'drop-shadow(0 0 10px #e879f9) saturate(1.6)'
                    : `drop-shadow(0 0 4px ${color}66)`;

    const varClass = variante === 'shiny'   ? 'var-shiny'
                   : variante === 'golden'  ? 'var-golden'
                   : variante === 'rainbow' ? 'var-rainbow'
                   : '';

    // Badge variante
    let varianteBadge = '';
    if (variante === 'rainbow') {
      varianteBadge = `<span style="font-size:.58rem;font-weight:900;letter-spacing:.05em;
        background:linear-gradient(90deg,#f472b6,#818cf8,#34d399,#fbbf24);
        -webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text">
        🌈 RAINBOW</span>`;
    } else if (variante !== 'normal') {
      varianteBadge = `<span style="font-size:.62rem;font-weight:800;color:${color}">${v.emoji} ${v.label}</span>`;
    }

    const card = document.createElement('div');
    card.className = `inv-item ${b.bgClass} ${varClass}`;
    if (variante === 'golden') card.style.borderColor = '#fbbf24';
    if (variante === 'shiny')  card.style.borderColor = '#38bdf8';

    card.innerHTML = `
      <!-- Header : image + qty -->
      <div style="display:flex;align-items:center;justify-content:space-between;gap:.4rem;margin-bottom:.1rem">
        <div style="display:flex;align-items:center;gap:.5rem;min-width:0">
          <div style="flex-shrink:0;width:44px;height:44px;display:flex;align-items:center;justify-content:center;
            border-radius:10px;background:rgba(0,0,0,.3);border:1px solid ${color}33">
            ${brawlerImg(b, 'w-9 h-9', `filter:${imgFilter}`)}
          </div>
          <div style="min-width:0">
            <div style="font-weight:800;font-size:.82rem;color:${color};
              overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${b.nom}</div>
            <div style="display:flex;align-items:center;gap:.3rem;flex-wrap:wrap">
              ${rarityBadge(b.rarity)}
              ${varianteBadge}
            </div>
          </div>
        </div>
        <span style="flex-shrink:0;font-family:var(--font-mono);font-size:.78rem;font-weight:900;
          padding:.2rem .55rem;border-radius:999px;
          background:rgba(0,0,0,.4);border:1px solid ${color}44;color:${color}">×${qty}</span>
      </div>

      <!-- Proba + CPS -->
      <div style="display:flex;align-items:center;justify-content:space-between;
        padding:.3rem .45rem;border-radius:7px;background:rgba(0,0,0,.25);margin:.1rem 0">
        <span style="font-family:var(--font-mono);font-size:.65rem;font-weight:700;color:#5eead4">
          🎲 1/${proba}
        </span>
        <span style="font-size:.65rem;font-weight:700;color:#fbbf24">
          +${Number.isInteger(cps) ? cps : cps.toFixed(1)} 💰/s
        </span>
      </div>

      <!-- Boutons -->
      <div style="display:flex;gap:.4rem;margin-top:.1rem">
        <button class="equip-btn ${estEquipe ? 'equipped' : ''}"
                style="flex:1"
                onclick="equiper(${brawlerId},'${variante}')"
                ${!peutEquiper && !estEquipe ? 'disabled' : ''}>
          ${estEquipe ? '✓ Équipé' : 'Équiper'}
        </button>
        <button class="sell-btn" onclick="vendreItem(${brawlerId},'${variante}')"
                ${estEquipe ? 'disabled style="opacity:.35;cursor:not-allowed"' : ''}>
          ${prix} 💰
        </button>
      </div>
    `;
    grid.appendChild(card);
  }
}
