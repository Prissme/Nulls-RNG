/* ════════════════════════════════════════════════
   cloudsave.js — Sauvegarde cloud (Supabase)
════════════════════════════════════════════════ */

let sb              = null;
let cloudUserId     = null;
let cloudAutoSaveId = null;

/* ── Le cloud save est-il configuré ? ── */
function cloudConfigure() {
  return !!(window.supabase && window.SUPABASE_URL && window.SUPABASE_ANON_KEY);
}

/* ── Badge de statut (header) ── */
function setCloudStatus(text, color) {
  const chip = document.getElementById('cloudStatusChip');
  const txt  = document.getElementById('cloudStatusText');
  if (!chip || !txt) return;
  chip.style.display     = 'flex';
  chip.style.borderColor = `${color}66`;
  txt.textContent = text;
  txt.style.color = color;
}

/* ── Initialisation : connexion anonyme + chargement ──
   Retourne le timestamp de la sauvegarde cloud chargée (ou null si le
   cloud n'est pas configuré / pas de sauvegarde / échec). */
async function initCloudSave(_tentative, _localTs) {
  if (!cloudConfigure()) return null;
  const tentative = _tentative || 0;

  setCloudStatus(tentative === 0 ? '🔄 Connexion…' : `🔄 Reconnexion… (${tentative}/3)`, '#94a3b8');
  sb = window.supabase.createClient(window.SUPABASE_URL, window.SUPABASE_ANON_KEY);

  try {
    let { data: { session } } = await sb.auth.getSession();

    if (!session) {
      const { data, error } = await sb.auth.signInAnonymously();
      if (error) throw error;
      session = data.session;
    }
    cloudUserId = session.user.id;
    _cloudJWT   = session.access_token;

    // Garde le JWT à jour si Supabase rafraîchit la session en arrière-plan
    // (sinon la sauvegarde à la fermeture de l'onglet utiliserait un token expiré/invalide)
    sb.auth.onAuthStateChange((_event, newSession) => {
      if (newSession && newSession.access_token) _cloudJWT = newSession.access_token;
    });

    afficherTransferId(); // FIX: afficher l'UUID dès qu'il est disponible
    // FIX "perte de progression au reco" : on transmet le timestamp de la
    // sauvegarde locale déjà appliquée, pour que chargerEtatCloud() puisse
    // refuser d'écraser un état local plus récent avec une sauvegarde cloud
    // périmée (cloud en échec silencieux pendant la session précédente, etc.)
    const ts = await chargerEtatCloud(_localTs);
    setCloudStatus('☁️ Cloud actif', '#22c55e');
    demarrerAutoSaveCloud();
    return ts;
  } catch (err) {
    console.error(`[cloudsave] Échec initialisation (tentative ${tentative + 1}/4) :`, err);
    // FIX "cloud déco" : un échec transitoire (réseau lent, cold-start
    // Koyeb/Supabase — l'instance qui héberge Supabase peut se mettre en
    // veille et prendre plus de quelques secondes à se réveiller) ne doit
    // pas condamner le joueur à rester en mode local pour toute la session.
    // Backoff progressif sur 3 tentatives au lieu d'une seule (3s → 6s → 10s),
    // pour laisser le temps à une instance endormie de redémarrer.
    const delais = [3000, 6000, 10000];
    if (tentative < delais.length) {
      await new Promise(r => setTimeout(r, delais[tentative]));
      return initCloudSave(tentative + 1, _localTs);
    }
    setCloudStatus('⚠️ Cloud indisponible (mode local)', '#f87171');
    return null;
  }
}

/* ── Expose le client Supabase pour leaderboard.js ── */
function getCloudClient() {
  return sb;
}
function getCloudUserId() {
  return cloudUserId;
}

let _cloudJWT = null;
function getCloudJWT() {
  return _cloudJWT;
}

