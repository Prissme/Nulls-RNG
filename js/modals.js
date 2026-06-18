/* ════════════════════════════════════════════════
   modals.js — Ouverture / fermeture des popups
   (Inventaire, Boutique, Quêtes, Craft, Raretés)
════════════════════════════════════════════════ */

/* ── Ouvrir une popup ── */
function ouvrirModal(id) {
  const modal = document.getElementById(id);
  if (!modal) return;
  modal.style.display = 'flex';
  modal.classList.add('open');
  document.body.style.overflow = 'hidden';
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

/* ── Badges (petites pastilles) sur les boutons Quêtes / Craft ──
   Mis à jour automatiquement via MutationObserver, dès que le
   contenu des panneaux change (pas besoin de toucher quetes.js / craft.js) */
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
  // Un bouton "Réclamer" n'apparaît que pour les quêtes terminées non réclamées
  const n = document.querySelectorAll('#quetesList button').length;
  majBadge('quetesBadge', n);
}

function rafraichirBadgeCraft() {
  // Un bouton de craft activable n'a pas l'attribut disabled
  const n = document.querySelectorAll('#craftList button:not([disabled])').length;
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
