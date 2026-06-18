/* ════════════════════════════════════════════════
   combat.js — Système de Combat (à venir)
   Pour l'instant : placeholder affichant la puissance
   de combat du joueur (= CPS total des pets équipés).
   Les récompenses prévues seront pièces + XP.
════════════════════════════════════════════════ */

function afficherCombat() {
  const el = document.getElementById('combatPower');
  if (el) el.textContent = totalCPS();
}
