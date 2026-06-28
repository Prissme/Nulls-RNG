/* ════════════════════════════════════════════════
   leaderboard.js — Système de Classement Mondial (CPS)
════════════════════════════════════════════════ */

/* ── Pseudo ── */
function sauvegarderPseudo() {
  const input = document.getElementById('pseudoInput');
  if (!input) return;
  const valeur = input.value.trim().replace(/[<>"']/g, '').slice(0, 20);
  if (!valeur) { input.style.borderColor = '#f87171'; return; }

  localStorage.setItem('nrng_username', valeur);
  if (typeof etat !== 'undefined') etat.username = valeur;

  input.style.borderColor = '#34d399';
  setTimeout(() => { input.style.borderColor = 'var(--border)'; }, 1200);

  // Envoyer le score tout de suite avec le nouveau pseudo
  mettreAJourScoreLeaderboard().then(() => chargerLeaderboard());
}

function ouvrirLeaderboard() {
  const pseudo = localStorage.getItem('nrng_username') || (typeof etat !== 'undefined' && etat.username) || '';
  const input  = document.getElementById('pseudoInput');
  if (input && pseudo) input.value = pseudo;
  chargerLeaderboard();
}

/* ── Récupère le client Supabase déjà initialisé dans cloudsave.js ── */
function _getSupabaseClient() {
  if (typeof getCloudClient === 'function' && getCloudClient()) return getCloudClient();
  if (typeof window.supabase !== 'undefined' && window.SUPABASE_URL && window.SUPABASE_ANON_KEY) {
    if (typeof window.supabase.createClient === 'function')
      return window.supabase.createClient(window.SUPABASE_URL, window.SUPABASE_ANON_KEY);
    if (typeof window.supabase.from === 'function') return window.supabase;
  }
  return null;
}

/* ── Pseudo résolu : localStorage > etat.username > génère un Player_XXXX ── */
function _getPseudo() {
  let pseudo = localStorage.getItem('nrng_username');
  if (!pseudo && typeof etat !== 'undefined' && etat.username) pseudo = etat.username;
  if (!pseudo) {
    pseudo = 'Player_' + Math.floor(1000 + Math.random() * 9000);
    localStorage.setItem('nrng_username', pseudo);
  }
  if (typeof etat !== 'undefined') etat.username = pseudo;
  return pseudo;
}

/* ── Met à jour le score en arrière-plan (appelé après chargement cloud + toutes les 15s) ── */
async function mettreAJourScoreLeaderboard() {
  const client = _getSupabaseClient();
  if (!client) return;

  const pseudo     = _getPseudo();
  const cpsActuel  = typeof totalCPS === 'function' ? totalCPS() : 0;

  // Ne pas écraser un bon score par 0 au démarrage :
  // on ne met à jour que si le CPS est > 0 OU si la ligne n'existe pas encore
  if (cpsActuel === 0) {
    // Vérifier si une ligne existe déjà avec un score > 0
    try {
      const { data } = await client
        .from('nulls_rng_leaderboard')
        .select('cps')
        .eq('username', pseudo)
        .maybeSingle();
      if (data && data.cps > 0) return; // garder l'ancien score, pas écraser par 0
    } catch (_) {}
  }

  try {
    await client
      .from('nulls_rng_leaderboard')
      .upsert(
        { username: pseudo, cps: cpsActuel, updated_at: new Date().toISOString() },
        { onConflict: 'username' }
      );
  } catch (e) {
    console.warn('[leaderboard] Mise à jour échouée :', e);
  }
}

async function chargerLeaderboard() {
  const container = document.getElementById('leaderboardList');
  if (!container) return;

  container.innerHTML = `<div class="text-xs text-center text-slate-400 py-4">Connexion au serveur...</div>`;

  const clientSupabase = _getSupabaseClient();
  if (!clientSupabase) {
    container.innerHTML = `<div class="text-xs text-center text-amber-400 py-4">⚠️ Cloud non configuré.</div>`;
    return;
  }

  const pseudoJoueur = _getPseudo();
  const cpsActuel    = typeof totalCPS === 'function' ? totalCPS() : 0;

  try {
    // Upsert du score actuel (protégé contre l'écrasement par 0)
    await mettreAJourScoreLeaderboard();

    // Top 10
    const { data, error } = await clientSupabase
      .from('nulls_rng_leaderboard')
      .select('username, cps')
      .order('cps', { ascending: false })
      .limit(10);

    if (error) throw error;

    if (!data || data.length === 0) {
      container.innerHTML = `<div class="text-xs text-center text-slate-500 py-4">Aucun score enregistré.</div>`;
      return;
    }

    // Vérifier si le joueur est dans le top 10
    const estDansTop = data.some(j => j.username === pseudoJoueur);

    // Si pas dans le top 10, récupérer sa position réelle
    let maPosition = null;
    if (!estDansTop) {
      const { data: tous } = await clientSupabase
        .from('nulls_rng_leaderboard')
        .select('username, cps')
        .order('cps', { ascending: false });
      if (tous) {
        const idx = tous.findIndex(j => j.username === pseudoJoueur);
        if (idx !== -1) maPosition = { rang: idx + 1, cps: tous[idx].cps };
      }
    }

    // Rendu Top 10
    container.innerHTML = data.map((joueur, index) => {
      let positionHTML = `${index + 1}.`;
      let styleTexte   = 'text-slate-300';
      if (index === 0) { positionHTML = '🥇'; styleTexte = 'text-amber-400 font-black text-sm'; }
      if (index === 1) { positionHTML = '🥈'; styleTexte = 'text-slate-200 font-bold'; }
      if (index === 2) { positionHTML = '🥉'; styleTexte = 'text-orange-400 font-bold'; }

      const estMoi = joueur.username === pseudoJoueur;
      const styleConteneur = estMoi
        ? 'background:rgba(168,85,247,0.18);border-color:rgba(168,85,247,0.5);font-weight:bold;'
        : 'background:rgba(255,255,255,0.02);border-color:rgba(255,255,255,0.06);';

      return `
        <div class="flex items-center justify-between p-2 rounded-xl border text-xs" style="${styleConteneur}">
          <div class="flex items-center gap-2 overflow-hidden mr-2">
            <span class="w-6 text-center shrink-0">${positionHTML}</span>
            <span class="${styleTexte} truncate ${estMoi ? 'underline' : ''}">
              ${joueur.username}${estMoi ? ' (Toi)' : ''}
            </span>
          </div>
          <div class="font-mono font-black text-amber-400 flex items-center gap-1 shrink-0">
            ${Number(joueur.cps).toLocaleString('fr-FR')}
            <img src="./images/Coins.webp" alt="Coins" class="w-4 h-4 object-contain inline-block align-middle">/s
          </div>
        </div>
      `;
    }).join('');

    // Afficher ma position si hors top 10
    if (!estDansTop && maPosition) {
      container.innerHTML += `
        <div class="mt-2 text-xs text-center text-slate-500">• • •</div>
        <div class="flex items-center justify-between p-2 rounded-xl border text-xs mt-1"
          style="background:rgba(168,85,247,0.18);border-color:rgba(168,85,247,0.5);font-weight:bold;">
          <div class="flex items-center gap-2 overflow-hidden mr-2">
            <span class="w-6 text-center shrink-0">${maPosition.rang}.</span>
            <span class="text-purple-300 truncate underline">${pseudoJoueur} (Toi)</span>
          </div>
          <div class="font-mono font-black text-amber-400 flex items-center gap-1 shrink-0">
            ${Number(maPosition.cps).toLocaleString('fr-FR')}
            <img src="./images/Coins.webp" alt="Coins" class="w-4 h-4 object-contain inline-block align-middle">/s
          </div>
        </div>
      `;
    }

  } catch (err) {
    console.error('Erreur Leaderboard :', err);
    container.innerHTML = `
      <div class="p-2 bg-red-950/30 border border-red-500/30 rounded-xl text-center text-red-400 text-xs font-mono">
        ❌ Erreur serveur : ${err.message || err}
      </div>
    `;
  }
}
