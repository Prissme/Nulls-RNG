/* ════════════════════════════════════════════════
   cloudsave.js — Sauvegarde cloud (Supabase)

   Optionnel : si window.SUPABASE_URL / SUPABASE_ANON_KEY
   sont vides (js/config.js non configuré), le jeu
   fonctionne normalement, juste sans sauvegarde cloud.
   Authentification : un compte anonyme Supabase par
   navigateur (pas de login) — il faut activer "Allow
   anonymous sign-ins" dans Supabase (voir SQL fourni).
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
  if (!cloudConfigure()) return; // pas de clés configurées → mode local uniquement

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

/* ── Sérialisation : uniquement des données simples
   (les pets équipés gardent juste brawlerId + variante,
   pas l'objet brawler complet) ── */
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

  // Le nombre de slots dépend de prestigeUpgrades.slot : on l'ajuste avant/après
  // avoir remplacé le tableau de pets équipés.
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
  if (!data || !data.state) return; // première connexion, rien à charger encore

  appliquerEtatSauvegarde(data.state);

  // Re-rendre toute l'UI avec l'état rechargé
  afficherInventaire();
  afficherHistorique();
  afficherTableRarites();
  afficherPets();
  afficherCraft();
  afficherQuetes();
  afficherPrestige();
  mettreAJourCompteurs();
  redemarrerAutoRoll();
}

/* ── Sauvegarder l'état vers Supabase ── */
async function sauvegarderEtatCloud() {
  if (!sb || !cloudUserId) return;

  const { error } = await sb
    .from('game_saves')
    .upsert({ user_id: cloudUserId, state: serialiserEtat() }, { onConflict: 'user_id' });

  if (error) {
    console.error('[cloudsave] Erreur sauvegarde :', error);
    setCloudStatus('⚠️ Erreur sauvegarde', '#f87171');
  } else {
    setCloudStatus('☁️ Sauvegardé', '#22c55e');
  }
}

/* ── Sauvegarde périodique + à la fermeture de l'onglet ── */
function demarrerAutoSaveCloud() {
  clearInterval(cloudAutoSaveId);
  cloudAutoSaveId = setInterval(sauvegarderEtatCloud, 15000);
  window.addEventListener('beforeunload', () => { sauvegarderEtatCloud(); });
}
