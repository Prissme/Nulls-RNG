/* ════════════════════════════════════════════════
   prestige.js — Renaissance : reset + bonus permanents
   À chaque Renaissance : pièces, inventaire, pets équipés
   et niveau sont remis à zéro contre des Cristaux,
   une monnaie permanente qui achète des bonus définitifs.
════════════════════════════════════════════════ */

const PRESTIGE_NIVEAU_MIN = 10; // niveau minimum requis pour pouvoir renaître

const PRESTIGE_UPGRADES = [
  {
    id: 'luck', nom: 'Luck Éternelle', icone: '✨', couleur: '#a855f7',
    desc: '+5% de Luck permanent par niveau',
    maxNiveau: 20, coutBase: 3, coutFacteur: 1.35,
  },
  {
    id: 'cps', nom: 'Productivité', icone: '💰', couleur: '#fbbf24',
    desc: '+10% de pièces/s permanent par niveau',
    maxNiveau: 15, coutBase: 4, coutFacteur: 1.4,
  },
  {
    id: 'vente', nom: 'Sens du Commerce', icone: '🏷️', couleur: '#22c55e',
    desc: '+10% de valeur de vente permanent par niveau',
    maxNiveau: 10, coutBase: 3, coutFacteur: 1.4,
  },
  {
    id: 'slot', nom: 'Emplacement Bonus', icone: '🐾', couleur: '#38bdf8',
    desc: '+1 slot de pet équipable (permanent)',
    maxNiveau: 2, coutBase: 15, coutFacteur: 3,
  },
  {
    id: 'vitesse', nom: 'Vélocité', icone: '⚡', couleur: '#ec4899',
    desc: '-5% délai Auto-Roll permanent par niveau',
    maxNiveau: 10, coutBase: 5, coutFacteur: 1.45,
  },
];

/* ── Coût du prochain niveau d'une amélioration (null = déjà au max) ── */
function coutUpgradePrestige(up) {
  const niveau = etat.prestigeUpgrades[up.id] || 0;
  if (niveau >= up.maxNiveau) return null;
  return Math.round(up.coutBase * Math.pow(up.coutFacteur, niveau));
}

/* ── Cristaux qu'on obtiendrait en renaissant maintenant ── */
function cristauxPotentiels() {
  return Math.max(0, Math.floor(totalCPS() * 0.5 + etat.niveau * 2));
}

function peutPrestige() {
  return etat.niveau >= PRESTIGE_NIVEAU_MIN;
}

/* ── Acheter un niveau d'amélioration permanente ── */
function acheterUpgradePrestige(id) {
  const up = PRESTIGE_UPGRADES.find(u => u.id === id);
  if (!up) return;

  const cout = coutUpgradePrestige(up);
  if (cout === null) return; // déjà au niveau max

  if (etat.cristaux < cout) {
    Sound.error();
    return;
  }

  etat.cristaux -= cout;
  etat.prestigeUpgrades[id] = (etat.prestigeUpgrades[id] || 0) + 1;

  if (id === 'slot')    ajusterSlotsPets();
  if (id === 'vitesse') redemarrerAutoRoll();

  Sound.craft();
  afficherPrestige();
  afficherPets();
  afficherInventaire();
  mettreAJourCompteurs();
  sauvegarderEtatCloud();
}

/* ── Confirmation avant reset (action destructive) ── */
function confirmerRenaissance() {
  if (!peutPrestige()) return;
  const gain = cristauxPotentiels();
  const ok = window.confirm(
    `Renaître va réinitialiser tes pièces, ton inventaire, tes pets équipés et ton niveau.\n\n` +
    `Tu recevras +${gain} cristaux permanents (tes améliorations achetées restent acquises).\n\n` +
    `Confirmer la Renaissance ?`
  );
  if (ok) lancerRenaissance();
}

/* ── Exécute la Renaissance ── */
function lancerRenaissance() {
  if (!peutPrestige()) return;
  const gain = cristauxPotentiels();

  // Stoppe un combat en cours, le cas échéant
  if (typeof combat !== 'undefined') combat = null;

  // Coupe les timers de potions actives
  clearInterval(etat.luckInterval);
  clearInterval(etat.speedInterval);
  clearInterval(etat.shinyInterval);
  etat.luckActive  = false;
  etat.speedActive = false;
  etat.shinyActive = false;
  ['luck', 'speed', 'shiny'].forEach(type => {
    document.getElementById(`${type}BarWrap`)?.classList.add('hidden');
    document.getElementById(`${type}Countdown`)?.classList.add('hidden');
    document.getElementById(`${type}TimerHdr`)?.classList.add('hidden');
  });

  // Reset de la progression d'un "run" (les stats lifetime et les bonus de prestige restent)
  etat.pieces      = 0;
  etat.inventaire  = {};
  etat.petsEquipes = new Array(nbSlotsMax()).fill(null);
  etat.historique  = [];
  etat.niveau      = 1;
  etat.xp          = 0;

  etat.prestige += 1;
  etat.cristaux += gain;

  initialiserQuetes();
  afficherInventaire();
  afficherHistorique();
  afficherTableRarites();
  afficherPets();
  afficherCraft();
  mettreAJourCompteurs();
  afficherPrestige();
  redemarrerAutoRoll();

  Sound.levelUp();
  afficherRenaissanceNotif(gain);
  sauvegarderEtatCloud();
}

