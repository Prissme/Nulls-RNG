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

/* ── Initialisation : connexion anonyme + chargement ── */
async function initCloudSave() {
  if (!cloudConfigure()) return;

  setCloudStatus('🔄 Connexion…', '#94a3b8');
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
    await chargerEtatCloud();
    setCloudStatus('☁️ Cloud actif', '#22c55e');
    demarrerAutoSaveCloud();
  } catch (err) {
    console.error('[cloudsave] Échec initialisation :', err);
    setCloudStatus('⚠️ Cloud indisponible', '#f87171');
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
    quetes:            etat.quetes,
    quetesRefreshFin:  etat.quetesRefreshFin,
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
    /* ── Potions : on sauvegarde le timestamp de fin pour restaurer au refresh ── */
    luckActive:   etat.luckActive,
    luckFin:      etat.luckFin,
    speedActive:  etat.speedActive,
    speedFin:     etat.speedFin,
    shinyActive:  etat.shinyActive,
    shinyFin:     etat.shinyFin,
    wishedActive: etat.wishedActive,
    wishedFin:    etat.wishedFin,
    goldenActive: etat.goldenActive,
    goldenFin:    etat.goldenFin,
    /* ── Easter egg Naell ── */
    naellSpeedUnlocked: etat.naellSpeedUnlocked || false,
  };
}

/* ── Applique une sauvegarde chargée à l'état courant ── */
function appliquerEtatSauvegarde(saved) {
  if (!saved) return;

  if (typeof saved.pieces       === 'number') etat.pieces       = saved.pieces;
  if (typeof saved.totalRolls   === 'number') etat.totalRolls   = saved.totalRolls;
  if (typeof saved.totalPotions === 'number') etat.totalPotions = saved.totalPotions;
  if (saved.inventaire && typeof saved.inventaire === 'object') etat.inventaire = saved.inventaire;
  if (typeof saved.niveau === 'number') etat.niveau = saved.niveau;
  if (typeof saved.xp     === 'number') etat.xp     = saved.xp;
  if (Array.isArray(saved.quetes)) etat.quetes = saved.quetes;
  if (typeof saved.quetesRefreshFin === 'number') etat.quetesRefreshFin = saved.quetesRefreshFin;

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

  /* ── Easter egg Naell ── */
  if (saved.naellSpeedUnlocked === true) etat.naellSpeedUnlocked = true;

  /* ── Restaurer les potions encore actives (temps restant > 0) ── */
  const now = Date.now();
  ['luck', 'speed', 'shiny', 'wished', 'golden'].forEach(type => {
    const fin = saved[`${type}Fin`];
    if (saved[`${type}Active`] && typeof fin === 'number' && fin > now) {
      etat[`${type}Active`] = true;
      etat[`${type}Fin`]    = fin;
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

/* ── Charger l'état depuis Supabase ── */
async function chargerEtatCloud() {
  if (!sb || !cloudUserId) return;

  const { data, error } = await sb
    .from('game_saves')
    .select('state')
    .eq('user_id', cloudUserId)
    .maybeSingle();

  if (error) { console.error('[cloudsave] Erreur chargement :', error); return; }
  if (!data || !data.state) return;

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
