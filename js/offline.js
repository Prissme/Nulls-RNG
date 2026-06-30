/* ════════════════════════════════════════════════
   offline.js — Progression hors-ligne
   (rolls + CPS générés pendant l'absence du joueur)
════════════════════════════════════════════════ */

/* ── Sécurité ──
   Le timestamp de référence est gardé dans une variable privée de
   closure (jamais sur `etat`, qui est un objet global librement
   inspectable/modifiable). Un script console ne peut donc pas faire
   `etat.dernierTimestamp = 0` puis réclamer 12h de gains hors-ligne :
   il n'a tout simplement pas accès à la valeur utilisée pour le calcul.
   De plus, calculerProgressionHorsLigne() réinitialise immédiatement la
   référence à "maintenant" dès son premier appel : un second appel
   (même déclenché manuellement depuis la console) ne rapporte rien. */
(function () {

  const OFFLINE = {
    GAIN_MIN_MS: 60 * 1000,            // sous 1 min d'absence, on ignore (évite le spam au refresh)
    PLAFOND_MS:  12 * 60 * 60 * 1000,  // 12h d'absence max prises en compte
    EFFICACITE:  0.7,                  // 70% d'efficacité hors-ligne (incite à revenir jouer)
    MAX_ROLLS:   6000,                 // garde-fou dur même avec Wished/Naël/Speed cumulés
  };

  let _dernierTimestamp = null;

  /* Tirage simplifié pour la simulation hors-ligne : mêmes probabilités
     de base que effectuerTirage() dans roll.js, sans les états temporaires
     "garanti Shiny/Golden" (potions qui ont de toute façon expiré au retour
     dans l'immense majorité des cas, et qu'on ne veut pas pouvoir abuser
     en partant juste après les avoir activées). */
  function _tirageHorsLigne(luckMult) {
    for (const vKey of ORDRE_VARIANTES) {
      const v = VARIANTES[vKey];
      for (const b of [...BRAWLERS].sort((a, b2) => a.div - b2.div)) {
        const chanceBase      = 1 / b.div;
        const chanceEffective = (chanceBase * luckMult) / v.chanceMult;
        if (Math.random() < chanceEffective) {
          return { brawler: b, variante: vKey };
        }
      }
    }
    return { brawler: BRAWLERS[0], variante: 'normal' };
  }

  /* Appelée une fois au chargement (local ou cloud) avec le timestamp
     de la dernière sauvegarde connue. */
  function enregistrerDernierTimestamp(ts) {
    _dernierTimestamp = (typeof ts === 'number' && ts > 0 && ts <= Date.now()) ? ts : null;
  }

  /* Calcule et applique la progression hors-ligne. Idempotent : un appel
     répété ne rapporte rien (voir note sécurité plus haut). */
  function calculerProgressionHorsLigne() {
    const dernierTimestamp = _dernierTimestamp;
    _dernierTimestamp = Date.now();
    if (!dernierTimestamp) return null;

    let elapsedMs = Date.now() - dernierTimestamp;
    if (elapsedMs < OFFLINE.GAIN_MIN_MS) return null;
    elapsedMs = Math.min(elapsedMs, OFFLINE.PLAFOND_MS);
    const elapsedSec = elapsedMs / 1000;

    let gainPieces = 0;
    let nbRolls    = 0;
    const obtenus  = {}; // clé inventaire -> nombre obtenu hors-ligne

    /* ── Farm hors-ligne : CPS des pets équipés ── */
    const cps = (typeof totalCPS === 'function') ? totalCPS() : 0;
    if (cps > 0) gainPieces += Math.round(cps * elapsedSec * OFFLINE.EFFICACITE);

    /* ── Rolls hors-ligne : uniquement si l'Auto-Roll était actif au départ ── */
    if (etat.autoRollActif) {
      const delaiBase     = Math.max(80, Math.round(1000 * vitesseAutoMult()));
      const delaiEffectif = Math.round(delaiBase / OFFLINE.EFFICACITE); // ralenti hors-ligne
      nbRolls = Math.min(Math.floor(elapsedMs / delaiEffectif), OFFLINE.MAX_ROLLS);

      if (nbRolls > 0) {
        const luckMult = luckMultiplierTotal();
        for (let i = 0; i < nbRolls; i++) {
          const { brawler, variante } = _tirageHorsLigne(luckMult);
          const k = cle(brawler.id, variante);
          obtenus[k] = (obtenus[k] || 0) + 1;
        }
        // Une seule mutation groupée (passe par le Proxy anti-exploit comme un roll normal)
        _invMutation(() => {
          Object.entries(obtenus).forEach(([k, n]) => {
            etat.inventaire[k] = (etat.inventaire[k] || 0) + n;
          });
        });
        etat.totalRolls += nbRolls;
      }
    }

    if (gainPieces > 0) etat.pieces += gainPieces;
    if (gainPieces === 0 && nbRolls === 0) return null;

    return { elapsedMs, gainPieces, nbRolls, obtenus };
  }

  function _formatDuree(ms) {
    const h = Math.floor(ms / 3600000);
    const m = Math.floor((ms % 3600000) / 60000);
    return h > 0 ? `${h}h ${m}min` : `${m}min`;
  }

  /* Affiche un petit récapitulatif + rafraîchit l'UI concernée. */
  function afficherResumeHorsLigne(res) {
    if (!res) return;

    if (typeof afficherInventaire   === 'function') afficherInventaire();
    if (typeof afficherHistorique   === 'function') afficherHistorique();
    if (typeof afficherCraft        === 'function') afficherCraft();
    if (typeof mettreAJourCompteurs === 'function') mettreAJourCompteurs();

    const nbVariantes = Object.keys(res.obtenus).length;
    const id = 'offlineRecapOverlay';
    document.getElementById(id)?.remove();

    const overlay = document.createElement('div');
    overlay.id = id;
    overlay.style.cssText = `
      position:fixed;inset:0;z-index:9998;
      background:rgba(0,0,0,.75);
      display:flex;align-items:center;justify-content:center;
      font-family:var(--font-mono,monospace);
    `;
    overlay.innerHTML = `
      <div style="background:#15151f;border:1px solid rgba(168,85,247,.4);border-radius:18px;
        padding:1.6rem 1.8rem;max-width:320px;width:90%;text-align:center;
        box-shadow:0 0 40px rgba(168,85,247,.25);">
        <div style="font-size:2rem;">🌙</div>
        <div style="color:#e9d5ff;font-weight:900;font-size:1.05rem;margin:.4rem 0 .8rem;">Bon retour !</div>
        <div style="color:#94a3b8;font-size:.78rem;margin-bottom:1rem;">
          Pendant ton absence (${_formatDuree(res.elapsedMs)}) :
        </div>
        <div style="display:flex;flex-direction:column;gap:.4rem;margin-bottom:1.2rem;">
          ${res.gainPieces > 0 ? `<div style="color:#facc15;font-weight:800;">+${res.gainPieces.toLocaleString('fr-FR')} 🪙</div>` : ''}
          ${res.nbRolls    > 0 ? `<div style="color:#a855f7;font-weight:800;">+${res.nbRolls.toLocaleString('fr-FR')} rolls (${nbVariantes} variantes)</div>` : ''}
        </div>
        <button onclick="document.getElementById('${id}').remove()"
          style="padding:.6rem 1.6rem;border-radius:10px;border:none;
            background:linear-gradient(135deg,#a855f7,#6d28d9);color:#fff;
            font-weight:800;font-size:.85rem;cursor:pointer;">
          Cool !
        </button>
      </div>
    `;
    document.body.appendChild(overlay);
  }

  window.enregistrerDernierTimestamp  = enregistrerDernierTimestamp;
  window.calculerProgressionHorsLigne = calculerProgressionHorsLigne;
  window.afficherResumeHorsLigne      = afficherResumeHorsLigne;

})();
