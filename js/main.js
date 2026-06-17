/* ════════════════════════════════════════════════
   main.js — Point d'entrée, initialisation
════════════════════════════════════════════════ */

(function init() {
  // Injecter l'animation shake dynamiquement
  const style = document.createElement('style');
  style.textContent = `
    @keyframes shake {
      0%,100% { transform:translateX(0); }
      20%     { transform:translateX(-6px); }
      40%     { transform:translateX(6px); }
      60%     { transform:translateX(-4px); }
      80%     { transform:translateX(4px); }
    }`;
  document.head.appendChild(style);

  // Premier rendu
  afficherInventaire();
  afficherHistorique();
  afficherTableRarites();
  afficherPets();
  mettreAJourCompteurs();
  demarrerCPS();
})();
