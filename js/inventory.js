/* ════════════════════════════════════════════════
   inventory.js — Inventaire : vente, filtre, tri, rendu
════════════════════════════════════════════════ */

/* ── Vendre un item ── */
function vendreItem(brawlerId, variante) {
  const k = cle(brawlerId, variante);
  if (!etat.inventaire[k] || etat.inventaire[k] <= 0) return;

  // Impossible de vendre un pet équipé
  const estEquipe = etat.petsEquipes.some(p =>
    p && p.brawler.id === brawlerId && p.variante === variante);
  if (estEquipe) return;

  const b       = BRAWLERS.find(b => b.id === brawlerId);
  const v       = VARIANTES[variante];
  const prix    = Math.round(b.sellValue * v.sellMult);
  etat.pieces  += prix;
  etat.inventaire[k]--;
  if (etat.inventaire[k] === 0) delete etat.inventaire[k];

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

/* ── Tri : par rareté (probabilité réelle) ou par revenus (CPS) ── */
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
      // Par défaut : tri par rareté réelle (1/chance), du plus rare au plus commun
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
    const prix  = Math.round(b.sellValue * v.sellMult);
    const cps   = calcCPS(b, variante);
    const color = couleurVariante(b, variante);

    const estEquipe   = etat.petsEquipes.some(p => p && p.brawler.id === brawlerId && p.variante === variante);
    const slotsDispo  = etat.petsEquipes.filter(p => p === null).length;
    const peutEquiper = !estEquipe && slotsDispo > 0;

    // Badge variante
    let badgeHtml = '';
    if (variante !== 'normal') {
      badgeHtml = variante === 'rainbow'
        ? `<span style="font-size:.6rem;font-weight:900;background:linear-gradient(90deg,#f472b6,#818cf8,#34d399,#fbbf24);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text">🌈 RAINBOW</span>`
        : `<span class="text-xs font-bold" style="color:${color}">${v.emoji} ${v.label}</span>`;
    }

    const varClass = variante === 'shiny'   ? 'var-shiny'
                   : variante === 'golden'  ? 'var-golden'
                   : variante === 'rainbow' ? 'var-rainbow'
                   : '';

    const card = document.createElement('div');
    card.className = `inv-item ${b.bgClass} ${varClass}`;
    if (variante === 'golden') card.style.borderColor = '#fbbf24';
    if (variante === 'shiny')  card.style.borderColor = '#38bdf8';

    card.innerHTML = `
      <div class="flex items-center justify-between">
        <span class="text-xl">${b.emoji}</span>
        <span class="text-xs font-bold px-1.5 py-0.5 rounded-full"
              style="background:rgba(0,0,0,.35);color:${color}">×${qty}</span>
      </div>
      <div class="font-bold text-sm leading-tight" style="color:${color}">${b.nom}</div>
      ${badgeHtml}
      <div class="text-xs" style="color:var(--text-muted)">1/${b.div * v.chanceMult}</div>
      <div class="text-xs" style="color:#fbbf24">+${cps}💰/s</div>
      <div class="flex gap-1 mt-1">
        <button class="equip-btn ${estEquipe ? 'equipped' : ''}"
                onclick="equiper(${brawlerId},'${variante}')"
                ${!peutEquiper && !estEquipe ? 'disabled' : ''}>
          ${estEquipe ? '✓ Équipé' : 'Équiper'}
        </button>
        <button class="sell-btn" onclick="vendreItem(${brawlerId},'${variante}')"
                ${estEquipe ? 'disabled style="opacity:.35;cursor:not-allowed"' : ''}>
          ${prix}💰
        </button>
      </div>
    `;
    grid.appendChild(card);
  }
}