/* ── Sérialisation ── */
function serialiserEtat() {
  return {
    pieces:            etat.pieces,
    totalRolls:        etat.totalRolls,
    totalPotions:      etat.totalPotions,
    inventaire:        etat.inventaire,
    petsEquipes:       etat.petsEquipes.map(p => p ? { brawlerId: p.brawler.id, variante: p.variante } : null),
    niveau:            etat.niveau,
    xp:                etat.xp,
    quetes:               etat.quetes,
    quetesRefreshFin:     etat.quetesRefreshFin,
    quetesDiff:           etat.quetesDiff           || [],
    quetesDiffRefreshFin: etat.quetesDiffRefreshFin || 0,
    prestige:          etat.prestige,
    combatsGagnes:     etat.combatsGagnes  || 0,
    brawlerPP:         etat.brawlerPP      || {},
    brawlerSkills:     etat.brawlerSkills  || {},
    /* rétro-compat legacy */
    pointsPouvoir:     0,
    skillsAchetes:     {},
    cristaux:          etat.cristaux,
    prestigeUpgrades:  etat.prestigeUpgrades,
    achievements:      etat.achievements,
    shellyStreak:      etat.shellyStreak,
    robotsBattus:      etat.robotsBattus,
    indexUnlocks:      etat.indexUnlocks,
    /* ── Lucky Pull : mémoire permanente, ne doit jamais être reset ── */
    dejaObtenus:        etat.dejaObtenus     || {},
    meilleurScoreVu:     etat.meilleurScoreVu || 0,
    /* ── Potions : on sauvegarde le timestamp de fin pour restaurer au refresh ── */
    luckActive:   etat.luckActive,
    luckFin:      etat.luckFin,
    luckDureeTotale: etat.luckDureeTotale,
    speedActive:  etat.speedActive,
    speedFin:     etat.speedFin,
    speedDureeTotale: etat.speedDureeTotale,
    shinyActive:  etat.shinyActive,
    shinyFin:     etat.shinyFin,
    shinyDureeTotale: etat.shinyDureeTotale,
    wishedActive: etat.wishedActive,
    wishedFin:    etat.wishedFin,
    wishedDureeTotale: etat.wishedDureeTotale,
    goldenActive: etat.goldenActive,
    goldenFin:    etat.goldenFin,
    goldenDureeTotale: etat.goldenDureeTotale,
    richesseActive: etat.richesseActive,
    richesseFin:    etat.richesseFin,
    richesseDureeTotale: etat.richesseDureeTotale,
    /* ── Easter egg Naell ── */
    naellSpeedUnlocked: etat.naellSpeedUnlocked || false,

    /* FIX : autoRollActif n'était jamais sauvegardé, donc le calcul de
       progression hors-ligne ne déclenchait jamais les rolls (toujours
       considéré "off" au rechargement), seulement le gain de pièces (CPS). */
    autoRollActif: etat.autoRollActif || false,

    /* ── Horodatage de cette sauvegarde : sert au calcul de la
       progression hors-ligne au prochain chargement. ── */
    dernierTimestamp: Date.now(),
  };
}

