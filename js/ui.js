/* ════════════════════════════════════════════════
   ui.js — Rendu UI : résultat, pets, compteurs,
           table raretés, historique, utilitaires
════════════════════════════════════════════════ */

// Fonction utilitaire pour générer l'image de la pièce uniformément
function coinImg(classes = 'w-5 h-5') {
  return `<img src="./images/Coins.webp" alt="Coins" class="${classes} object-contain inline-block align-middle" onerror="this.style.display='none'">`;
}

/* ── Zone résultat après un roll ── */
function afficherResultat(b, vKey) {
  const v     = VARIANTES[vKey];
  const zone  = document.getElementById('resultZone');
  const emoji = document.getElementById('resultEmoji');
  const name  = document.getElementById('resultName');
  const sub   = document.getElementById('resultSub');

  zone.classList.remove('flash-anim');
  void zone.offsetWidth;
  zone.classList.add('flash-anim');

  // Image au lieu de l'emoji
  emoji.innerHTML = brawlerImg(b, 'w-24 h-24');

  if (vKey === 'rainbow') {
    name.className   = 'rainbow-text';
    name.style.color = '';
    name.textContent = `🌈 ${b.nom}`;
  } else {
    name.className   = '';
    name.style.color = couleurVariante(b, vKey);
    name.textContent = vKey !== 'normal' ? `${v.emoji} ${b.nom}` : b.nom;
  }

  // Badge de rareté + stats
  const rarityHtml = rarityBadge(b.rarity);
  const probaVal   = (b.div * v.chanceMult).toLocaleString('fr-FR');
  sub.innerHTML = `
    <span style="display:flex;align-items:center;justify-content:center;gap:.4rem;flex-wrap:wrap;margin-bottom:.25rem">
      ${rarityHtml}
      ${vKey !== 'normal' ? `<span style="font-size:.7rem;color:${couleurVariante(b, vKey)}">${v.label}</span>` : ''}
    </span>
    <span style="font-family:var(--font-mono);font-weight:700;color:#5eead4;font-size:.78rem">🎲 1/${probaVal}</span>
    &nbsp;•&nbsp;
    <span style="color:#fbbf24;font-size:.75rem">${Math.round(calcCPS(b, vKey) * 10) / 10} ${coinImg('w-5 h-5')}/s</span>
  `;

  const glowColor = couleurVariante(b, vKey);
  zone.style.filter = `drop-shadow(0 0 ${vKey !== 'normal' ? 22 : 10}px ${glowColor})`;
}

/* ── Slots pets équipés ── */
function afficherPets() {
  const container = document.getElementById('petSlots');
  const maxSlots   = nbSlotsMax();
  container.innerHTML = '';
  container.style.gridTemplateColumns = `repeat(${Math.min(maxSlots, 3)}, 1fr)`;

  for (let i = 0; i < maxSlots; i++) {
    const pet  = etat.petsEquipes[i];
    const slot = document.createElement('div');
    slot.className = `pet-slot ${pet ? 'filled' : ''}`;

    if (pet) {
      const v     = VARIANTES[pet.variante];
      const color = couleurVariante(pet.brawler, pet.variante);
      slot.style.borderColor = color;
      slot.style.background  = `${color}12`;
      slot.innerHTML = `
        <span class="unequip-x" onclick="desequiper(${i})">✕</span>
        ${brawlerImg(pet.brawler, 'w-12 h-12')}
        <span class="text-xs font-bold" style="color:${color}">${pet.brawler.nom}</span>
        <span style="margin-top:.1rem">${rarityBadge(pet.brawler.rarity)}</span>
        <span style="font-family:var(--font-mono);font-size:.58rem;font-weight:700;color:#5eead4">🎲 1/${(pet.brawler.div * VARIANTES[pet.variante].chanceMult).toLocaleString('fr-FR')}</span>
        <span class="text-xs flex items-center justify-center gap-1" style="color:#fbbf24">+${Math.round(calcCPS(pet.brawler, pet.variante) * 10) / 10} ${coinImg('w-5 h-5')}/s</span>
        ${pet.variante !== 'normal'
          ? `<span class="text-xs" style="color:${color}">${v.emoji} ${v.label}</span>`
          : ''}
      `;
    } else {
      slot.innerHTML = `<span class="text-xs" style="color:var(--text-muted)">Slot ${i + 1}<br>vide</span>`;
    }

    container.appendChild(slot);
  }

  document.getElementById('totalCPS').textContent = totalCPS();
  document.getElementById('cpsVal').textContent   = totalCPS();
}

/* ── Compteurs header ── */
function mettreAJourCompteurs() {
  document.getElementById('coinsDisplay').textContent = etat.pieces.toLocaleString('fr-FR');
  document.getElementById('rollsDisplay').textContent = etat.totalRolls.toLocaleString('fr-FR');
  document.getElementById('luckLabel').textContent    = `x${Number(luckMultiplierTotal().toFixed(2))}`;
  document.getElementById('speedLabel').textContent   = etat.speedActive ? 'x3' : 'x1';
  document.getElementById('cpsVal').textContent       = totalCPS();
  document.getElementById('totalCPS').textContent     = totalCPS();

  const cristauxEl = document.getElementById('cristauxDisplay');
  if (cristauxEl) cristauxEl.textContent = etat.cristaux.toLocaleString('fr-FR');

  const xpRequis = xpRequisPourNiveau(etat.niveau);
  const pct      = Math.min(100, (etat.xp / xpRequis) * 100);
  document.getElementById('levelLabel').textContent = `Niv. ${etat.niveau}`;
  document.getElementById('xpLabel').textContent     = `${etat.xp}/${xpRequis} XP`;
  document.getElementById('xpBar').style.width        = pct + '%';
}

