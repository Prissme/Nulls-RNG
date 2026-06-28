/* ════════════════════════════════════════════════
   discord.js — Détection Lucky Pull + Animation +
                Notification Discord via proxy serveur
════════════════════════════════════════════════ */

/* ── Récupère le score de rareté le plus élevé déjà possédé ── */
function getMeilleurScoreRareteInventaire(excludeKey) {
  let best = 0;
  for (const [k, count] of Object.entries(etat.inventaire)) {
    if (k === excludeKey) continue;
    if (!count || count < 1) continue;
    const { brawlerId, variante } = parseKey(k);
    const b = BRAWLERS.find(x => x.id === brawlerId);
    const v = VARIANTES[variante];
    if (!b || !v) continue;
    const score = b.div * v.chanceMult;
    if (score > best) best = score;
  }
  return best;
}

/* ── Vérifie si ce tirage mérite une animation Lucky Pull ── */
function estLuckyPull(brawler, variante, inventaireAvant) {
  const v     = VARIANTES[variante];
  const k     = cle(brawler.id, variante);
  const score = brawler.div * v.chanceMult;

  // Cas 1 : jamais obtenu auparavant
  const jamaisObtenu = !inventaireAvant[k] || inventaireAvant[k] === 0;
  if (jamaisObtenu) return true;

  // Cas 2 : plus rare que tout ce qu'on avait déjà
  const meilleurScore = getMeilleurScoreRareteInventaire(k);
  if (score > meilleurScore) return true;

  return false;
}

/* ══════════════════════════════════════════════
   ANIMATION LUCKY PULL
══════════════════════════════════════════════ */
function afficherAnimationLuckyPull(brawler, variante) {
  const existant = document.getElementById('luckyPullOverlay');
  if (existant) existant.remove();

  const v         = VARIANTES[variante];
  const color     = couleurVariante(brawler, variante);
  const isRainbow = variante === 'rainbow';

  const overlay = document.createElement('div');
  overlay.id    = 'luckyPullOverlay';
  overlay.innerHTML = `
    <style>
      #luckyPullOverlay {
        position: fixed; inset: 0; z-index: 9999;
        display: flex; align-items: center; justify-content: center; flex-direction: column;
        background: rgba(0,0,0,0.78);
        animation: lpFadeIn .25s ease; cursor: pointer;
      }
      @keyframes lpFadeIn  { from { opacity:0 } to { opacity:1 } }
      @keyframes lpFadeOut { from { opacity:1 } to { opacity:0 } }
      #lpCard {
        background: linear-gradient(145deg, rgba(255,255,255,.06), rgba(255,255,255,.02));
        border: 2px solid ${isRainbow ? 'transparent' : color};
        ${isRainbow ? 'border-image: linear-gradient(90deg,#f472b6,#818cf8,#38bdf8,#34d399,#fbbf24) 1;' : ''}
        border-radius: 20px; padding: 2.5rem 3rem;
        display: flex; flex-direction: column; align-items: center; gap: 1rem;
        box-shadow: 0 0 60px ${color}55, 0 0 120px ${color}22;
        animation: lpCardIn .45s cubic-bezier(.22,1,.36,1);
        position: relative; overflow: hidden;
        max-width: 340px; width: 90vw; text-align: center;
      }
      @keyframes lpCardIn {
        from { transform: scale(.6) translateY(40px); opacity:0 }
        to   { transform: scale(1)  translateY(0);    opacity:1 }
      }
      #lpCard::before {
        content: ''; position: absolute; inset: -50%;
        background: conic-gradient(from 0deg, ${color}00, ${color}18, ${color}00);
        animation: lpRotate 3s linear infinite; border-radius: 50%;
      }
      @keyframes lpRotate { to { transform: rotate(360deg); } }
      #lpStars { position: absolute; inset: 0; pointer-events: none; overflow: hidden; }
      .lpStar {
        position: absolute; width: 4px; height: 4px; border-radius: 50%;
        background: ${color}; animation: lpStarFloat linear infinite; opacity: 0;
      }
      @keyframes lpStarFloat {
        0%   { transform: translateY(0) scale(0); opacity:0 }
        10%  { opacity: 1 }
        90%  { opacity: .6 }
        100% { transform: translateY(-160px) scale(1.5); opacity:0 }
      }
      #lpBadge {
        font-size: .65rem; font-weight: 900; text-transform: uppercase;
        letter-spacing: .12em; padding: .3rem .8rem; border-radius: 999px;
        background: ${color}22; border: 1px solid ${color}66; color: ${color};
        position: relative; z-index: 1;
      }
      #lpTitle {
        font-size: 1.5rem; font-weight: 900; letter-spacing: .03em;
        position: relative; z-index: 1;
        ${isRainbow
          ? 'background:linear-gradient(90deg,#f472b6,#818cf8,#38bdf8,#34d399,#fbbf24);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;'
          : `color:${color};`}
      }
      #lpImg {
        width: 110px; height: 110px; object-fit: contain;
        position: relative; z-index: 1;
        filter: drop-shadow(0 0 18px ${color});
        animation: lpImgPulse 1.4s ease-in-out infinite alternate;
      }
      @keyframes lpImgPulse {
        from { filter: drop-shadow(0 0 12px ${color}99); transform: scale(.97) }
        to   { filter: drop-shadow(0 0 28px ${color});   transform: scale(1.03) }
      }
      #lpSub { font-size: .85rem; color: #94a3b8; position: relative; z-index: 1; line-height: 1.5; }
      #lpClose { font-size: .72rem; color: #64748b; position: relative; z-index: 1; margin-top: .5rem; }
    </style>

    <div id="lpCard">
      <div id="lpStars"></div>
      <div id="lpBadge">✦ Lucky Pull !</div>
      <div id="lpTitle">${isRainbow ? '🌈' : v.emoji} ${brawler.nom}</div>
      <img id="lpImg"
        src="${brawler.img}" alt="${brawler.nom}"
        onerror="this.style.display='none';this.insertAdjacentHTML('afterend','<span style=font-size:3rem>${brawler.emoji}</span>')"
      />
      <div id="lpSub">
        ${rarityBadge(brawler.rarity)}
        ${variante !== 'normal' ? `<br><span style="color:${color}">${v.label}</span>` : ''}
        <br>Probabilité : 1/${(brawler.div * v.chanceMult).toLocaleString('fr-FR')}
      </div>
      <div id="lpClose">Appuie n'importe où pour fermer</div>
    </div>
  `;

  const starsEl = overlay.querySelector('#lpStars');
  for (let i = 0; i < 18; i++) {
    const star = document.createElement('div');
    star.className = 'lpStar';
    star.style.left              = `${Math.random() * 100}%`;
    star.style.bottom            = `${Math.random() * 20}%`;
    star.style.animationDuration = `${1.2 + Math.random() * 1.8}s`;
    star.style.animationDelay    = `${Math.random() * 2}s`;
    star.style.width = star.style.height = `${2 + Math.random() * 4}px`;
    starsEl.appendChild(star);
  }

  overlay.addEventListener('click', () => {
    overlay.style.animation = 'lpFadeOut .3s ease forwards';
    setTimeout(() => overlay.remove(), 300);
  });

  document.body.appendChild(overlay);
}

