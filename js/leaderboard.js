/* ════════════════════════════════════════════════
   leaderboard.js — Diagnostic Supabase Forcé
════════════════════════════════════════════════ */

async function chargerLeaderboard() {
  const container = document.getElementById('leaderboardList');
  if (!container) return;

  container.innerHTML = `<div class="text-xs text-center text-slate-400 py-4">Connexion au serveur...</div>`;

  if (typeof supabase === 'undefined' || !supabase) {
    container.innerHTML = `<div class="text-xs text-center text-red-400 py-4">Erreur : L'objet 'supabase' n'existe pas dans le script global. Check ton config.js.</div>`;
    return;
  }

  let pseudoJoueur = localStorage.getItem('nrng_username');
  if (!pseudoJoueur) {
    pseudoJoueur = (typeof etat !== 'undefined' && etat.username) ? etat.username : "Player_" + Math.floor(1000 + Math.random() * 9000);
    localStorage.setItem('nrng_username', pseudoJoueur);
  }
  
  const cpsActuel = typeof totalCPS === 'function' ? totalCPS() : 0;

  try {
    // 1. Test d'écriture
    container.innerHTML = `<div class="text-xs text-center text-purple-400 py-4">Étape 1 : Envoi du score (${cpsActuel} CPS)...</div>`;
    
    const { error: upsertError } = await supabase
      .from('nulls_rng_leaderboard')
      .upsert({ username: pseudoJoueur, cps: cpsActuel, updated_at: new Date() }, { onConflict: 'username' });

    if (upsertError) {
      afficherBlocErreur("Erreur durant l'écriture (Upsert)", upsertError);
      return;
    }

    // 2. Test de lecture
    container.innerHTML = `<div class="text-xs text-center text-purple-400 py-4">Étape 2 : Récupération du Top 10...</div>`;

    const { data, error: selectError } = await supabase
      .from('nulls_rng_leaderboard')
      .select('username, cps')
      .order('cps', { ascending: false })
      .limit(10);

    if (selectError) {
      afficherBlocErreur("Erreur durant la lecture (Select)", selectError);
      return;
    }

    if (!data || data.length === 0) {
      container.innerHTML = `<div class="text-xs text-center text-slate-500 py-4">La table est connectée mais elle est actuellement vide.</div>`;
      return;
    }

    // 3. Rendu normal si tout fonctionne
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
    afficherBlocErreur("Crash critique du script JS", err);
  }
}

function afficherBlocErreur(titre, objetErreur) {
  const container = document.getElementById('leaderboardList');
  if (!container) return;

  container.innerHTML = `
    <div class="p-3 rounded-lg border text-left bg-amber-500/10 border-amber-500/40 text-xs text-amber-200 flex flex-col gap-1.5 font-mono">
      <div class="font-bold text-red-400">⚠️ ${titre}</div>
      <div><strong>Message :</strong> ${objetErreur.message || objetErreur}</div>
      <div><strong>Code :</strong> ${objetErreur.code || 'Aucun'}</div>
      <div><strong>Détails :</strong> ${objetErreur.details || 'Aucun'}</div>
      <div class="text-[10px] text-slate-400 mt-1">Vérifie l'éditeur SQL de Supabase ou tes clés dans js/config.js.</div>
    </div>
  `;
}
