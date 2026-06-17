/* ════════════════════════════════════════════════
   main.js — Point d'entrée, initialisation
════════════════════════════════════════════════ */

(function init() {
  const style = document.createElement('style');
  style.textContent = `
    @keyframes shake {
      0%,100% { transform:translateX(0); }
      20%     { transform:translateX(-6px); }
      40%     { transform:translateX(6px); }
      60%     { transform:translateX(-4px); }
      80%     { transform:translateX(4px); }
    }
    @keyframes craftIn {
      0%   { opacity:0; transform:translateX(-50%) scale(.7) translateY(-10px); }
      60%  { opacity:1; transform:translateX(-50%) scale(1.05) translateY(2px); }
      100% { opacity:1; transform:translateX(-50%) scale(1) translateY(0); }
    }
  `;
  document.head.appendChild(style);

  afficherInventaire();
  afficherHistorique();
  afficherTableRarites();
  afficherPets();
  afficherCraft();
  mettreAJourCompteurs();
  demarrerCPS();
  initialiserQuetes();
  initCloudSave();
})();