/* ── Notification flash ── */
function afficherRenaissanceNotif(gain) {
  const notif = document.createElement('div');
  notif.style.cssText = `
    position:fixed; top:140px; left:50%; transform:translateX(-50%);
    background:var(--bg-card); border:1px solid #e879f9;
    color:#e879f9; font-weight:900; font-size:1rem; text-align:center;
    padding:.7rem 1.6rem; border-radius:14px; z-index:999;
    box-shadow:0 0 24px rgba(232,121,249,.5);
    animation: craftIn .4s cubic-bezier(.22,.68,0,1.2) forwards;
  `;
  notif.innerHTML = `🔮 Renaissance #${etat.prestige}<br><span style="font-size:.8rem">+${gain} cristaux</span>`;
  document.body.appendChild(notif);
  setTimeout(() => notif.remove(), 2400);
}

/* ── Rendu de la modale Prestige ── */
function afficherPrestige() {
  const zone = document.getElementById('prestigeZone');

  const gain     = cristauxPotentiels();
  const eligible = peutPrestige();

  // Badge dans la barre d'outils : signale que la Renaissance est disponible
  const badge = document.getElementById('prestigeBadge');
  if (badge) {
    if (eligible) { badge.textContent = '!'; badge.classList.remove('hidden'); }
    else badge.classList.add('hidden');
  }

  if (!zone) return;

  zone.innerHTML = `
    <div class="rounded-lg p-3 mb-3" style="background:rgba(192,38,211,.08);border:1px solid rgba(192,38,211,.3)">
      <div class="text-sm font-bold" style="color:#e879f9">🔮 Renaissance #${etat.prestige}</div>
      <div class="text-xs mt-1" style="color:var(--text-muted)">
        ${eligible
          ? `Renaître réinitialise pièces, inventaire, pets équipés et niveau — mais tes améliorations permanentes ci-dessous restent acquises pour toujours.`
          : `Atteins le niveau ${PRESTIGE_NIVEAU_MIN} pour débloquer la Renaissance (niveau actuel : ${etat.niveau}).`}
      </div>
      <button id="btnRenaissance" class="prestige-btn" onclick="confirmerRenaissance()"
        style="width:100%;margin-top:.6rem;padding:.6rem 0;border-radius:12px;font-weight:900;
          font-size:.85rem;letter-spacing:.02em;border:none;color:#fff;
          background:linear-gradient(135deg,#a855f7,#e879f9);
          box-shadow:0 0 14px rgba(232,121,249,.35);
          cursor:${eligible ? 'pointer' : 'not-allowed'};opacity:${eligible ? '1' : '.4'}"
        ${!eligible ? 'disabled' : ''}>
        🔮 Renaître (+${gain} cristaux)
      </button>
    </div>

    <div class="flex items-center justify-between mb-2">
      <span class="text-xs font-bold" style="color:var(--text-muted);text-transform:uppercase;letter-spacing:.05em">
        Améliorations permanentes
      </span>
      <span class="text-xs font-bold flex items-center gap-1" style="color:#e879f9">
        🔮 ${etat.cristaux}
      </span>
    </div>
    <div id="prestigeUpgradesList" class="flex flex-col gap-2"></div>
  `;

  const list = document.getElementById('prestigeUpgradesList');
  for (const up of PRESTIGE_UPGRADES) {
    const niveau = etat.prestigeUpgrades[up.id] || 0;
    const cout   = coutUpgradePrestige(up);
    const maxed  = cout === null;
    const peut   = !maxed && etat.cristaux >= cout;

    const row = document.createElement('div');
    row.style.cssText = `display:flex;align-items:center;justify-content:space-between;gap:.5rem;
      padding:.55rem .65rem;border-radius:10px;
      background:${maxed ? 'rgba(255,255,255,.03)' : peut ? up.couleur + '12' : 'var(--bg-panel)'};
      border:1px solid ${maxed ? 'var(--border)' : peut ? up.couleur + '44' : 'var(--border)'}`;

    row.innerHTML = `
      <div style="flex:1;min-width:0">
        <div style="display:flex;align-items:center;gap:.4rem;flex-wrap:wrap">
          <span style="font-size:1rem">${up.icone}</span>
          <span style="font-size:.78rem;font-weight:800;color:${maxed ? 'var(--text-muted)' : up.couleur}">${up.nom}</span>
          <span style="font-size:.62rem;color:var(--text-muted)">Niv. ${niveau}/${up.maxNiveau}</span>
        </div>
        <div style="font-size:.66rem;color:var(--text-muted);margin-top:.15rem">${up.desc}</div>
      </div>
      <button onclick="acheterUpgradePrestige('${up.id}')"
        style="flex-shrink:0;padding:.35rem .7rem;border-radius:8px;font-size:.7rem;font-weight:800;
          border:1px solid ${peut ? up.couleur : 'var(--border)'};
          background:${peut ? up.couleur + '22' : 'transparent'};
          color:${peut ? up.couleur : 'var(--text-muted)'};
          cursor:${peut ? 'pointer' : 'not-allowed'};opacity:${peut ? '1' : '.5'}"
        ${!peut ? 'disabled' : ''}>
        ${maxed ? 'MAX' : `${cout} 🔮`}
      </button>
    `;
    list.appendChild(row);
  }
}
