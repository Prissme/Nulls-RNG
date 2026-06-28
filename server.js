/**
 * server.js — Proxy Discord pour Null's RNG
 *
 * Ce serveur Express tourne sur le port 3000 (à côté de nginx sur 8080).
 * Il expose un seul endpoint POST /api/discord qui relaie le message
 * à l'API Discord avec le Bot Token — côté serveur, sans problème CORS.
 *
 * Variables d'environnement (Koyeb) :
 *   DISCORD_BOT_TOKEN   — token du bot Discord
 *   DISCORD_CHANNEL_ID  — ID du salon cible
 */

const http  = require('http');
const https = require('https');
const url   = require('url');

const PORT       = 3000;
const BOT_TOKEN  = process.env.DISCORD_BOT_TOKEN  || '';
const CHANNEL_ID = process.env.DISCORD_CHANNEL_ID || '';

const server = http.createServer((req, res) => {
  // Headers CORS : autorise le frontend servi par nginx (même domaine Koyeb)
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  if (req.method === 'POST' && req.url === '/api/discord') {
    if (!BOT_TOKEN || !CHANNEL_ID) {
      res.writeHead(503, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Discord non configuré' }));
      return;
    }

    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      // Relaie vers Discord
      const discordReq = https.request({
        hostname: 'discord.com',
        path: `/api/v10/channels/${CHANNEL_ID}/messages`,
        method: 'POST',
        headers: {
          'Content-Type':  'application/json',
          'Authorization': `Bot ${BOT_TOKEN}`,
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
