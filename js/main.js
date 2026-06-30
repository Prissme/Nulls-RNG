/* ════════════════════════════════════════════════
   main.js — Point d'entrée, initialisation
════════════════════════════════════════════════ */

(async function init() {
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

  // ── Chargement local-first ──
  // FIX "cloud déco" : on applique d'abord la sauvegarde locale (instantanée,
  // ne dépend d'aucun réseau), pour garantir que le joueur retrouve toujours
  // sa progression même si le cloud est indisponible. Le cloud, s'il répond,
  // écrasera ensuite avec une version plus à jour (cross-device).
  const localSave = (typeof chargerLocal === 'function') ? chargerLocal() : null;
  let tsReference = null;
  if (localSave) {
    appliquerEtatSauvegarde(localSave);
    tsReference = (typeof localSave.dernierTimestamp === 'number') ? localSave.dernierTimestamp : null;
  }

  ajusterSlotsPets();
  initAchievements();
  afficherInventaire();
  afficherHistorique();
  afficherTableRarites();
  afficherPets();
  afficherCraft();
  afficherPrestige();
  mettreAJourCompteurs();
  demarrerCPS();
  initialiserQuetes();

  const cloudTs = await initCloudSave();
  if (cloudTs) tsReference = cloudTs; // le cloud, si dispo, prime sur le local

  // FIX : redemarrerAutoRoll() n'était appelée que dans le chemin cloud
  // (chargerEtatCloud). Un joueur sans cloud (ou en attendant l'init cloud)
  // qui avait Auto-Roll actif à la fermeture ne le retrouvait jamais actif
  // au rechargement local. Idempotent si déjà relancé côté cloud.
  if (typeof redemarrerAutoRoll === 'function') redemarrerAutoRoll();

  // ── Progression hors-ligne (rolls + farm) ──
  // Calculée une seule fois ici, après avoir déterminé la sauvegarde la plus
  // à jour (locale ou cloud), pour éviter tout double-comptage.
  if (typeof enregistrerDernierTimestamp === 'function') enregistrerDernierTimestamp(tsReference);
  if (typeof calculerProgressionHorsLigne === 'function') {
    const resultatHorsLigne = calculerProgressionHorsLigne();
    if (resultatHorsLigne && typeof afficherResumeHorsLigne === 'function') {
      afficherResumeHorsLigne(resultatHorsLigne);
    }
  }

  // Protection anti-exploit console (inventaire, pièces)
  // Appelé après le chargement pour que l'inventaire soit prêt avant d'installer le Proxy
  setTimeout(initProtectionInventaire, 1500);
  // Protection rate-limit sur effectuerRoll() (bloque les boucles console)
  // Appelé légèrement après pour laisser roll.js poser window.effectuerRoll
  setTimeout(initProtectionRoll, 1600);
  demarrerHugeWished();

  // Sauvegarde locale continue (filet de sécurité indépendant du cloud)
  if (typeof demarrerSauvegardeLocale === 'function') demarrerSauvegardeLocale();
})();
