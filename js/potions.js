/* ════════════════════════════════════════════════
   potions.js — Achat, timers et effets des potions
════════════════════════════════════════════════ */

function acheterPotion(type) {
  const potion = POTIONS[type];
  if (etat.pieces < potion.cout)        { secouerBouton(`buy${type === 'luck' ? 'Luck' : 'Speed'}Btn`); return; }
  if (type === 'luck'  && etat.luckActive)  return;
  if (type === 'speed' && etat.speedActive) return;

  etat.pieces -= potion.cout;
  etat.totalPotions++;

  if (type === 'luck') {
    etat.luckActive = true;
    etat.luckFin    = Date.now() + potion.duree;
  } else {
    etat.speedActive = true;
    etat.speedFin    = Date.now() + potion.duree;
    redemarrerAutoRoll();
  }

  // Progression quêtes
  progresserQuete('potion');
  if (type === 'luck') progresserQuete('potionLuck');

  demarrerTimer(type);
  mettreAJourCompteurs();
  afficherTableRarites();
}

function demarrerTimer(type) {
  const potion  = POTIONS[type];
  const duree   = potion.duree;
  const capType = type === 'luck' ? 'Luck' : 'Speed';

  const barWrap = document.getElementById(`${type}BarWrap`);
  const bar     = document.getElementById(`${type}Bar`);
  const cd      = document.getElementById(`${type}Countdown`);
  const btn     = document.getElementById(`buy${capType}Btn`);
  const hdr     = document.getElementById(`${type}TimerHdr`);

  barWrap.classList.remove('hidden');
  cd.classList.remove('hidden');
  btn.disabled      = true;
  btn.style.opacity = '0.4';

  const prop = `${type}Interval`;
  clearInterval(etat[prop]);

  etat[prop] = setInterval(() => {
    const finProp = `${type}Fin`;
    const restant = Math.max(0, etat[finProp] - Date.now());
    const pct     = (restant / duree) * 100;
    const secs    = Math.ceil(restant / 1000);

    bar.style.width = pct + '%';
    cd.textContent  = `⏳ ${secs}s`;
    hdr.textContent = `${secs}s`;
    hdr.classList.remove('hidden');

    if (restant <= 0) {
      clearInterval(etat[prop]);
      if (type === 'luck') {
        etat.luckActive = false;
      } else {
        etat.speedActive = false;
        redemarrerAutoRoll();
      }
      barWrap.classList.add('hidden');
      cd.classList.add('hidden');
      hdr.classList.add('hidden');
      btn.disabled      = false;
      btn.style.opacity = '1';
      mettreAJourCompteurs();
      afficherTableRarites();
    }
  }, 250);
}
