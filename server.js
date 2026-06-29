/**
 * server.js — Proxy Discord pour Null's RNG
 *
 * Variables d'environnement (Koyeb) :
 *   DISCORD_BOT_TOKEN   — token du bot Discord
 *   DISCORD_CHANNEL_ID  — ID du salon cible
 *   PROXY_SECRET        — clé partagée avec le frontend (header X-Proxy-Secret)
 */

const http  = require('http');
const https = require('https');

const PORT        = 3000;
const BOT_TOKEN   = process.env.DISCORD_BOT_TOKEN  || '';
const CHANNEL_ID  = process.env.DISCORD_CHANNEL_ID || '';
const PROXY_SECRET = process.env.PROXY_SECRET       || '';

/* ── Rate-limit par IP : max 10 requêtes / 60 s ── */
const RL_MAX      = 10;
const RL_FENETRE  = 60_000;
const _rlMap      = new Map(); // ip → { count, resetAt }

function rateLimit(ip) {
  const now = Date.now();
  let entry = _rlMap.get(ip);
  if (!entry || now > entry.resetAt) {
    entry = { count: 0, resetAt: now + RL_FENETRE };
    _rlMap.set(ip, entry);
  }
  entry.count++;
  return entry.count > RL_MAX;
}

/* ── Nettoyage périodique pour éviter les fuites mémoire ── */
setInterval(() => {
  const now = Date.now();
  for (const [ip, e] of _rlMap) if (now > e.resetAt) _rlMap.delete(ip);
}, RL_FENETRE);

const ALLOWED_ORIGIN = process.env.ALLOWED_ORIGIN || '';

const server = http.createServer((req, res) => {
  const origin = req.headers['origin'] || '';

  // CORS : restreint à l'origine Koyeb si ALLOWED_ORIGIN est défini,
  // sinon fallback sur * (dev local sans env var)
  const allowOrigin = ALLOWED_ORIGIN ? ALLOWED_ORIGIN : '*';
  res.setHeader('Access-Control-Allow-Origin', allowOrigin);
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-Proxy-Secret');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  if (req.method === 'POST' && req.url === '/api/discord') {

    // ── 1. Vérification clé secrète ──
    if (PROXY_SECRET && req.headers['x-proxy-secret'] !== PROXY_SECRET) {
      res.writeHead(403, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Forbidden' }));
      return;
    }

    // ── 2. Rate-limit par IP ──
    const ip = req.socket.remoteAddress || 'unknown';
    if (rateLimit(ip)) {
      res.writeHead(429, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Too many requests' }));
      return;
    }

    // ── 3. Config manquante ──
    if (!BOT_TOKEN || !CHANNEL_ID) {
      res.writeHead(503, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Discord non configuré' }));
      return;
    }

    let body = '';
    req.on('data', chunk => {
      body += chunk;
      if (body.length > 8192) { // limite 8 Ko pour éviter les gros payloads
        res.writeHead(413, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Payload trop grand' }));
        req.destroy();
      }
    });
    req.on('end', () => {
      const discordReq = https.request({
        hostname: 'discord.com',
        path:     `/api/v10/channels/${CHANNEL_ID}/messages`,
        method:   'POST',
        headers: {
          'Content-Type':   'application/json',
          'Authorization':  `Bot ${BOT_TOKEN}`,
          'Content-Length': Buffer.byteLength(body),
        },
      }, (discordRes) => {
        let data = '';
        discordRes.on('data', c => { data += c; });
        discordRes.on('end', () => {
          res.writeHead(discordRes.statusCode, { 'Content-Type': 'application/json' });
          res.end(data);
        });
      });

      discordReq.on('error', (err) => {
        console.error('[discord-proxy] Erreur :', err.message);
        res.writeHead(502, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: err.message }));
      });

      discordReq.write(body);
      discordReq.end();
    });
    return;
  }

  res.writeHead(404);
  res.end('Not found');
});

server.listen(PORT, () => {
  console.log(`[discord-proxy] Proxy Discord actif sur le port ${PORT}`);
});