/* ── Applique une sauvegarde chargée à l'état courant ── */
function appliquerEtatSauvegarde(saved) {
  if (!saved) return;

  if (typeof saved.pieces       === 'number') etat.pieces       = saved.pieces;
  if (typeof saved.totalRolls   === 'number') etat.totalRolls   = saved.totalRolls;
  if (typeof saved.totalPotions === 'number') etat.totalPotions = saved.totalPotions;
  if (saved.inventaire && typeof saved.inventaire === 'object') _invMutation(() => { etat.inventaire = saved.inventaire; });
  if (typeof saved.niveau === 'number') etat.niveau = saved.niveau;
  if (typeof saved.xp     === 'number') etat.xp     = saved.xp;
  if (Array.isArray(saved.quetes)) etat.quetes = saved.quetes;
  if (typeof saved.quetesRefreshFin === 'number') etat.quetesRefreshFin = saved.quetesRefreshFin;
  if (Array.isArray(saved.quetesDiff)) etat.quetesDiff = saved.quetesDiff;
  if (typeof saved.quetesDiffRefreshFin === 'number') etat.quetesDiffRefreshFin = saved.quetesDiffRefreshFin;

  if (typeof saved.prestige === 'number') etat.prestige = saved.prestige;
  if (typeof saved.combatsGagnes === 'number') etat.combatsGagnes = saved.combatsGagnes;
  if (saved.brawlerPP     && typeof saved.brawlerPP     === 'object') etat.brawlerPP     = saved.brawlerPP;
  if (saved.brawlerSkills && typeof saved.brawlerSkills === 'object') etat.brawlerSkills = saved.brawlerSkills;
  if (typeof saved.cristaux === 'number') etat.cristaux = saved.cristaux;
  if (saved.prestigeUpgrades && typeof saved.prestigeUpgrades === 'object') {
    etat.prestigeUpgrades = Object.assign(
      { luck: 0, cps: 0, vente: 0, slot: 0, vitesse: 0 },
      saved.prestigeUpgrades
    );
  }

  if (saved.achievements && typeof saved.achievements === 'object') etat.achievements = saved.achievements;
  if (typeof saved.shellyStreak === 'number') etat.shellyStreak = saved.shellyStreak;
  if (saved.robotsBattus && typeof saved.robotsBattus === 'object') etat.robotsBattus = saved.robotsBattus;
  if (saved.indexUnlocks && typeof saved.indexUnlocks === 'object') etat.indexUnlocks = saved.indexUnlocks;
  if (saved.dejaObtenus  && typeof saved.dejaObtenus  === 'object') etat.dejaObtenus   = saved.dejaObtenus;
  if (typeof saved.meilleurScoreVu === 'number') etat.meilleurScoreVu = saved.meilleurScoreVu;

  /* ── Easter egg Naell ── */
  if (saved.naellSpeedUnlocked === true) etat.naellSpeedUnlocked = true;

  /* FIX : restaurer l'état Auto-Roll (sinon toujours "off" au chargement,
     ce qui empêchait le calcul des rolls hors-ligne de se déclencher). */
  if (saved.autoRollActif === true) {
    etat.autoRollActif = true;
    const toggle = document.getElementById('autoToggle');
    const label  = document.getElementById('autoLabel');
    if (toggle) toggle.classList.add('on');
    if (label) { label.textContent = 'ON'; label.style.color = '#a855f7'; }
  }

  /* ── Restaurer les potions encore actives (temps restant > 0) ── */
  const now = Date.now();
  ['luck', 'speed', 'shiny', 'wished', 'golden', 'richesse'].forEach(type => {
    const fin = saved[`${type}Fin`];
    if (saved[`${type}Active`] && typeof fin === 'number' && fin > now) {
      etat[`${type}Active`] = true;
      etat[`${type}Fin`]    = fin;
      // FIX barre de progression potions : restaure la durée totale
      // cumulée (multi-doses) si sauvegardée, sinon repli sur la durée
      // d'une dose (anciennes sauvegardes ne contenant pas ce champ).
      etat[`${type}DureeTotale`] = (typeof saved[`${type}DureeTotale`] === 'number' && saved[`${type}DureeTotale`] > 0)
        ? saved[`${type}DureeTotale`]
        : (typeof POTIONS !== 'undefined' && POTIONS[type] ? POTIONS[type].duree : (fin - now));
      // Redémarre le timer visuel après que le DOM est prêt
      setTimeout(() => demarrerTimer(type), 100);
    }
  });

  ajusterSlotsPets();

  if (Array.isArray(saved.petsEquipes)) {
    etat.petsEquipes = saved.petsEquipes.map(p => {
      if (!p) return null;
      const b = BRAWLERS.find(b => b.id === p.brawlerId);
      return b ? { brawler: b, variante: p.variante } : null;
    });
    ajusterSlotsPets();
  }
}

/* ── Charger l'état depuis Supabase ──
   Retourne le timestamp de la sauvegarde chargée (ou null), pour que
   main.js puisse centraliser le calcul de progression hors-ligne une
   seule fois, après avoir tranché entre sauvegarde locale et cloud. */
