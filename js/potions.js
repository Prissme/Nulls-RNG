/* ════════════════════════════════════════════════
   potions.js — Achat, timers et effets des potions
════════════════════════════════════════════════ */

function acheterPotion(type) {
  const potion = POTIONS[type];
  if (etat.pieces < potion.cout) {
    secouerBouton(`buy${type.charAt(0).toUpperCase()}${type.slice(1)}Btn`);
    Sound.error();
    return;
  }

  etat.pieces -= potion.cout;
  etat.totalPotions++;
  Sound.coin();

  const activeProp = `${type}Active`;
  const finProp     = `${type}Fin`;
  const dejaActive  = etat[activeProp];

  if (dejaActive) {
    etat[finProp] += potion.duree;
  } else {
    etat[activeProp] = true;
    etat[finProp]    = Date.now() + potion.duree;
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
