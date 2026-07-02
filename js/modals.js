/* ════════════════════════════════════════════════
   modals.js — Ouverture / fermeture des popups
   (Inventaire, Boutique, Quêtes, Craft, Raretés, Combat, Leaderboard, Prestige)
════════════════════════════════════════════════ */

/* ── Ouvrir une popup ── */
function ouvrirModal(id) {
  const modal = document.getElementById(id);
  if (!modal) return;
  modal.style.display = 'flex';
  modal.classList.add('open');
  document.body.style.overflow = 'hidden';

  if (id === 'modalCombat' && typeof afficherCombat === 'function') afficherCombat();
  if (id === 'modalLeaderboard' && typeof ouvrirLeaderboard === 'function') ouvrirLeaderboard();
  if (id === 'modalPrestige' && typeof afficherPrestige === 'function') afficherPrestige();
  // FIX perf : depuis que le roll ne rafraîchit plus ces grilles pendant
  // qu'elles sont fermées, on les remet à jour explicitement à l'ouverture.
  if (id === 'modalInventaire' && typeof afficherInventaire === 'function') afficherInventaire();
  if (id === 'modalCraft' && typeof afficherCraft === 'function') afficherCraft();
}

/* ── Fermer une popup ── */
function fermerModal(id) {
  const modal = document.getElementById(id);
  if (!modal) return;
  modal.style.display = 'none';
  modal.classList.remove('open');
  if (!document.querySelector('.modal-overlay.open')) {
    document.body.style.overflow = '';
  }
}

/* ── Fermer en cliquant sur le fond (hors de la boîte) ── */
function fermerModalOverlay(event, id) {
  if (event.target.id === id) fermerModal(id);
}

/* ── Fermer avec la touche Echap ── */
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    document.querySelectorAll('.modal-overlay.open').forEach(m => {
      m.classList.remove('open');
      m.style.display = 'none';
    });
    document.body.style.overflow = '';
  }
});

/* ── Badges (petites pastilles) sur les boutons Quêtes / Craft ── */
function majBadge(id, count) {
  const el = document.getElementById(id);
  if (!el) return;
  if (count > 0) {
    el.textContent = count > 9 ? '9+' : count;
    el.classList.remove('hidden');
  } else {
    el.classList.add('hidden');
  }
}

function rafraichirBadgeQuetes() {
  const n = document.querySelectorAll('#quetesList button').length;
  majBadge('quetesBadge', n);
}

function rafraichirBadgeCraft() {
  // FIX : comptait tous les <button> actifs (×1, ALL, + le bouton "Craft
  // ALL (recette)" du header) — jusqu'à 3 boutons pour un seul item
  // réellement craftable, gonflant artificiellement le badge. On compte
  // maintenant les lignes marquées `data-craftable` par craft.js, soit le
  // nombre réel de combos brawler+recette disponibles au craft.
  const n = document.querySelectorAll('#craftList .craft-row[data-craftable="1"]').length;
  majBadge('craftBadge', n);
}

(function initBadgeObservers() {
  const quetesList = document.getElementById('quetesList');
  const craftList  = document.getElementById('craftList');

  if (quetesList) {
    new MutationObserver(rafraichirBadgeQuetes).observe(quetesList, { childList: true, subtree: true });
  }
  if (craftList) {
    new MutationObserver(rafraichirBadgeCraft).observe(craftList, { childList: true, subtree: true });
  }
  rafraichirBadgeQuetes();
  rafraichirBadgeCraft();
})();
