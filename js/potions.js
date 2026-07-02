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
  const devise = potion.devise === 'cristaux' ? 'cristaux' : 'pieces';
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
  const dejaActive  = etat[activeProp];
  const dureeTotale = potion.duree * qte;

  if (dejaActive) {
    etat[finProp] += dureeTotale;
  } else {
    etat[activeProp] = true;
    etat[finProp]    = Date.now() + dureeTotale;
    if (type === 'speed' || type === 'wished') redemarrerAutoRoll();
  }

  progresserQuete('potion');
  if (type === 'luck') progresserQuete('potionLuck');

  if (!dejaActive) demarrerTimer(type);

  mettreAJourCompteurs();
  afficherTableRarites();
  sauvegarderEtatCloud();
}

function demarrerTimer(type) {
  const potion  = POTIONS[type];
  const duree   = potion.duree;

  const barWrap = document.getElementById(`${type}BarWrap`);
  const bar     = document.getElementById(`${type}Bar`);
  const cd      = document.getElementById(`${type}Countdown`);
  const hdr     = document.getElementById(`${type}TimerHdr`);

  barWrap.classList.remove('hidden');
  cd.classList.remove('hidden');

  const prop = `${type}Interval`;
  clearInterval(etat[prop]);

  etat[prop] = setInterval(() => {
    const finProp = `${type}Fin`;
    const restant = Math.max(0, etat[finProp] - Date.now());
    const pct     = Math.min(100, (restant / duree) * 100);
    const secs    = Math.ceil(restant / 1000);

    bar.style.width = pct + '%';
    cd.textContent  = `⏳ ${secs}s`;
    if (hdr) {
      hdr.textContent = `${secs}s`;
      hdr.classList.remove('hidden');
    }

    if (restant <= 0) {
      clearInterval(etat[prop]);
      etat[`${type}Active`] = false;
      if (type === 'speed' || type === 'wished') redemarrerAutoRoll();

      barWrap.classList.add('hidden');
      cd.classList.add('hidden');
      if (hdr) hdr.classList.add('hidden');

      mettreAJourCompteurs();
      afficherTableRarites();
    }
  }, 250);
}
