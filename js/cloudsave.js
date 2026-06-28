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
    cristaux:          etat.cristaux,
    prestigeUpgrades:  etat.prestigeUpgrades,
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
  if (typeof saved.cristaux === 'number') etat.cristaux = saved.cristaux;
  if (saved.prestigeUpgrades && typeof saved.prestigeUpgrades === 'object') {
    etat.prestigeUpgrades = Object.assign(
      { luck: 0, cps: 0, vente: 0, slot: 0, vitesse: 0 },
      saved.prestigeUpgrades
    );
  }

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
  if (!cloudUserId || !window.SUPABASE_URL || !window.SUPABASE_ANON_KEY) return;

  const body = JSON.stringify([{ user_id: cloudUserId, state: serialiserEtat() }]);
  const url  = `${window.SUPABASE_URL}/rest/v1/game_saves?on_conflict=user_id`;

  try {
    fetch(url, {
      method:  'POST',
      headers: {
        'Content-Type':  'application/json',
        'apikey':        window.SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${window.SUPABASE_ANON_KEY}`,
        'Prefer':        'resolution=merge-duplicates',
      },
      body:    body,
      keepalive: true, // clé : garantit l'envoi même si l'onglet ferme
    });
  } catch (e) {
    // Silencieux — on est en train de quitter la page
  }
}