async function chargerEtatCloud(_localTs) {
  if (!sb || !cloudUserId) return null;

  const { data, error } = await sb
    .from('game_saves')
    .select('state')
    .eq('user_id', cloudUserId)
    .maybeSingle();

  if (error) { console.error('[cloudsave] Erreur chargement :', error); return null; }
  if (!data || !data.state) return null;

  // FIX "perte de progression au reco" : si une sauvegarde locale plus
  // récente a déjà été appliquée (cf. main.js, chargement local-first),
  // on NE remplace PAS l'état courant par une sauvegarde cloud plus vieille.
  // Sans ce garde-fou, une sauvegarde cloud périmée (échec silencieux d'un
  // upload précédent, etc.) écrasait systématiquement des heures de
  // progression locale au moindre rechargement/reconnexion.
  const cloudTs = (typeof data.state.dernierTimestamp === 'number') ? data.state.dernierTimestamp : 0;
  if (typeof _localTs === 'number' && _localTs > cloudTs) {
    console.warn('[cloudsave] Sauvegarde locale plus récente que le cloud — cloud ignoré pour ce chargement.');
    setCloudStatus('☁️ Cloud actif (sync en attente)', '#22c55e');
    // On force un envoi immédiat de l'état local vers le cloud pour que les
    // deux redeviennent cohérents dès que possible (au lieu d'attendre 15s).
    setTimeout(() => { if (typeof sauvegarderEtatCloud === 'function') sauvegarderEtatCloud(); }, 500);
    return _localTs;
  }

  appliquerEtatSauvegarde(data.state);

  afficherInventaire();
  afficherHistorique();
  afficherTableRarites();
  afficherPets();
  afficherCraft();
  afficherQuetes();
  afficherPrestige();
  if (typeof afficherAchievements === 'function') afficherAchievements();
  mettreAJourCompteurs();
  redemarrerAutoRoll();
  
  // FIX leaderboard : envoyer le vrai CPS après restauration des pets
  if (typeof mettreAJourScoreLeaderboard === 'function') mettreAJourScoreLeaderboard();

  return (typeof data.state.dernierTimestamp === 'number') ? data.state.dernierTimestamp : null;
}

/* ── Sauvegarder l'état vers Supabase ── */
async function sauvegarderEtatCloud() {
  if (!sb || !cloudUserId) return;

  const payload = serialiserEtat();
  const { error } = await sb
    .from('game_saves')
    .upsert({ user_id: cloudUserId, state: payload }, { onConflict: 'user_id' });

  if (error) {
    console.error('[cloudsave] Erreur sauvegarde :', error);
    setCloudStatus('⚠️ Erreur sauvegarde', '#f87171');
  } else {
    setCloudStatus('☁️ Sauvegardé', '#22c55e');
  }

  return payload; // utile pour sendBeacon
}

/* ── Sauvegarde synchrone via sendBeacon (avant fermeture de l'onglet) ── */
function sauvegarderBeacon() {
  if (!sb || !cloudUserId || !window.SUPABASE_URL || !window.SUPABASE_ANON_KEY) return;

  const payload = JSON.stringify(serialiserEtat());
  // Endpoint REST Supabase — upsert via beacon (fire-and-forget garanti même si l'onglet ferme)
  const url = `${window.SUPABASE_URL}/rest/v1/game_saves?on_conflict=user_id`;
  const body = JSON.stringify({ user_id: cloudUserId, state: JSON.parse(payload) });
  const blob = new Blob([body], { type: 'application/json' });

  // sendBeacon ignore la réponse mais garantit l'envoi avant fermeture
  if (navigator.sendBeacon) {
    // sendBeacon ne supporte pas les headers custom ; on passe par une sauvegarde async rapide
    // en tant que fallback synchrone-ish
    sauvegarderEtatCloud().catch(() => {});
  }
}

/* ── Sauvegarde périodique + à la fermeture de l'onglet ── */
function demarrerAutoSaveCloud() {
  clearInterval(cloudAutoSaveId);
  cloudAutoSaveId = setInterval(() => {
    sauvegarderEtatCloud();
    if (typeof mettreAJourScoreLeaderboard === 'function') mettreAJourScoreLeaderboard();
  }, 15000);

  // FIX : utiliser visibilitychange (fiable) en plus de beforeunload
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') {
      // Tenter une sauvegarde synchrone via keepalive fetch
      _sauvegarderBeaconFetch();
    }
  });

  window.addEventListener('beforeunload', () => {
    _sauvegarderBeaconFetch();
  });
}

