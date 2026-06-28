/* ════════════════════════════════════════════════
   inventory.js — Inventaire : vente, filtre, tri, rendu
════════════════════════════════════════════════ */

const ITEMS_PAR_PAGE = 12;
let inventairePage = 1;

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
  inventairePage = 1;
  document.querySelectorAll('#variantTabs .tab-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  afficherInventaire();
}

/* ── Tri ── */
function trierInventaire(mode, btn) {
  etat.triInventaire = mode;
  inventairePage = 1;
  document.querySelectorAll('#sortTabs .tab-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  afficherInventaire();
}

/* ── Rendu de la grille inventaire ── */
function afficherInventaire() {
  const grid = document.getElementById('inventoryGrid');
  grid.style.display = 'grid';
  grid.style.gridTemplateColumns = 'repeat(3, 1fr)';
  grid.style.gap = '.4rem';
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
    grid.style.gridTemplateColumns = '1fr';
    grid.innerHTML = `<p class="text-center text-xs py-6" style="color:var(--text-muted)">
      ${etat.filtreVariante !== 'all'
        ? 'Aucun item dans cette catégorie.'
        : 'Lance un Roll pour obtenir des brawlers !'}
    </p>`;
    return;
  }

  const totalPages  = Math.ceil(entries.length / ITEMS_PAR_PAGE);
  inventairePage    = Math.min(inventairePage, totalPages);
  const debut       = (inventairePage - 1) * ITEMS_PAR_PAGE;
  const pageEntries = entries.slice(debut, debut + ITEMS_PAR_PAGE);

  for (const { brawlerId, variante } of pageEntries) {
    const k   = cle(brawlerId, variante);
    const qty = etat.inventaire[k] || 0;
    if (qty === 0) continue;

    const b     = BRAWLERS.find(b => b.id === brawlerId);
    const v     = VARIANTES[variante];
    const prix  = Math.round(b.sellValue * v.sellMult * venteBonusPrestige());
    const cps   = Math.round(calcCPS(b, variante) * 10) / 10;
    const color = couleurVariante(b, variante);
    const proba = (b.div * v.chanceMult).toLocaleString('fr-FR');
    const prixFmt = prix >= 1000000 ? (prix/1000000).toFixed(1)+'M'
                  : prix >= 1000    ? (prix/1000).toFixed(prix%1000===0?0:1)+'k'
                  : prix;

    const estEquipe   = etat.petsEquipes.some(p => p && p.brawler.id === brawlerId && p.variante === variante);
    const slotsDispo  = etat.petsEquipes.filter(p => p === null).length;
    const peutEquiper = !estEquipe && slotsDispo > 0;

    const imgFilter = variante === 'shiny'   ? 'drop-shadow(0 0 8px #38bdf8) brightness(1.15)'
                    : variante === 'golden'  ? 'drop-shadow(0 0 8px #fbbf24) sepia(0.4) brightness(1.2)'
                    : variante === 'rainbow' ? 'drop-shadow(0 0 10px #e879f9) saturate(1.6)'
                    : `drop-shadow(0 0 4px ${color}66)`;

    let varBadge = '';
    if (variante === 'rainbow') {
      varBadge = `<span style="font-size:.48rem;font-weight:900;
        background:linear-gradient(90deg,#f472b6,#818cf8,#34d399,#fbbf24);
        -webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text">🌈 RAINBOW</span>`;
    } else if (variante !== 'normal') {
      varBadge = `<span style="font-size:.52rem;font-weight:800;color:${color}">${v.emoji} ${v.label}</span>`;
    }

    const card = document.createElement('div');
    card.style.cssText = `
      display:flex;flex-direction:column;align-items:center;text-align:center;
      border-radius:11px;border:1px solid ${color}50;
      background:${RARITIES[b.rarity].bgCss};
      padding:.5rem .3rem .4rem;gap:.22rem;
      position:relative;min-width:0;
    `;

    card.innerHTML = `
      ${qty > 1 ? `<span style="
        position:absolute;top:.28rem;right:.28rem;
        font-family:var(--font-mono);font-size:.55rem;font-weight:900;line-height:1;
        padding:.1rem .28rem;border-radius:999px;
        background:rgba(0,0,0,.6);border:1px solid ${color}40;color:${color}">×${qty}</span>` : ''}

      <div style="width:50px;height:50px;display:flex;align-items:center;justify-content:center;
        border-radius:10px;background:rgba(0,0,0,.3);border:1px solid ${color}30">
        ${brawlerImg(b, 'w-10 h-10', `filter:${imgFilter}`)}
      </div>

      <div style="line-height:1.15;min-width:0;width:100%">
        <div style="font-weight:800;font-size:.65rem;color:${color};
          white-space:nowrap;overflow:hidden;text-overflow:ellipsis;padding:0 .1rem">${b.nom}</div>
        ${varBadge ? `<div style="margin-top:.05rem">${varBadge}</div>` : ''}
      </div>

      <div style="font-family:var(--font-mono);font-size:.56rem;font-weight:700;color:#5eead4;
        background:rgba(0,0,0,.3);border-radius:5px;padding:.1rem .25rem;width:100%">
        1/${proba}
      </div>

      <div style="font-size:.58rem;font-weight:700;color:#fbbf24;
        display:flex;align-items:center;justify-content:center;gap:.15rem">
        ${coinImg('w-3 h-3')}${Number.isInteger(cps) ? cps : cps.toFixed(1)}/s
      </div>

      <div style="display:flex;gap:.22rem;width:100%;margin-top:.05rem">
        <button class="equip-btn ${estEquipe ? 'equipped' : ''}"
          style="flex:1;font-size:.58rem;padding:.18rem 0"
          onclick="equiper(${brawlerId},'${variante}')"
          ${!peutEquiper && !estEquipe ? 'disabled' : ''}>
          ${estEquipe ? '✓' : 'Pet'}
        </button>
        <button class="sell-btn"
          style="flex:1;font-size:.56rem;padding:.18rem 0"
          onclick="vendreItem(${brawlerId},'${variante}')"
          ${estEquipe ? 'disabled' : ''}>
          ${prixFmt}💰
        </button>
      </div>
    `;
    grid.appendChild(card);
  }

  // Pagination
  if (totalPages > 1) {
    const nav = document.createElement('div');
    nav.style.cssText = `grid-column:1/-1;display:flex;align-items:center;justify-content:center;gap:.5rem;padding:.6rem 0 .1rem;`;

    const btnPrev = document.createElement('button');
    btnPrev.textContent = '← Préc.';
    btnPrev.style.cssText = `padding:.3rem .75rem;border-radius:8px;font-size:.72rem;font-weight:700;
      background:rgba(255,255,255,.06);border:1px solid var(--border);color:var(--text-muted);cursor:pointer;
      ${inventairePage <= 1 ? 'opacity:.3;pointer-events:none;' : ''}`;
    btnPrev.onclick = () => { inventairePage--; afficherInventaire(); };

    const info = document.createElement('span');
    info.textContent = `${inventairePage} / ${totalPages}`;
    info.style.cssText = `font-size:.72rem;font-weight:800;color:var(--text-dim);min-width:3.5rem;text-align:center;`;

    const btnNext = document.createElement('button');
    btnNext.textContent = 'Suiv. →';
    btnNext.style.cssText = `padding:.3rem .75rem;border-radius:8px;font-size:.72rem;font-weight:700;
      background:rgba(255,255,255,.06);border:1px solid var(--border);color:var(--text-muted);cursor:pointer;
      ${inventairePage >= totalPages ? 'opacity:.3;pointer-events:none;' : ''}`;
    btnNext.onclick = () => { inventairePage++; afficherInventaire(); };

    nav.appendChild(btnPrev);
    nav.appendChild(info);
    nav.appendChild(btnNext);
    grid.appendChild(nav);
  }
}
