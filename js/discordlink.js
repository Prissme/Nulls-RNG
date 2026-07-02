/* ════════════════════════════════════════════════
   discordlink.js — Lier un compte Discord au compte
   de jeu, via Supabase Auth Identity Linking (OAuth)
   ────────────────────────────────────────────────
   Le joueur est déjà authentifié anonymement dans
   Supabase (voir cloudsave.js). On ATTACHE une identité
   Discord à ce même utilisateur avec
   supabase.auth.linkIdentity({ provider: 'discord' }) :
   le user_id (clé stable du leaderboard / cloud save)
   ne change pas, on ajoute juste "qui est-ce sur Discord"
   à côté.

   ── Prérequis côté Discord Developer Portal ──
   (discord.com/developers/applications)
     1. Créer une application.
     2. OAuth2 > General > "Redirect URIs" : ajouter
        https://<TON-PROJET>.supabase.co/auth/v1/callback
     3. Copier le "Client ID" et générer/copier le
        "Client Secret".

   ── Prérequis côté Dashboard Supabase ──
     1. Authentication > Providers > Discord : activer,
        coller Client ID + Client Secret ci-dessus.
     2. Authentication > URL Configuration : ajouter
        l'URL réelle du jeu (ex: https://tonjeu.koyeb.app)
        dans "Redirect URLs".
     3. Authentication > Settings (ou "Sign In / Providers"
        selon la version du dashboard) : activer
        "Allow manual linking" — indispensable, c'est ce
        qui autorise linkIdentity() sur un utilisateur déjà
        connecté (ici la session anonyme) au lieu de forcer
        un nouveau compte séparé.
   Sans ces réglages, lierCompteDiscord() renverra une
   erreur explicite affichée dans le badge du modal.
════════════════════════════════════════════════ */

let _discordLinkEnCours = false;
let _dernierIdentiteDiscord = null;   // cache pour le clic sur le badge header
let _derniereErreurDiscord = null;    // idem, pour ouvrir le modal plutôt que relancer direct

/* ── Client Supabase déjà initialisé par cloudsave.js ── */
function _dlClient() {
  return (typeof getCloudClient === 'function') ? getCloudClient() : null;
}

/* ── Identité Discord actuellement liée (ou null) ── */
async function obtenirIdentiteDiscord() {
  const client = _dlClient();
  if (!client) return null;
  try {
    const { data, error } = await client.auth.getUserIdentities();
    if (error || !data) return null;
    return data.identities.find(i => i.provider === 'discord') || null;
  } catch (e) {
    return null;
  }
}

/* ── Pseudo / avatar lisibles depuis identity_data (variable selon
   la version de l'API Discord, on couvre les cas courants) ── */
function _pseudoDepuisIdentite(identite) {
  const d = identite?.identity_data || {};
  return d.full_name || d.global_name || d.name || d.username || d.custom_claims?.global_name || null;
}
function _avatarDepuisIdentite(identite) {
  const d = identite?.identity_data || {};
  return d.avatar_url || d.picture || null;
}

/* ── Lance le flow OAuth Discord (redirection complète de la page) ── */
async function lierCompteDiscord() {
  const client = _dlClient();
  if (!client) {
    afficherStatutDiscordLink(null, "⚠️ Cloud non prêt, réessaie dans quelques secondes.");
    return;
  }
  if (_discordLinkEnCours) return;
  _discordLinkEnCours = true;

  // On sauvegarde avant de quitter la page (linkIdentity redirige entièrement)
  try { if (typeof sauvegarderLocal === 'function') sauvegarderLocal(); } catch (_) {}
  try { if (typeof sauvegarderEtatCloud === 'function') await sauvegarderEtatCloud(); } catch (_) {}

  const { error } = await client.auth.linkIdentity({
    provider: 'discord',
    options: {
      redirectTo: window.location.origin + window.location.pathname,
    },
  });

  if (error) {
    _discordLinkEnCours = false;
    console.error('[discordlink] Erreur linkIdentity :', error);
    afficherStatutDiscordLink(null, `⚠️ ${error.message || 'Échec de la liaison Discord'}`);
  }
  // Sinon : la page part vers Discord, rien de plus à faire ici.
}

