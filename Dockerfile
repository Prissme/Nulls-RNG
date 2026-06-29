# ── Null's RNG — Image de production ──────────────────────────────────────
FROM nginx:alpine

# gettext = envsubst, nodejs = proxy Discord
RUN apk add --no-cache gettext nodejs

# Créer le sous-dossier pour les images du jeu
RUN mkdir -p /usr/share/nginx/html/images/ /app

# Proxy Discord : server.js écrit directement dans l'image (pas de COPY)
RUN cat > /app/server.js << 'JSEOF'
const http  = require('http');
const https = require('https');

const PORT       = 3000;
const BOT_TOKEN  = process.env.DISCORD_BOT_TOKEN  || '';
const CHANNEL_ID = process.env.DISCORD_CHANNEL_ID || '';

const server = http.createServer((req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') { res.writeHead(204); res.end(); return; }

  if (req.method === 'POST' && req.url === '/api/discord') {
    if (!BOT_TOKEN || !CHANNEL_ID) {
      res.writeHead(503, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Discord non configuré' }));
      return;
    }
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      const discordReq = https.request({
        hostname: 'discord.com',
        path: '/api/v10/channels/' + CHANNEL_ID + '/messages',
        method: 'POST',
        headers: {
          'Content-Type':  'application/json',
          'Authorization': 'Bot ' + BOT_TOKEN,
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
        res.writeHead(502, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: err.message }));
      });
      discordReq.write(body);
      discordReq.end();
    });
    return;
  }
  res.writeHead(404); res.end('Not found');
});

server.listen(PORT, () => console.log('[discord-proxy] Port ' + PORT));
JSEOF

# Copier tous les fichiers de base du jeu
COPY index.html          /usr/share/nginx/html/index.html
COPY css/                /usr/share/nginx/html/css/
COPY js/                 /usr/share/nginx/html/js/
COPY BackgroundNRNG.webp /usr/share/nginx/html/BackgroundNRNG.webp

# Images des brawlers (à la racine)
COPY ShellyNormal.webp   /usr/share/nginx/html/ShellyNormal.webp
COPY ColtNormal.webp     /usr/share/nginx/html/ColtNormal.webp
COPY NitaNormal.webp     /usr/share/nginx/html/NitaNormal.webp
COPY PocoNormal.webp     /usr/share/nginx/html/PocoNormal.webp
COPY BarleyNormal.webp   /usr/share/nginx/html/BarleyNormal.webp
COPY BullNormal.webp     /usr/share/nginx/html/BullNormal.webp
COPY PrimoNormal.webp    /usr/share/nginx/html/PrimoNormal.webp
COPY RosaNormal.webp     /usr/share/nginx/html/RosaNormal.webp
COPY BrockNormal.webp    /usr/share/nginx/html/BrockNormal.webp
COPY JessieNormal.webp   /usr/share/nginx/html/JessieNormal.webp
COPY RicoNormal.webp     /usr/share/nginx/html/RicoNormal.webp
COPY DynaNormal.webp     /usr/share/nginx/html/DynaNormal.webp
COPY GusNormal.webp      /usr/share/nginx/html/GusNormal.webp
COPY JackyNormal.webp    /usr/share/nginx/html/JackyNormal.webp
COPY 8bitNormal.webp     /usr/share/nginx/html/8bitNormal.webp
COPY PennyNormal.webp    /usr/share/nginx/html/PennyNormal.webp
COPY TickNormal.webp     /usr/share/nginx/html/TickNormal.webp
COPY CarlNormal.webp     /usr/share/nginx/html/CarlNormal.webp
COPY DarrylNormal.webp   /usr/share/nginx/html/DarrylNormal.webp

# Brawlers Épiques
COPY BoNormal.webp       /usr/share/nginx/html/BoNormal.webp
COPY PiperNormal.webp    /usr/share/nginx/html/PiperNormal.webp
COPY PamNormal.webp      /usr/share/nginx/html/PamNormal.webp
COPY FrankNormal.webp    /usr/share/nginx/html/FrankNormal.webp
COPY BibiNormal.webp     /usr/share/nginx/html/BibiNormal.webp

# Easter egg Naell
COPY Naell.webp            /usr/share/nginx/html/Naell.webp

# Images des rôles (à la racine)
COPY Tanks.webp          /usr/share/nginx/html/Tanks.webp
COPY Pokes.webp          /usr/share/nginx/html/Pokes.webp
COPY Bursts.webp         /usr/share/nginx/html/Bursts.webp
COPY Soutiens.webp       /usr/share/nginx/html/Soutiens.webp

# Images additionnelles (dans le sous-dossier images/)
COPY HugeWished.webp     /usr/share/nginx/html/HugeWished.webp
COPY Coins.webp          /usr/share/nginx/html/images/Coins.webp
COPY Robot.webp          /usr/share/nginx/html/images/Robot.webp
COPY BigRobot.webp       /usr/share/nginx/html/images/BigRobot.webp
COPY SniperRobot.webp    /usr/share/nginx/html/images/SniperRobot.webp
COPY BoxerRobot.webp     /usr/share/nginx/html/images/BoxerRobot.webp

COPY nginx.conf /etc/nginx/conf.d/default.conf

COPY docker-entrypoint.sh /docker-entrypoint.sh
RUN chmod +x /docker-entrypoint.sh

EXPOSE 8080
ENTRYPOINT ["/docker-entrypoint.sh"]
CMD ["nginx", "-g", "daemon off;"]
