/* ════════════════════════════════════════════════
   ui.js — Rendu UI : résultat, pets, compteurs,
           table raretés, historique, utilitaires
════════════════════════════════════════════════ */

// Fonction utilitaire pour générer l'image de la pièce uniformément
function coinImg(classes = 'w-5 h-5') {
  return `<img src="./images/Coins.webp" alt="Coins" class="${classes} object-contain inline-block align-middle" onerror="this.style.display='none'">`;
}

// Icône cristal (remplace l'ancien emoji 🔮 partout où la monnaie "cristaux" est affichée)
function crystalImg(classes = 'w-4 h-4') {
  return `<img src="./images/Crystal.webp" alt="Cristal" class="${classes} object-contain inline-block align-middle" onerror="this.outerHTML='🔮'">`;
}

// Icône gemme (monnaie obtenue via quêtes, combats et vente de brawlers)
function gemmeImg(classes = 'w-4 h-4') {
  return `<img src="./images/Gemme.webp" alt="Gemme" class="${classes} object-contain inline-block align-middle" onerror="this.outerHTML='💎'">`;
}

// Icônes des potions Chance / Vitesse (fallback emoji si l'image n'est pas encore présente)
function potionLuckImg(classes = 'w-4 h-4') {
  return `<img src="./images/PotionLuck.webp" alt="Potion Chance" class="${classes} object-contain inline-block align-middle" onerror="this.outerHTML='🍀'">`;
}
function potionSpeedImg(classes = 'w-4 h-4') {
  return `<img src="./images/PotionSpeed.webp" alt="Potion Vitesse" class="${classes} object-contain inline-block align-middle" onerror="this.outerHTML='⚡'">`;
}

/* ── Zone résultat après un roll ── */
/* FIX "écran qui tremble" : un simple throttle à 90ms ne suffisait pas —
   à 25ms/roll (vélocité max + Wished/Naël), l'animation flashIn (scale +
   translateY, 450ms) se rejouait quand même 10+ fois/seconde, ce qui donne
   visuellement l'impression que toute la zone tremble en continu. En plus,
   `void zone.offsetWidth` force un reflow synchrone à chaque replay, ce qui
   alourdit le thread principal pendant l'auto-roll rapide (et contribuait
   aux faux positifs de l'anticheat sur les gros bursts).

   Au-delà de FLASH_ANIM_VITESSE_SEUIL_MS entre deux rolls, on ne rejoue
   plus l'animation DU TOUT : à ce rythme, personne ne peut de toute façon
   distinguer les pop-in individuels. Le contenu (image/nom du brawler)
   continue lui à se mettre à jour à chaque roll, normalement — seul le
   replay du scale/translate est coupé. */
const FLASH_ANIM_VITESSE_SEUIL_MS = 150;
let _dernierRollTs  = 0;

