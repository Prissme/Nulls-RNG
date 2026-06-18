/* ════════════════════════════════════════════════
   potions.js — Achat, timers et effets des potions
   Les potions peuvent être achetées plusieurs fois :
   si une potion du même type est déjà active, le temps
   restant s'additionne (stack) au lieu de bloquer l'achat.
════════════════════════════════════════════════ */

function acheterPotion(type) {
  const potion = POTIONS[type];
  if (etat.pieces < potion.cout) { secouerBouton(`buy${type === 'luck' ? 'Luck' : 'Speed'}Btn`); return; }

  etat.pieces -= potion.cout;
  etat.totalPotions++;

  const activeProp = `${type}Active`;
  const finProp     = `${type}Fin`;
  const dejaActive  = etat[activeProp];

  if (dejaActive) {
    // Déjà active → on empile la durée sur le temps restant
    etat[finProp] += potion.duree;
  } else {
    etat[activeProp] = true;
    etat[finProp]    = Date.now() + potion.duree;
    if (type === 'speed') redemarrerAutoRoll();
  }

  // Progression quêtes
  progresserQuete('potion');
  if (type === 'luck') progresserQuete('potionLuck');

  if (!dejaActive) demarrerTimer(type);
  // Si déjà active, le setInterval en cours relira automatiquement
  // la nouvelle valeur de etat[finProp] au prochain tick (250ms).

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
  // Le bouton d'achat reste actif : on peut racheter une potion pour
  // empiler du temps supplémentaire pendant qu'elle est déjà active.

  const prop = `${type}Interval`;
  clearInterval(etat[prop]);

  etat[prop] = setInterval(() => {
    const finProp = `${type}Fin`;
    const restant = Math.max(0, etat[finProp] - Date.now());
    // La barre peut dépasser 100% temporairement si on vient d'empiler
    // une potion ; on la cap visuellement à 100% pour rester propre.
    const pct     = Math.min(100, (restant / duree) * 100);
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
      mettreAJourCompteurs();
      afficherTableRarites();
    }
  }, 250);
}
