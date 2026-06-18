/* ════════════════════════════════════════════════
   leaderboard.js — Système de Classement Mondial (CPS)
════════════════════════════════════════════════ */

async function chargerLeaderboard() {
  const container = document.getElementById('leaderboardList');
  if (!container) return;

  if (typeof supabase === 'undefined' || !supabase) {
    container.innerHTML = `<div class="text-xs text-center text-red-400 py-4">Erreur : Supabase introuvable ou mal configuré.</div>`;
    return;
  }

  // Gestion du pseudonyme du joueur (génère un pseudo par défaut s'il n'existe pas)
  if (!etat.username) {
    etat.username = localStorage.getItem('nrng_username') || "Player_" + Math.floor(1000 + Math.random() * 9000);
    localStorage.setItem('nrng_username', etat.username);
  }

  const pseudoJoueur = etat.username;
  const cpsActuel = typeof totalCPS === 'function' ? totalCPS() : 0;

  try {
    // 1. Sauvegarde instantanée du CPS de l'utilisateur connecté sur Supabase
    await supabase
      .from('leaderboard')
      .upsert(
        { username: pseudoJoueur, cps: cpsActuel, updated_at: new Date() }, 
        { onConflict: 'username' }
      );

    // 2. Récupération des 10 meilleurs scores mondiaux
    const { data, error } = await supabase
      .from('leaderboard')
      .select('username, cps')
      .order('cps', { ascending: false })
      .limit(10);

    if (error) throw error;

    if (!data || data.length === 0) {
      container.innerHTML = `<div class="text-xs text-center text-slate-500 py-4">Aucun score enregistré dans l'arène.</div>`;
      return;
    }

    // 3. Génération du rendu d'affichage du classement
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
            <span class="${styleTexte} truncate ${estMoi ? 'underline' : ''}" title="${joueur.username}">
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
    console.error("Erreur de synchronisation du leaderboard :", err);
    container.innerHTML = `<div class="text-xs text-center text-red-400 py-4">Erreur de chargement du serveur.</div>`;
  }
}
