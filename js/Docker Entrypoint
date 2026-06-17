#!/bin/sh
set -e

# Injecte les variables d'environnement Koyeb (SUPABASE_URL, SUPABASE_ANON_KEY)
# dans js/config.js à partir du template, juste avant de démarrer nginx.
envsubst '${SUPABASE_URL} ${SUPABASE_ANON_KEY}' \
  < /usr/share/nginx/html/js/config.template.js \
  > /usr/share/nginx/html/js/config.js

exec "$@"
