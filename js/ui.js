/* ════════════════════════════════════════════════
   ui.js — Rendu UI : résultat, pets, compteurs,
           table raretés, historique, utilitaires
════════════════════════════════════════════════ */

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

  emoji.textContent = b.emoji;

  if (vKey === 'rainbow') {
    name.className   = 'rainbow-text';
    name.style.color = '';
    name.textContent = `🌈 ${b.nom}`;
  } else {
    name.className   = '';
    name.style.color = couleurVariante(b, vKey);
    name.textContent = `${v.emoji} ${b.nom}`.trim();
  }

  sub.textContent = `${vKey !== 'normal' ? v.label + ' • ' : ''}1/${b.div * v.chanceMult}  •  ${calcCPS(b, vKey)} 💰/s`;

  const glowColor = couleurVariante(b, vKey);
  zone.style.filter = `drop-shadow(0 0 ${vKey !== 'normal' ? 22 : 10}px ${glowColor})`;
}

/* ── Slots pets équipés ── */
function afficherPets() {
  const container = document.getElementById('petSlots');
  container.innerHTML = '';

  for (let i = 0; i < 3; i++) {
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
        <span class="text-2xl">${pet.brawler.emoji}</span>
        <span class="text-xs font-bold" style="color:${color}">${pet.brawler.nom}</span>
        <span class="text-xs" style="color:#fbbf24">+${calcCPS(pet.brawler, pet.variante)}💰/s</span>
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
  document.getElementById('luckLabel').textContent    = etat.luckActive  ? 'x2' : 'x1';
  document.getElementById('speedLabel').textContent   = etat.speedActive ? 'x3' : 'x1';
  document.getElementById('cpsVal').textContent       = totalCPS();
  document.getElementById('totalCPS').textContent     = totalCPS();
}

/* ── Table des raretés (colonne gauche) ── */
function afficherTableRarites() {
  const tbl = document.getElementById('rarityTable');
  const lm  = etat.luckActive ? 2 : 1;

  tbl.innerHTML = [...BRAWLERS].reverse().map(b => {
    const base = b.div;
    const mod  = lm > 1
      ? `<span style="color:#a855f7;font-weight:700"> → 1/${Math.round(base / lm)}</span>`
      : '';
    return `
      <div class="flex items-center justify-between gap-2 py-1"
           style="border-bottom:1px solid var(--border)">
        <span>${b.emoji} <span style="color:${b.couleur};font-weight:700">${b.nom}</span></span>
        <span style="color:var(--text-muted)">1/${base}${mod}</span>
      </div>`;
  }).join('');
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
    chip.style.cssText = `background:rgba(0,0,0,.4);border:1px solid ${color}55;color:${color}`;
    chip.textContent   = `${brawler.emoji}${v.emoji} ${brawler.nom}`;
    list.appendChild(chip);
  }
}

/* ── Animation secouement bouton (erreur achat) ── */
function secouerBouton(id) {
  const btn = document.getElementById(id);
  btn.style.animation = 'none';
  void btn.offsetWidth;
  btn.style.animation = 'shake .3s ease';
}