/* ── Notification de passage de niveau ── */
function afficherLevelUp(niveau) {
  const notif = document.createElement('div');
  notif.style.cssText = `
    position:fixed; top:140px; left:50%; transform:translateX(-50%);
    background:var(--bg-card); border:1px solid #fbbf24;
    color:#fbbf24; font-weight:900; font-size:1rem;
    padding:.7rem 1.6rem; border-radius:14px; z-index:999;
    box-shadow:0 0 24px rgba(251,191,36,.5);
    animation: craftIn .4s cubic-bezier(.22,.68,0,1.2) forwards;
  `;
  notif.textContent = `🏆 Niveau ${niveau} atteint !`;
  document.body.appendChild(notif);
  setTimeout(() => notif.remove(), 2200);
}

/* ── Table des raretés ── */
function afficherTableRarites() {
  const tbl = document.getElementById('rarityTable');
  const lm  = luckMultiplierTotal();

  const groupOrder = ['super-rare', 'rare', 'common'];

  const fmtProba = (div, chanceMult) => {
    const effective = Math.round((div * chanceMult) / lm);
    if (effective >= 10000) return `1/${Math.round(effective / 1000)}k`;
    if (effective <= 0) return '1/1';
    return `1/${effective}`;
  };

  const VAR_CFG = [
    { key: 'normal',  label: 'Normal',  color: '#94a3b8' },
    { key: 'shiny',   label: 'Shiny',   color: '#38bdf8' },
    { key: 'golden',  label: 'Golden',  color: '#fbbf24' },
    { key: 'rainbow', label: 'Rainbow', color: '#e879f9' },
  ];

  let html = '';

  for (const rarityKey of groupOrder) {
    const r     = RARITIES[rarityKey];
    const group = [...BRAWLERS].filter(b => b.rarity === rarityKey).reverse();
    if (!group.length) continue;

    html += `
      <div style="margin-bottom:.75rem">
        <div style="font-size:.62rem;font-weight:900;text-transform:uppercase;letter-spacing:.08em;
          color:${r.couleur};padding:.2rem 0 .4rem;border-bottom:1px solid ${r.borderCss};margin-bottom:.4rem">
          ${r.label}
        </div>
        <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(72px,1fr));gap:.4rem">
    `;

    for (const b of group) {
      const cpsN = Math.round(calcCPS(b, 'normal') * 10) / 10;
      // Trouver la meilleure variante possédée pour highlight
      const bestVar = VAR_CFG.slice().reverse().find(vc =>
        (etat.inventaire[cle(b.id, vc.key)] || 0) >= 1
      );
      const borderCol = bestVar ? bestVar.color : r.borderCss;

      html += `
        <div style="border-radius:10px;border:1px solid ${borderCol}55;
          background:${r.bgCss};padding:.4rem .35rem;
          display:flex;flex-direction:column;align-items:center;gap:.2rem;text-align:center">
          ${brawlerImg(b, 'w-9 h-9')}
          <span style="font-size:.6rem;font-weight:800;color:${r.couleur};line-height:1.2">${b.nom}</span>
          <div style="display:flex;flex-direction:column;gap:.1rem;width:100%">
      `;

      for (const vc of VAR_CFG) {
        const v   = VARIANTES[vc.key];
        const cps = Math.round(calcCPS(b, vc.key) * 10) / 10;
        html += `
          <div style="display:flex;justify-content:space-between;align-items:center;
            padding:.08rem .25rem;border-radius:4px;background:rgba(0,0,0,.25)">
            <span style="font-size:.52rem;font-weight:700;color:${vc.color}">${vc.label[0]}</span>
            <span style="font-size:.52rem;font-family:var(--font-mono);color:#94a3b8">${fmtProba(b.div, v.chanceMult)}</span>
            <span style="font-size:.5rem;color:#fbbf24">${cps}/s</span>
          </div>
        `;
      }

      html += `</div></div>`;
    }

    html += `</div></div>`;
  }

  tbl.innerHTML = html;
}

/* ── Historique des derniers rolls ── */
function afficherHistorique() {
  const list = document.getElementById('historyList');
  list.innerHTML = '';

  if (!etat.historique.length) {
    list.innerHTML = `<span class="text-xs" style="color:var(--text-muted)">Aucun roll pour l'instant.</span>`;
    return;
  }

  for (const { brawler, variante } of etat.historique) {
    const v     = VARIANTES[variante];
    const color = couleurVariante(brawler, variante);
    const chip  = document.createElement('span');
    chip.className = 'text-xs font-bold px-2 py-1 rounded-full';
    chip.style.cssText = `background:rgba(0,0,0,.4);border:1px solid ${color}55;color:${color};
      display:inline-flex;align-items:center;gap:.3rem`;
    chip.innerHTML = `${brawlerImg(brawler, 'w-5 h-5')}${v.emoji} ${brawler.nom}`;
    list.appendChild(chip);
  }
}

/* ── Animation secouement bouton (erreur achat) ── */
function secouerBouton(id) {
  const btn = document.getElementById(id);
  if (!btn) return;
  btn.style.animation = 'none';
  void btn.offsetWidth;
  btn.style.animation = 'shake .3s ease';
}