/* ── Sauvegarde via fetch keepalive (fonctionne pendant beforeunload) ── */
function _sauvegarderBeaconFetch() {
  if (!cloudUserId || !_cloudJWT || !window.SUPABASE_URL || !window.SUPABASE_ANON_KEY) return;

  const body = JSON.stringify([{ user_id: cloudUserId, state: serialiserEtat() }]);
  const url  = `${window.SUPABASE_URL}/rest/v1/game_saves?on_conflict=user_id`;

  try {
    fetch(url, {
      method:  'POST',
      headers: {
        'Content-Type':  'application/json',
        'apikey':        window.SUPABASE_ANON_KEY,
        // FIX : il faut le JWT de SESSION (utilisateur) ici, pas la clé anon.
        // Avec la clé anon comme Bearer, auth.uid() vaut NULL côté Supabase et la
        // policy RLS (auth.uid() = user_id) rejette l'upsert → la sauvegarde à la
        // fermeture/changement d'onglet échouait silencieusement (fetch keepalive,
        // pas de vérification du status), d'où la perte de progression au retour.
        'Authorization': `Bearer ${_cloudJWT}`,
        'Prefer':        'resolution=merge-duplicates',
      },
      body:    body,
      keepalive: true, // clé : garantit l'envoi même si l'onglet ferme
    });
  } catch (e) {
    // Silencieux — on est en train de quitter la page
  }
}

/* ── Affiche l'UUID dans la zone de transfert ── */
function afficherTransferId() {
  const el = document.getElementById('transferId');
  if (!el) return;
  if (cloudUserId) {
    el.textContent = cloudUserId;
    el.style.color = '#5eead4';
  } else if (!cloudConfigure()) {
    el.textContent = 'Cloud non configuré';
    el.style.color = 'var(--text-muted)';
  }
  // Si cloud configuré mais pas encore connecté, on garde "Chargement…"
  // jusqu'à ce que initCloudSave() appelle afficherTransferId()
}

/* ── Copie l'UUID dans le presse-papier ── */
function copierTransferId() {
  if (!cloudUserId) return;
  navigator.clipboard.writeText(cloudUserId).then(() => {
    const btn = document.getElementById('copyTransferBtn');
    if (!btn) return;
    btn.textContent = '✓ Copié !';
    btn.style.background = 'rgba(34,197,94,.2)';
    btn.style.borderColor = 'rgba(34,197,94,.5)';
    btn.style.color = '#22c55e';
    setTimeout(() => {
      btn.textContent = '📋 Copier';
      btn.style.background = 'rgba(59,130,246,.15)';
      btn.style.borderColor = 'rgba(59,130,246,.4)';
      btn.style.color = '#3b82f6';
    }, 2000);
  });
}

/* ════════════════════════════════════════════════
   SAUVEGARDE LOCALE (localStorage)
   ────────────────────────────────────────────────
   FIX "cloud déco" : jusqu'ici le jeu reposait à 100% sur Supabase —
   aucune persistance locale n'existait. La moindre coupure cloud
   (cold-start Koyeb, RLS mal configurée pour un joueur, session
   anonyme qui ne se restaure pas dans un navigateur agressif sur le
   storage, etc.) faisait perdre TOUTE la progression au moindre
   refresh, puisque rien n'était sauvegardé ailleurs.
   Cette couche locale tourne en permanence, indépendamment du cloud :
   le jeu reste jouable et persistant même si Supabase est injoignable,
   et sert aussi de source pour le calcul de farm/rolls hors-ligne
   quand le cloud n'est pas configuré.
════════════════════════════════════════════════ */

const LOCAL_SAVE_KEY = 'nullsrng_save_v1';
let _localSaveInterval = null;

function sauvegarderLocal() {
  try {
    localStorage.setItem(LOCAL_SAVE_KEY, JSON.stringify(serialiserEtat()));
  } catch (e) {
    // Storage plein / navigation privée : on ignore silencieusement,
    // le cloud (si configuré) reste le filet de sécurité principal.
  }
}

function chargerLocal() {
  try {
    const raw = localStorage.getItem(LOCAL_SAVE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    return null;
  }
}

function demarrerSauvegardeLocale() {
  clearInterval(_localSaveInterval);
  _localSaveInterval = setInterval(sauvegarderLocal, 10000);

  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') sauvegarderLocal();
  });
  // localStorage est synchrone : contrairement au cloud (réseau), cette
  // sauvegarde est garantie même si l'onglet se ferme brutalement.
  window.addEventListener('beforeunload', sauvegarderLocal);
}
