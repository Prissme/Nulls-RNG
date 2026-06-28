#!/bin/sh
set -e

# Injecte les variables d'environnement Koyeb dans js/config.js
envsubst '${SUPABASE_URL} ${SUPABASE_ANON_KEY} ${DISCORD_BOT_TOKEN} ${DISCORD_CHANNEL_ID}' \
  < /usr/share/nginx/html/js/config.template.js \
  > /usr/share/nginx/html/js/config.js

# Lance le proxy Discord en arrière-plan (Node.js sur le port 3000)
node /app/server.js &

exec "$@"
