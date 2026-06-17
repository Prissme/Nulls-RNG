/* ════════════════════════════════════════════════
   craft.js — Système de craft (upgrade de variante)
   10 Normal  → 1 Shiny
   10 Shiny   → 1 Golden
   10 Golden  → 1 Rainbow
════════════════════════════════════════════════ */

const CRAFT_RECETTES = [
  { depuis: 'normal',  vers: 'shiny',   qte: 10, label: '10 Normal → 1 Shiny',   couleur: '#38bdf8' },
  { depuis: 'shiny',   vers: 'golden',  qte: 10, label: '10 Shiny → 1 Golden',   couleur: '#fbbf24' },
  { depuis: 'golden',  vers: 'rainbow', qte: 10, label: '10 Golden → 1 Rainbow', couleur: '#e879f9' },
];

/* Tente de crafter. brawlerId = id du brawler, recette = objet CRAFT_RECETTES */
function crafterVariante(brawlerId, recette) {
  const kSrc = cle(brawlerId, recette.depuis);
  const qty  = etat.inventaire[kSrc] || 0;

  if (qty < recette.qte) return; // pas assez

  // Consommer les sources (en excluant les équipés)
  const equipes = etat.petsEquipes.filter(p =>
    p && p.brawler.id === brawlerId && p.variante === recette.depuis).length;
  const disponibles = qty - equipes;
  if (disponibles < recette.qte) return;

  etat.inventaire[kSrc] -= recette.qte;
  if (etat.inventaire[kSrc] === 0) delete etat.inventaire[kSrc];

  // Produire la variante supérieure
  const kDst = cle(brawlerId, recette.vers);
  etat.inventaire[kDst] = (etat.inventaire[kDst] || 0) + 1;

  // Vérifier progression quêtes craft
  progresserQuete('craft', { variante: recette.vers });

  flashCraft(recette);
  afficherInventaire();
  afficherCraft();
  mettreAJourCompteurs();
}

/* Flash notification craft réussi */
function flashCraft(recette) {
  const notif = document.createElement('div');
  notif.className = 'craft-notif';
  notif.style.cssText = `
    position:fixed; top:80px; left:50%; transform:translateX(-50%);
    background:var(--bg-card); border:1px solid ${recette.couleur};
    color:${recette.couleur}; font-weight:900; font-size:.9rem;
    padding:.6rem 1.4rem; border-radius:12px; z-index:999;
    box-shadow:0 0 20px ${recette.couleur}55;
    animation: craftIn .4s cubic-bezier(.22,.68,0,1.2) forwards;
  `;
  notif.textContent = `✨ Craft réussi ! ${recette.label.split('→')[1].trim()} obtenu`;
  document.body.appendChild(notif);
  setTimeout(() => notif.remove(), 2200);
}

/* ── Rendu du panneau craft ── */
function afficherCraft() {
  const container = document.getElementById('craftList');
  if (!container) return;
  container.innerHTML = '';

  // Grouper les brawlers ayant des items craftables
  for (const recette of CRAFT_RECETTES) {
    // Trouver les brawlers avec assez de la variante source
    const eligible = BRAWLERS.map(b => {
      const k   = cle(b.id, recette.depuis);
      const qty = etat.inventaire[k] || 0;
      // Soustraire équipés
      const equipes = etat.petsEquipes.filter(p =>
        p && p.brawler.id === b.id && p.variante === recette.depuis).length;
      return { b, disponible: qty - equipes, total: qty };
    }).filter(({ total }) => total > 0);

    if (eligible.length === 0) continue;

    // Titre recette
    const titre = document.createElement('div');
    titre.className = 'craft-recipe-title';
    titre.style.cssText = `color:${recette.couleur};font-size:.7rem;font-weight:900;
      text-transform:uppercase;letter-spacing:.1em;margin-top:.5rem;padding:.25rem 0;
      border-bottom:1px solid ${recette.couleur}33`;
    titre.textContent = recette.label;
    container.appendChild(titre);

    for (const { b, disponible, total } of eligible) {
      const peutCrafter = disponible >= recette.qte;
      const row = document.createElement('div');
      row.className = 'craft-row';
      row.style.cssText = `display:flex;align-items:center;justify-content:space-between;
        gap:.5rem;padding:.4rem .5rem;border-radius:8px;margin-top:.25rem;
        background:${peutCrafter ? recette.couleur + '12' : 'rgba(255,255,255,.03)'};
        border:1px solid ${peutCrafter ? recette.couleur + '44' : 'var(--border)'}`;

      const progressPct = Math.min(100, (disponible / recette.qte) * 100);
      const color = peutCrafter ? recette.couleur : 'var(--text-muted)';

      row.innerHTML = `
        <div style="flex:1;min-width:0">
          <div style="display:flex;align-items:center;gap:.35rem;margin-bottom:.2rem">
            <span>${b.emoji}</span>
            <span style="font-size:.78rem;font-weight:700;color:${b.couleur}">${b.nom}</span>
          </div>
          <div style="height:4px;background:var(--border);border-radius:2px;overflow:hidden">
            <div style="height:100%;width:${progressPct}%;background:${recette.couleur};border-radius:2px;transition:width .3s"></div>
          </div>
          <div style="font-size:.65rem;color:${color};margin-top:.15rem">${disponible}/${recette.qte} disponibles</div>
        </div>
        <button onclick="crafterVariante(${b.id}, CRAFT_RECETTES[${CRAFT_RECETTES.indexOf(recette)}])"
          style="flex-shrink:0;padding:.3rem .65rem;border-radius:8px;font-size:.7rem;font-weight:800;
            border:1px solid ${peutCrafter ? recette.couleur : 'var(--border)'};
            background:${peutCrafter ? recette.couleur + '22' : 'transparent'};
            color:${peutCrafter ? recette.couleur : 'var(--text-muted)'};
            cursor:${peutCrafter ? 'pointer' : 'not-allowed'};
            opacity:${peutCrafter ? '1' : '.45'}"
          ${!peutCrafter ? 'disabled' : ''}>
          Craft
        </button>
      `;
      container.appendChild(row);
    }
  }

  if (container.children.length === 0) {
    container.innerHTML = `<p style="color:var(--text-muted);font-size:.75rem;text-align:center;padding:.75rem 0">
      Accumule des brawlers pour débloquer le craft !
    </p>`;
  }
}