/* ── Délie le compte Discord actuellement lié ── */
async function delierCompteDiscord() {
  const client = _dlClient();
  if (!client) return;

  const identite = await obtenirIdentiteDiscord();
  if (!identite) return;

  if (!confirm('Délier ce compte Discord ? Tu pourras le relier plus tard.')) return;

  const { error } = await client.auth.unlinkIdentity(identite);
  if (error) {
    console.error('[discordlink] Erreur unlinkIdentity :', error);
    alert('Échec de la déliaison : ' + (error.message || 'erreur inconnue'));
    return;
  }
  await rafraichirStatutDiscordLink();
}

/* ── Met à jour le badge "Compte Discord" du modal Leaderboard ── */
async function rafraichirStatutDiscordLink() {
  const zone = document.getElementById('discordLinkZone');
  if (!zone) return;

  const client = _dlClient();
  if (!client) {
    zone.innerHTML = `<div style="font-size:.65rem;color:var(--text-muted)">Cloud non configuré.</div>`;
    return;
  }

  zone.innerHTML = `<div style="font-size:.65rem;color:var(--text-dim)">Vérification…</div>`;
  const identite = await obtenirIdentiteDiscord();
  // Si toujours pas d'identité et qu'une erreur avait été détectée au retour
  // d'OAuth, on la garde affichée plutôt que de l'effacer silencieusement.
  afficherStatutDiscordLink(identite, identite ? null : _derniereErreurDiscord);
}

function afficherStatutDiscordLink(identite, messageErreur) {
  _dernierIdentiteDiscord = identite || null;
  _derniereErreurDiscord  = (!identite && messageErreur) ? messageErreur : null;
  _majBadgeHeaderDiscord(identite, messageErreur);

  const zone = document.getElementById('discordLinkZone');
  if (!zone) return;

  const erreurHTML = messageErreur
    ? `<div style="font-size:.63rem;color:#f87171;margin-bottom:.4rem">${messageErreur}</div>`
    : '';

  if (identite) {
    const pseudo = _pseudoDepuisIdentite(identite) || 'Compte Discord lié';
    const avatar = _avatarDepuisIdentite(identite);
    zone.innerHTML = `
      ${erreurHTML}
      <div style="display:flex;align-items:center;gap:.5rem">
        ${avatar
          ? `<img src="${avatar}" alt="" style="width:22px;height:22px;border-radius:50%;flex-shrink:0" />`
          : `<span style="flex-shrink:0">🔗</span>`}
        <span style="flex:1;font-size:.72rem;color:#5865F2;font-weight:700;overflow:hidden;
          text-overflow:ellipsis;white-space:nowrap">
          ${pseudo}
        </span>
        <button onclick="delierCompteDiscord()"
          style="flex-shrink:0;background:rgba(248,113,113,.12);border:1px solid rgba(248,113,113,.35);
            color:#f87171;border-radius:8px;padding:.3rem .6rem;font-size:.65rem;font-weight:800;
            cursor:pointer">
          Délier
        </button>
      </div>
    `;
  } else {
    zone.innerHTML = `
      ${erreurHTML}
      <button onclick="lierCompteDiscord()"
        style="width:100%;display:flex;align-items:center;justify-content:center;gap:.5rem;
          background:#5865F2;border:none;color:#fff;border-radius:10px;padding:.55rem .75rem;
          font-size:.75rem;font-weight:800;cursor:pointer;letter-spacing:.02em;transition:filter .15s"
        onmouseover="this.style.filter='brightness(1.1)'"
        onmouseout="this.style.filter='brightness(1)'">
        🔗 Lier mon compte Discord
      </button>
    `;
  }
}

/* ── Badge permanent dans le header : visible dès que le cloud est prêt,
   montre l'avatar Discord si lié (pour qu'on SACHE qu'on est connecté),
   sinon une invite discrète à lier. Cliquable dans les deux cas. ── */
