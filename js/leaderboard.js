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

  chargerLeaderboard();
}

function ouvrirLeaderboard() {
  const pseudo = localStorage.getItem('nrng_username') || (typeof etat !== 'undefined' && etat.username) || '';
  const input  = document.getElementById('pseudoInput');
  if (input && pseudo) input.value = pseudo;
  chargerLeaderboard();
}

/* ── Récupère le client Supabase déjà initialisé dans cloudsave.js ── */
function _getSupabaseClient() {
  // FIX : réutiliser le client existant au lieu d'en créer un nouveau
  if (typeof getCloudClient === 'function' && getCloudClient()) {
    return getCloudClient();
  }
  // Fallback : créer un client si cloudsave n'est pas encore prêt
  if (typeof window.supabase !== 'undefined' && window.SUPABASE_URL && window.SUPABASE_ANON_KEY) {
    if (typeof window.supabase.createClient === 'function') {
      return window.supabase.createClient(window.SUPABASE_URL, window.SUPABASE_ANON_KEY);
    }
    if (typeof window.supabase.from === 'function') {
      return window.supabase;
    }
  }
  return null;
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

  // Pseudo
  let pseudoJoueur = localStorage.getItem('nrng_username');
  if (!pseudoJoueur) {
    pseudoJoueur = (typeof etat !== 'undefined' && etat.username)
      ? etat.username
      : 'Player_' + Math.floor(1000 + Math.random() * 9000);
    localStorage.setItem('nrng_username', pseudoJoueur);
  }
  if (typeof etat !== 'undefined') etat.username = pseudoJoueur;

  const cpsActuel = typeof totalCPS === 'function' ? totalCPS() : 0;

  try {
    // 1. Mise à jour du score (upsert sur username)
    await clientSupabase
      .from('nulls_rng_leaderboard')
      .upsert(
        { username: pseudoJoueur, cps: cpsActuel, updated_at: new Date().toISOString() },
        { onConflict: 'username' }
      );

    // 2. Top 10
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

    // 3. Rendu
    container.innerHTML = data.map((joueur, index) => {
      let positionHTML = `${index + 1}.`;
      let styleTexte = 'text-slate-300';
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

  } catch (err) {
    console.error('Erreur Leaderboard :', err);
    container.innerHTML = `
      <div class="p-2 bg-red-950/30 border border-red-500/30 rounded-xl text-center text-red-400 text-xs font-mono">
        ❌ Erreur serveur : ${err.message || err}
      </div>
    `;
  }
}

/* ── Met à jour le score leaderboard en arrière-plan (sans recharger l'UI) ── */
async function mettreAJourScoreLeaderboard() {
  const client = _getSupabaseClient();
  if (!client) return;

  const pseudo = localStorage.getItem('nrng_username');
  if (!pseudo) return;

  const cpsActuel = typeof totalCPS === 'function' ? totalCPS() : 0;

  try {
    await client
      .from('nulls_rng_leaderboard')
      .upsert(
        { username: pseudo, cps: cpsActuel, updated_at: new Date().toISOString() },
        { onConflict: 'username' }
      );
  } catch (e) {
    console.warn('[leaderboard] Mise à jour silencieuse échouée :', e);
  }
}
