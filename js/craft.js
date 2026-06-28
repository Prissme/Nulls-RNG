/* ════════════════════════════════════════════════
   craft.js — Système de craft (upgrade de variante)
════════════════════════════════════════════════ */

const CRAFT_RECETTES = [
  { depuis: 'normal',  vers: 'shiny',   qte: 10, label: '10 Normal → 1 Shiny',   couleur: '#38bdf8' },
  { depuis: 'shiny',   vers: 'golden',  qte: 10, label: '10 Shiny → 1 Golden',   couleur: '#fbbf24' },
  { depuis: 'golden',  vers: 'rainbow', qte: 10, label: '10 Golden → 1 Rainbow', couleur: '#e879f9' },
];

function crafterVariante(brawlerId, recette) {
  const kSrc = cle(brawlerId, recette.depuis);
  const qty  = etat.inventaire[kSrc] || 0;
  if (qty < recette.qte) return;

  // Persister les unlocks d'index AVANT de consommer les items
  if (typeof luckBonusIndex === 'function') luckBonusIndex();  const equipes = etat.petsEquipes.filter(p =>
    p && p.brawler.id === brawlerId && p.variante === recette.depuis).length;
  const disponibles = qty - equipes;
  if (disponibles < recette.qte) return;

  etat.inventaire[kSrc] -= recette.qte;
  if (etat.inventaire[kSrc] === 0) delete etat.inventaire[kSrc];

  const kDst = cle(brawlerId, recette.vers);
  etat.inventaire[kDst] = (etat.inventaire[kDst] || 0) + 1;

  progresserQuete('craft', { variante: recette.vers });

  Sound.craft();
  flashCraft(recette);
  afficherInventaire();
  afficherCraft();
  mettreAJourCompteurs();
  sauvegarderEtatCloud();
}

/* ── Craft ALL : craft autant de fois que possible pour un brawler + recette ── */
function crafterTout(brawlerId, recette) {
  const kSrc = cle(brawlerId, recette.depuis);
  let nbCraft = 0;

  while (true) {
    const qty = etat.inventaire[kSrc] || 0;
    const equipes = etat.petsEquipes.filter(p =>
      p && p.brawler.id === brawlerId && p.variante === recette.depuis).length;
    const disponibles = qty - equipes;
    if (disponibles < recette.qte) break;

    etat.inventaire[kSrc] -= recette.qte;
    if (etat.inventaire[kSrc] === 0) delete etat.inventaire[kSrc];

    const kDst = cle(brawlerId, recette.vers);
    etat.inventaire[kDst] = (etat.inventaire[kDst] || 0) + 1;

    progresserQuete('craft', { variante: recette.vers });
    nbCraft++;
  }

  if (nbCraft === 0) return;

  Sound.craft();
  flashCraftAll(recette, nbCraft);
  afficherInventaire();
  afficherCraft();
  mettreAJourCompteurs();
  sauvegarderEtatCloud();
}

function flashCraft(recette) {
  _afficherNotifCraft(`✨ Craft réussi ! ${recette.label.split('→')[1].trim()} obtenu`, recette.couleur);
}

function flashCraftAll(recette, nb) {
  _afficherNotifCraft(`✨ Craft ×${nb} ! ${nb} ${recette.label.split('→')[1].trim()} obtenus`, recette.couleur);
}

function _afficherNotifCraft(message, couleur) {
  const notif = document.createElement('div');
  notif.className = 'craft-notif';
  notif.style.cssText = `
    position:fixed; top:80px; left:50%; transform:translateX(-50%);
    background:var(--bg-card); border:1px solid ${couleur};
    color:${couleur}; font-weight:900; font-size:.9rem;
    padding:.6rem 1.4rem; border-radius:12px; z-index:999;
    box-shadow:0 0 20px ${couleur}55;
    animation: craftIn .4s cubic-bezier(.22,.68,0,1.2) forwards;
  `;
  notif.textContent = message;
  document.body.appendChild(notif);
  setTimeout(() => notif.remove(), 2200);
}