function _majBadgeHeaderDiscord(identite, messageErreur) {
  const chip = document.getElementById('discordHeaderChip');
  const content = document.getElementById('discordHeaderContent');
  if (!chip || !content) return;

  // Le cloud doit être prêt pour proposer quoi que ce soit
  if (!_dlClient()) { chip.style.display = 'none'; return; }

  chip.style.display = 'flex';

  if (messageErreur && !identite) {
    chip.style.borderColor = 'rgba(248,113,113,.6)';
    chip.title = `${messageErreur} (clique pour ouvrir le détail)`;
    content.innerHTML = `<span class="lbl" style="color:#f87171">⚠️ Erreur Discord</span>`;
    return;
  }

  if (identite) {
    const pseudo = _pseudoDepuisIdentite(identite) || 'Discord';
    const avatar = _avatarDepuisIdentite(identite);
    chip.style.borderColor = 'rgba(88,101,242,.5)';
    chip.title = `Connecté à Discord — ${pseudo} (clique pour gérer)`;
    content.innerHTML = `
      ${avatar
        ? `<img src="${avatar}" alt="" style="width:18px;height:18px;border-radius:50%;vertical-align:middle;margin-right:.35rem" />`
        : '🔗 '}
      <span class="lbl" style="color:#5865F2;font-weight:700">${pseudo}</span>
    `;
  } else {
    chip.style.borderColor = 'rgba(88,101,242,.4)';
    chip.title = 'Lier mon compte Discord';
    content.innerHTML = `<span class="lbl" style="color:#5865F2">🔗 Lier Discord</span>`;
  }
}

/* ── Clic sur le badge header : gère direct si pas encore lié,
   sinon ouvre le modal (où se trouve le bouton "Délier") ── */
async function onClickDiscordHeaderChip() {
  if (_dernierIdentiteDiscord || _derniereErreurDiscord) {
    if (typeof ouvrirModal === 'function') ouvrirModal('modalLeaderboard');
    if (typeof ouvrirLeaderboard === 'function') ouvrirLeaderboard();
  } else {
    lierCompteDiscord();
  }
}

/* ── Nettoie les paramètres OAuth de l'URL après retour de redirection
   (Supabase les consomme automatiquement pour créer la session, mais
   les laisse traîner dans l'URL sinon) ── */
function _nettoyerUrlApresOAuth() {
  const url = new URL(window.location.href);
  const aDesParams = url.hash.includes('access_token') || url.hash.includes('error')
    || url.search.includes('code=') || url.searchParams.has('error');
  if (aDesParams) {
    url.hash   = '';
    url.search = '';
    window.history.replaceState({}, document.title, url.toString());
  }
}

/* ── Lit error / error_description dans l'URL de retour, AVANT nettoyage.
   Supabase les pose en query params (?error=...&error_description=...)
   ou parfois dans le hash selon le type d'échec. Le cas typique ici :
   "Manual linking" pas activé côté dashboard → linkIdentity redirige
   quand même vers Discord, mais revient en erreur après coup. ── */
function _lireErreurRetourOAuth() {
  const url = new URL(window.location.href);
  const hashParams = new URLSearchParams(url.hash.replace(/^#/, ''));
  const error            = url.searchParams.get('error')             || hashParams.get('error');
  const errorDescription = url.searchParams.get('error_description') || hashParams.get('error_description');
  if (!error) return null;
  return decodeURIComponent(errorDescription || error).replace(/\+/g, ' ');
}

/* ── Point d'entrée, appelé depuis main.js après initCloudSave() ── */
function initDiscordLink() {
  const client = _dlClient();
  if (!client) return;

  const erreurRetour = _lireErreurRetourOAuth();
  _nettoyerUrlApresOAuth();

  if (erreurRetour) {
    console.error('[discordlink] Retour OAuth en erreur :', erreurRetour);
    afficherStatutDiscordLink(null, `⚠️ Discord : ${erreurRetour}`);
  } else {
    rafraichirStatutDiscordLink();
  }

  // Rafraîchit le badge automatiquement au retour d'OAuth (nouvelle
  // identité détectée) ou à tout changement de session.
  client.auth.onAuthStateChange((event) => {
    if (event === 'USER_UPDATED' || event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
      rafraichirStatutDiscordLink();
    }
  });
}