function afficherResultat(b, vKey) {
  const v     = VARIANTES[vKey];
  const zone  = document.getElementById('resultZone');
  const emoji = document.getElementById('resultEmoji');
  const name  = document.getElementById('resultName');
  const sub   = document.getElementById('resultSub');

  const maintenant   = Date.now();
  const ecartRoll    = _dernierRollTs > 0 ? maintenant - _dernierRollTs : Infinity;
  _dernierRollTs      = maintenant;

  // Auto-roll rapide (< 150ms entre deux rolls) → pas de replay d'animation,
  // seul le contenu se met à jour, pour éviter l'effet de tremblement.
  if (ecartRoll >= FLASH_ANIM_VITESSE_SEUIL_MS) {
    zone.classList.remove('flash-anim');
    void zone.offsetWidth;
    zone.classList.add('flash-anim');
  }

  // Image au lieu de l'emoji
  emoji.innerHTML = brawlerImg(b, 'w-24 h-24', vKey === 'monochrome' ? 'filter:grayscale(1) contrast(1.15)' : '', vKey);

  if (vKey === 'monochrome') {
    name.className   = 'monochrome-text';
    name.style.color = '';
    name.textContent = `◐ ${b.nom}`;
  } else if (vKey === 'rainbow') {
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
    <span style="display:flex;align-items:center;justify-content:center;gap:.4rem;flex-wrap:nowrap;white-space:nowrap;margin-bottom:.25rem">
      ${rarityHtml}
      ${vKey !== 'normal' ? `<span style="font-size:.7rem;color:${couleurVariante(b, vKey)};white-space:nowrap">${v.label}</span>` : ''}
    </span>
    <span style="font-family:var(--font-mono);font-weight:700;color:#5eead4;font-size:.78rem;white-space:nowrap">🎲 1/${probaVal}</span>
    &nbsp;•&nbsp;
    <span style="color:#fbbf24;font-size:.75rem;white-space:nowrap">${Math.round(calcCPS(b, vKey) * 10) / 10} ${coinImg('w-5 h-5')}/s</span>
  `;

  const glowColor = couleurVariante(b, vKey);
  zone.style.filter = `drop-shadow(0 0 ${vKey !== 'normal' ? 22 : 10}px ${glowColor})`;
}

/* ── Petit indicateur Multi-Drop ──
   Juste un mini visuel du brawler bonus + "x2!" collé au coin de l'image
   de résultat — pas de carte, pas de fond, rien au milieu de l'écran.
   Discret et bref (disparaît de lui-même, ou dès le prochain roll qui
   réécrit #resultEmoji). */
function afficherBadgeMultiDrop(b2, v2) {
  const emoji = document.getElementById('resultEmoji');
  if (!emoji) return;
  emoji.style.position = 'relative';

  const badge = document.createElement('span');
  badge.style.cssText = `position:absolute;bottom:-2px;right:-14px;display:inline-flex;
    align-items:center;gap:.15rem;pointer-events:none;z-index:2`;
  badge.innerHTML = `${brawlerImg(b2, 'w-6 h-6', '', v2)}<span style="font-size:.68rem;font-weight:800;color:#f97316">x2!</span>`;
  emoji.appendChild(badge);
  setTimeout(() => badge.remove(), 1200);
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
      slot.style.cursor      = 'pointer';
      slot.title             = `Voir les skills de ${pet.brawler.nom}`;
      slot.onclick = (e) => {
        // Ignorer le clic si c'est sur le bouton ✕
        if (e.target.classList.contains('unequip-x')) return;
        ouvrirSkillTreeBrawler(pet.brawler.id, pet.variante);
      };
      slot.innerHTML = `
        <span class="unequip-x" onclick="desequiper(${i})">✕</span>
        ${brawlerImg(pet.brawler, 'w-12 h-12', '', pet.variante)}
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

/* ── Multiplicateur de vitesse affiché dans le header ──
   FIX "badge de vitesse trompeur" : l'ancien code faisait
   `etat.speedActive ? 'x3' : 'x1'`, appelé en permanence par
   mettreAJourCompteurs() — donc dès qu'un roll/achat/etc. déclenchait un
   refresh des compteurs, ce badge écrasait n'importe quel affichage
   correct posé ailleurs (ex: par hugewished.js) et retombait à x1 même
   si Wished (×6.7) ou le bonus permanent Naël (×2) étaient actifs.
   On calcule ici le VRAI multiplicateur cumulé, cohérent avec la logique
   réelle de redemarrerAutoRoll()/redemarrerAutoRollHW() dans autoroll.js. */
function multiplicateurVitesseActuel() {
  let mult = 1;
  if (typeof hwBoostActif !== 'undefined' && hwBoostActif) {
    mult *= HUGEWISHED.BOOST_MULT;
  } else if (etat.wishedActive) {
    mult *= POTIONS.wished.speedMult;
  } else if (etat.speedActive) {
    mult *= 3;
  }
  if (etat.naellSpeedUnlocked) mult *= 2;
  return mult;
}

/* ── Compteurs header ── */
function mettreAJourCompteurs() {
  document.getElementById('coinsDisplay').textContent = etat.pieces.toLocaleString('fr-FR');
  document.getElementById('rollsDisplay').textContent = etat.totalRolls.toLocaleString('fr-FR');
  document.getElementById('luckLabel').textContent    = `x${Number(luckMultiplierTotal().toFixed(2))}`;
  const vitesseMult = multiplicateurVitesseActuel();
  document.getElementById('speedLabel').textContent   = `x${Number.isInteger(vitesseMult) ? vitesseMult : vitesseMult.toFixed(1)}`;
  document.getElementById('cpsVal').textContent       = totalCPS();
  document.getElementById('totalCPS').textContent     = totalCPS();

  const cristauxEl = document.getElementById('cristauxDisplay');
  if (cristauxEl) cristauxEl.textContent = etat.cristaux.toLocaleString('fr-FR');

  const gemmesEl = document.getElementById('gemmesDisplay');
  if (gemmesEl) gemmesEl.textContent = (etat.gemmes || 0).toLocaleString('fr-FR');

  /* ── Points de Pouvoir ── */
  const ppEl = document.getElementById('ppDisplay');
  if (ppEl) ppEl.textContent = (etat.pointsPouvoir || 0).toLocaleString('fr-FR');

  /* ── Badge Pouvoirs si PP > 0 non dépensés ── */
  const skillBadge = document.getElementById('skillTreeBadge');
  if (skillBadge) {
    const pp = etat.pointsPouvoir || 0;
    const hasUnlockable = typeof SKILL_TREE !== 'undefined' && SKILL_TREE.some(sk => {
      return !sk.requis.every ? true : (sk.requis.every(r => !!(etat.skillsAchetes && etat.skillsAchetes[r])) &&
        !(etat.skillsAchetes && etat.skillsAchetes[sk.id]) && pp >= sk.cout);
    });
    skillBadge.style.display = (pp > 0 && hasUnlockable) ? 'block' : 'none';
  }

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

  const groupOrder = ['epic', 'super-rare', 'rare', 'common'];

  // FIX table des probabilités : le calcul ne tenait compte que de
  // luckMultiplierTotal(), pas de luckrollChance() (le bonus prestige
  // "Roulette Bénie" qui convertit après-coup une partie des tirages
  // 'normal' en 'shiny' — voir roll.js). Les odds Normal affichées étaient
  // donc légèrement surestimées et les odds Shiny légèrement sous-estimées
  // pour qui a investi dans cette amélioration. On corrige uniquement ces
  // deux variantes, les autres (golden/rainbow/monochrome) n'étant pas
  // concernées par cette conversion post-tirage.
  const lr = typeof luckrollChance === 'function' ? luckrollChance() : 0;

  const fmtProba = (div, chanceMult, varKey) => {
    let p = lm / (div * chanceMult); // probabilité brute du tirage (voir roll.js: chanceEffective)
    if (lr > 0 && (varKey === 'normal' || varKey === 'shiny')) {
      const pNormalBrut = lm / (div * VARIANTES.normal.chanceMult);
      if (varKey === 'normal') p = pNormalBrut * (1 - lr);
      else                     p = p + pNormalBrut * lr;
    }
    const effective = Math.round(1 / p);
    if (effective >= 10000) return `1/${Math.round(effective / 1000)}k`;
    if (effective <= 0) return '1/1';
    return `1/${effective}`;
  };

  const VAR_CFG = [
    { key: 'normal',     label: 'Normal',     color: '#94a3b8' },
    { key: 'shiny',      label: 'Shiny',      color: '#38bdf8' },
    { key: 'golden',     label: 'Golden',     color: '#fbbf24' },
    { key: 'rainbow',    label: 'Rainbow',    color: '#e879f9' },
    { key: 'monochrome', label: 'Monochrome', color: '#f8fafc' },
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
            <span style="font-size:.52rem;font-family:var(--font-mono);color:#94a3b8">${fmtProba(b.div, v.chanceMult, vc.key)}</span>
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

  // Centre les chips tant qu'ils tiennent tous sur la ligne ; dès que ça
  // déborde, on repasse en alignement gauche pour un défilement horizontal
  // naturel (la hauteur de .history-strip, elle, ne bouge jamais).
  list.style.justifyContent = list.scrollWidth > list.clientWidth ? 'flex-start' : 'center';
}

/* ── Animation secouement bouton (erreur achat) ── */
function secouerBouton(id) {
  const btn = document.getElementById(id);
  if (!btn) return;
  btn.style.animation = 'none';
  void btn.offsetWidth;
  btn.style.animation = 'shake .3s ease';
}
