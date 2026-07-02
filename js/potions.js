/* ════════════════════════════════════════════════
   potions.js — Achat, timers et effets des potions
════════════════════════════════════════════════ */

/* Lit et borne la quantité choisie dans le champ de la boutique (1 par défaut) */
function _quantitePotionChoisie() {
  const input = document.getElementById('potionQtyInput');
  const val   = input ? parseInt(input.value, 10) : 1;
  if (!Number.isFinite(val)) return 1;
  return Math.min(99, Math.max(1, val));
}

/* Met à jour l'affichage du prix total de chaque potion selon la quantité choisie */
function mettreAJourPrixPotions() {
  const input = document.getElementById('potionQtyInput');
  if (input) {
    // Normalise la valeur affichée (borne + entier) au fil de la saisie
    const qte = _quantitePotionChoisie();
    if (String(qte) !== input.value) input.value = qte;
  }
  const qte = _quantitePotionChoisie();
  document.querySelectorAll('.potion-price').forEach(el => {
    const potion = POTIONS[el.dataset.type];
    if (!potion) return;
    el.textContent = (potion.cout * qte).toLocaleString('fr-FR');
  });
}

function acheterPotion(type) {
  const potion = POTIONS[type];
  const qte    = _quantitePotionChoisie();
  const devise = potion.devise || 'pieces';
  const coutTotal = potion.cout * qte;

  if (etat[devise] < coutTotal) {
    secouerBouton(`buy${type.charAt(0).toUpperCase()}${type.slice(1)}Btn`);
    Sound.error();
    return;
  }

  etat[devise]     -= coutTotal;
  etat.totalPotions += qte;
  Sound.coin();

  const activeProp = `${type}Active`;
  const finProp     = `${type}Fin`;
  // FIX barre de progression : l'ancien code utilisait toujours potion.duree
  // (durée d'UNE seule dose) comme dénominateur du %, même quand on rachète
  // une potion déjà active (dejaActive) et que etat[finProp] est repoussé de
  // plusieurs doses d'un coup. Résultat : la barre restait bloquée à 100%
  // pendant un long moment avant de bouger. On garde ici la durée TOTALE
  // réellement cumulée pour ce timer, utilisée par demarrerTimer() ci-dessous.
  const dureeTotaleProp = `${type}DureeTotale`;
  const dejaActive  = etat[activeProp];
  const dureeTotale = potion.duree * qte;

  if (dejaActive) {
    etat[finProp] += dureeTotale;
    etat[dureeTotaleProp] = (etat[dureeTotaleProp] || potion.duree) + dureeTotale;
  } else {
    etat[activeProp] = true;
    etat[finProp]    = Date.now() + dureeTotale;
    etat[dureeTotaleProp] = dureeTotale;
    if (type === 'speed' || type === 'wished') redemarrerAutoRoll();
  }

  progresserQuete('potion');
  if (type === 'luck') progresserQuete('potionLuck');

  if (!dejaActive) demarrerTimer(type);

  mettreAJourCompteurs();
  afficherTableRarites();
  sauvegarderEtatCloud();
}

/* Affiche/masque le titre du panneau "Effets actifs" (sidebar) selon
   qu'au moins une potion est active — évite un panneau vide flottant. */
function _fxPanelSync() {
  const title = document.getElementById('fxPanelTitle');
  if (!title) return;
  const actif = document.querySelector('.fx-card:not(.hidden)');
  title.style.display = actif ? '' : 'none';
}

/* Timers de potions — met à jour TOUTES les zones qui affichent l'effet
   (chip du header, carte boutique, panneau "Effets actifs" latéral) via
   des sélecteurs data-* au lieu d'un id unique, pour rester synchronisées
   partout où l'effet est représenté à l'écran. */
function demarrerTimer(type) {
  const potion = POTIONS[type];

  const barWraps = document.querySelectorAll(`[data-potion-barwrap="${type}"]`);
  const bars     = document.querySelectorAll(`[data-potion-bar="${type}"]`);
  const cds      = document.querySelectorAll(`[data-potion-countdown="${type}"]`);
  const hdrs     = document.querySelectorAll(`[data-potion-hdr="${type}"]`);

  barWraps.forEach(el => el.classList.remove('hidden'));
  cds.forEach(el => el.classList.remove('hidden'));
  _fxPanelSync();

  const prop = `${type}Interval`;
  clearInterval(etat[prop]);

  etat[prop] = setInterval(() => {
    const finProp = `${type}Fin`;
    const restant = Math.max(0, etat[finProp] - Date.now());
    // FIX : durée totale cumulée (multi-doses), pas potion.duree fixe —
    // sinon la barre reste bloquée à 100% tant que restant > potion.duree.
    // Repli sur potion.duree si absent (ex: état restauré depuis une
    // ancienne sauvegarde cloud sans ce champ).
    const dureeRef = etat[`${type}DureeTotale`] || potion.duree;
    const pct     = Math.min(100, (restant / dureeRef) * 100);
    const secs    = Math.ceil(restant / 1000);

    bars.forEach(bar => { bar.style.width = pct + '%'; });
    cds.forEach(cd => { cd.textContent = `⏳ ${secs}s`; });
    hdrs.forEach(hdr => {
      hdr.textContent = `${secs}s`;
      hdr.classList.remove('hidden');
    });

    if (restant <= 0) {
      clearInterval(etat[prop]);
      etat[`${type}Active`] = false;
      etat[`${type}DureeTotale`] = 0;
      if (type === 'speed' || type === 'wished') redemarrerAutoRoll();

      barWraps.forEach(el => el.classList.add('hidden'));
      cds.forEach(el => el.classList.add('hidden'));
      hdrs.forEach(el => el.classList.add('hidden'));
      _fxPanelSync();

      mettreAJourCompteurs();
      afficherTableRarites();
    }
  }, 250);
}
