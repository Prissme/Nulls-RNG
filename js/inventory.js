/* ════════════════════════════════════════════════
   leaderboard.js — Système de Classement Mondial (CPS)
════════════════════════════════════════════════ */

/* ── Sauvegarde du pseudo depuis l'input ── */
function sauvegarderPseudo() {
  const input = document.getElementById('pseudoInput');
  if (!input) return;
  const valeur = input.value.trim().replace(/[<>"']/g, '').slice(0, 20);
  if (!valeur) { input.style.borderColor = '#f87171'; return; }

  localStorage.setItem('nrng_username', valeur);
  if (typeof etat !== 'undefined') etat.username = valeur;

  input.style.borderColor = '#34d399';
  setTimeout(() => { input.style.borderColor = 'var(--border)'; }, 1200);

  // Recharger le classement avec le nouveau pseudo
  chargerLeaderboard();
}

/* ── Préremplir l'input pseudo à l'ouverture ── */
function ouvrirLeaderboard() {
  const pseudo = localStorage.getItem('nrng_username') || (typeof etat !== 'undefined' && etat.username) || '';
  const input  = document.getElementById('pseudoInput');
  if (input && pseudo) input.value = pseudo;
  chargerLeaderboard();
}

async function chargerLeaderboard() {
  const container = document.getElementById('leaderboardList');
  if (!container) return;

  container.innerHTML = `<div class="text-xs text-center text-slate-400 py-4">Connexion au serveur...</div>`;

  // 🛠️ FIX INITIALISATION : Récupération ou création du client Supabase v2
  let clientSupabase = null;

  if (typeof supabase !== 'undefined' && supabase && typeof supabase.from === 'function') {
    // Si un client valide global existe déjà (ex: initialisé dans cloudsave.js)
    clientSupabase = supabase;
  } else if (typeof supabase !== 'undefined' && supabase && typeof supabase.createClient === 'function') {
    // Si l'outil Supabase est chargé mais pas encore instancié, on le crée avec tes variables window
    const url = window.SUPABASE_URL || "";
    const key = window.SUPABASE_ANON_KEY || "";
    
    if (!url || !key) {
      container.innerHTML = `<div class="text-xs text-center text-amber-400 py-4">⚠️ Sauvegarde cloud non configurée (Variables vides).</div>`;
      return;
    }
    clientSupabase = supabase.createClient(url, key);
  }

  if (!clientSupabase) {
    container.innerHTML = `<div class="text-xs text-center text-red-400 py-4">Erreur : Supabase introuvable ou non initialisé.</div>`;
    return;
  }

  // Gestion du pseudonyme du joueur
  let pseudoJoueur = localStorage.getItem('nrng_username');
  if (!pseudoJoueur) {
    pseudoJoueur = (typeof etat !== 'undefined' && etat.username) ? etat.username : "Player_" + Math.floor(1000 + Math.random() * 9000);
    localStorage.setItem('nrng_username', pseudoJoueur);
  }
  if (typeof etat !== 'undefined') etat.username = pseudoJoueur;
  
  const cpsActuel = typeof totalCPS === 'function' ? totalCPS() : 0;

  try {
    // 1. Sauvegarde du score actuel du joueur
    await clientSupabase
      .from('nulls_rng_leaderboard')
      .upsert(
        { username: pseudoJoueur, cps: cpsActuel, updated_at: new Date() }, 
        { onConflict: 'username' }
      );

    // 2. Récupération des 10 meilleurs scores mondiaux
    const { data, error } = await clientSupabase
      .from('nulls_rng_leaderboard')
      .select('username, cps')
      .order('cps', { ascending: false })
      .limit(10);

    if (error) throw error;

    if (!data || data.length === 0) {
      container.innerHTML = `<div class="text-xs text-center text-slate-500 py-4">Aucun score enregistré dans la table.</div>`;
      return;
    }

    // 3. Rendu HTML propre du classement
    container.innerHTML = data.map((joueur, index) => {
      let positionHTML = `${index + 1}.`;
      let styleTexte = 'text-slate-300';
      if (index === 0) { positionHTML = '🥇'; styleTexte = 'text-amber-400 font-black text-sm'; }
      if (index === 1) { positionHTML = '🥈'; styleTexte = 'text-slate-200 font-bold'; }
      if (index === 2) { positionHTML = '🥉'; styleTexte = 'text-orange-400 font-bold'; }

      const estMoi = joueur.username === pseudoJoueur;
      const styleConteneur = estMoi 
        ? 'background: rgba(168,85,247,0.18); border-color: rgba(168,85,247,0.5); font-weight: bold;' 
        : 'background: rgba(255,255,255,0.02); border-color: rgba(255,255,255,0.06);';

      return `
        <div class="flex items-center justify-between p-2 rounded-xl border text-xs" style="${styleConteneur}">
          <div class="flex items-center gap-2 overflow-hidden mr-2">
            <span class="w-6 text-center shrink-0">${positionHTML}</span>
            <span class="${styleTexte} truncate ${estMoi ? 'underline' : ''}">
              ${joueur.username} ${estMoi ? ' (Toi)' : ''}
            </span>
          </div>
          <div class="font-mono font-black text-amber-400 flex items-center gap-1 shrink-0">
            ${joueur.cps.toLocaleString('fr-FR')}
            <img src="./images/Coins.webp" alt="Coins" class="w-4 h-4 object-contain inline-block align-middle">/s
          </div>
        </div>
      `;
    }).join('');

  } catch (err) {
    console.error("Erreur Leaderboard :", err);
    container.innerHTML = `
      <div class="p-2 bg-red-950/30 border border-red-500/30 rounded-xl text-center text-red-400 text-xs font-mono">
        ❌ Erreur serveur : ${err.message || err}
      </div>
    `;
  }
}