/* ══════════════════════════════════════════════
   NOTIFICATION DISCORD  (via proxy /api/discord)
══════════════════════════════════════════════ */
async function envoyerNotifDiscord(brawler, variante, username) {
  const v        = VARIANTES[variante];
  const color    = couleurVariante(brawler, variante);
  const colorInt = parseInt(color.replace('#', ''), 16);
  const pseudo   = username || 'Un joueur';

  const payload = {
    embeds: [{
      title: `✦ Lucky Pull — ${v.emoji ? v.emoji + ' ' : ''}${brawler.nom}`,
      description: `**${pseudo}** vient d'obtenir un brawler exceptionnel !`,
      color: colorInt,
      fields: [
        { name: 'Brawler',     value: `${brawler.emoji} ${brawler.nom}`,                          inline: true },
        { name: 'Variante',    value: v.label,                                                     inline: true },
        { name: 'Rareté',      value: RARITIES[brawler.rarity]?.label || brawler.rarity,           inline: true },
        { name: 'Probabilité', value: `1 / ${(brawler.div * v.chanceMult).toLocaleString('fr-FR')}`, inline: true },
      ],
      footer:    { text: "Null's RNG • Lucky Pull" },
      timestamp: new Date().toISOString(),
    }]
  };

  try {
    const res = await fetch('/api/discord', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(payload),
    });
    if (!res.ok) {
      const txt = await res.text();
      console.warn('[discord] Réponse non-OK :', res.status, txt);
    }
  } catch (err) {
    console.warn('[discord] Échec envoi notification :', err);
  }
}

/* ── Point d'entrée appelé depuis roll.js ── */
function gererLuckyPull(brawler, variante, inventaireAvant) {
  if (!estLuckyPull(brawler, variante, inventaireAvant)) return;

  afficherAnimationLuckyPull(brawler, variante);

  const username = localStorage.getItem('nrng_username')
    || (typeof etat !== 'undefined' && etat.username)
    || null;

  envoyerNotifDiscord(brawler, variante, username || null);
}