function afficherCraft() {
  const container = document.getElementById('craftList');
  if (!container) return;
  container.innerHTML = '';

  for (const recette of CRAFT_RECETTES) {
    const eligible = BRAWLERS.map(b => {
      const k   = cle(b.id, recette.depuis);
      const qty = etat.inventaire[k] || 0;
      const equipes = etat.petsEquipes.filter(p =>
        p && p.brawler.id === b.id && p.variante === recette.depuis).length;
      return { b, disponible: qty - equipes, total: qty };
    }).filter(({ total }) => total > 0);

    if (eligible.length === 0) continue;

    // Titre de la recette + bouton "Craft ALL (recette)"
    const titreWrapper = document.createElement('div');
    titreWrapper.style.cssText = `display:flex;align-items:center;justify-content:space-between;
      margin-top:.5rem;padding:.25rem 0;border-bottom:1px solid ${recette.couleur}33`;

    const titre = document.createElement('span');
    titre.style.cssText = `color:${recette.couleur};font-size:.7rem;font-weight:900;
      text-transform:uppercase;letter-spacing:.1em`;
    titre.textContent = recette.label;

    // Combien peut-on crafter en tout pour cette recette ?
    const totalCraftable = eligible.reduce((sum, { disponible }) =>
      sum + Math.floor(Math.max(0, disponible) / recette.qte), 0);

    const btnAllRecette = document.createElement('button');
    btnAllRecette.style.cssText = `
      padding:.2rem .6rem;border-radius:6px;font-size:.62rem;font-weight:800;
      border:1px solid ${totalCraftable > 0 ? recette.couleur : 'var(--border)'};
      background:${totalCraftable > 0 ? recette.couleur + '22' : 'transparent'};
      color:${totalCraftable > 0 ? recette.couleur : 'var(--text-muted)'};
      cursor:${totalCraftable > 0 ? 'pointer' : 'not-allowed'};
      opacity:${totalCraftable > 0 ? '1' : '.45'}
    `;
    btnAllRecette.textContent = `Craft ALL (×${totalCraftable})`;
    btnAllRecette.disabled = totalCraftable === 0;
    if (totalCraftable > 0) {
      btnAllRecette.onclick = () => {
        // Craft ALL pour tous les brawlers éligibles à cette recette
        eligible.forEach(({ b }) => crafterTout(b.id, recette));
      };
    }

    titreWrapper.appendChild(titre);
    titreWrapper.appendChild(btnAllRecette);
    container.appendChild(titreWrapper);

    for (const { b, disponible, total } of eligible) {
      const nbMax = Math.floor(Math.max(0, disponible) / recette.qte);
      const peutCrafter = nbMax >= 1;

      const row = document.createElement('div');
      row.className = 'craft-row';
      row.style.cssText = `display:flex;align-items:center;justify-content:space-between;
        gap:.5rem;padding:.4rem .5rem;border-radius:8px;margin-top:.25rem;
        background:${peutCrafter ? recette.couleur + '12' : 'rgba(255,255,255,.03)'};
        border:1px solid ${peutCrafter ? recette.couleur + '44' : 'var(--border)'}`;

      const progressPct = Math.min(100, (disponible / recette.qte) * 100);
      const color = peutCrafter ? recette.couleur : 'var(--text-muted)';

      const recetteIdx = CRAFT_RECETTES.indexOf(recette);

      row.innerHTML = `
        <div style="flex:1;min-width:0">
          <div style="display:flex;align-items:center;gap:.35rem;margin-bottom:.2rem">
            ${brawlerImg(b, 'w-5 h-5')}
            <span style="font-size:.78rem;font-weight:700;color:${b.couleur}">${b.nom}</span>
          </div>
          <div style="height:4px;background:var(--border);border-radius:2px;overflow:hidden">
            <div style="height:100%;width:${progressPct}%;background:${recette.couleur};border-radius:2px;transition:width .3s"></div>
          </div>
          <div style="font-size:.65rem;color:${color};margin-top:.15rem">${disponible}/${recette.qte} disponibles</div>
        </div>
        <div style="display:flex;flex-direction:column;gap:.25rem;align-items:flex-end;flex-shrink:0">
          <button onclick="crafterVariante(${b.id}, CRAFT_RECETTES[${recetteIdx}])"
            style="padding:.3rem .65rem;border-radius:8px;font-size:.7rem;font-weight:800;
              border:1px solid ${peutCrafter ? recette.couleur : 'var(--border)'};
              background:${peutCrafter ? recette.couleur + '22' : 'transparent'};
              color:${peutCrafter ? recette.couleur : 'var(--text-muted)'};
              cursor:${peutCrafter ? 'pointer' : 'not-allowed'};
              opacity:${peutCrafter ? '1' : '.45'}"
            ${!peutCrafter ? 'disabled' : ''}>
            ×1
          </button>
          <button onclick="crafterTout(${b.id}, CRAFT_RECETTES[${recetteIdx}])"
            style="padding:.3rem .65rem;border-radius:8px;font-size:.7rem;font-weight:800;
              border:1px solid ${nbMax > 1 ? recette.couleur : 'var(--border)'};
              background:${nbMax > 1 ? recette.couleur + '33' : 'transparent'};
              color:${nbMax > 1 ? recette.couleur : 'var(--text-muted)'};
              cursor:${nbMax > 1 ? 'pointer' : 'not-allowed'};
              opacity:${nbMax > 1 ? '1' : '.45'}"
            ${nbMax <= 1 ? 'disabled' : ''}>
            ×${nbMax} (ALL)
          </button>
        </div>
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
