/* ════════════════════════════════════════════════
   leaderboard.js — Système de Classement Mondial (CPS)
════════════════════════════════════════════════ */

async function chargerLeaderboard() {
  const container = document.getElementById('leaderboardList');
  if (!container) return;

  if (typeof supabase === 'undefined' || !supabase) {
    container.innerHTML = `<div class="text-xs text-center text-red-400 py-4">Erreur : Supabase introuvable.</div>`;
    return;
  }

  let pseudoJoueur = localStorage.getItem('nrng_username');
  if (!pseudoJoueur) {
    pseudoJoueur = (typeof etat !== 'undefined' && etat.username) ? etat.username : "Player_" + Math.floor(1000 + Math.random() * 9000);
    localStorage.setItem('nrng_username', pseudoJoueur);
  }
  
  if (typeof etat !== 'undefined') etat.username = pseudoJoueur;
  const cpsActuel = typeof totalCPS === 'function' ? totalCPS() : 0;

  try {
    // 1. TENTATIVE D'ENVOI DU SCORE
    const { error: upsertError } = await supabase
      .from('nulls_rng_leaderboard')
      .upsert({ username: pseudoJoueur, cps: cpsActuel, updated_at: new Date() }, { onConflict: 'username' });

    if (upsertError) {
      console.warn("L'écriture a échoué (Probablement les règles RLS de Supabase) :", upsertError.message);
      // On continue quand même pour voir si la lecture fonctionne
    }

    // 2. RÉCUPÉRATION DU TOP 10
    const { data, error: selectError } = await supabase
      .from('nulls_rng_leaderboard')
      .select('username, cps')
      .order('cps', { ascending: false })
      .limit(10);

    if (selectError) {
      console.error("La lecture a échoué :", selectError.message);
      throw selectError;
    }

    if (!data || data.length === 0) {
      container.innerHTML = `<div class="text-xs text-center text-slate-500 py-4">Table vide. En attente de scores...</div>`;
      return;
    }

    // 3. RENDU HTML
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
    container.innerHTML = `<div class="text-xs text-center text-red-400 py-4">Erreur : Regarde la console F12</div>`;
  }
}
