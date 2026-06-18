# ── Null's RNG — Image de production ──────────────────────────────────────
FROM nginx:alpine

# gettext fournit envsubst, utilisé pour injecter les variables Koyeb
RUN apk add --no-cache gettext

# Copier tous les fichiers du jeu
COPY index.html          /usr/share/nginx/html/index.html
COPY css/                /usr/share/nginx/html/css/
COPY js/                 /usr/share/nginx/html/js/
COPY BackgroundNRNG.webp /usr/share/nginx/html/BackgroundNRNG.webp

COPY nginx.conf /etc/nginx/conf.d/default.conf

COPY docker-entrypoint.sh /docker-entrypoint.sh
RUN chmod +x /docker-entrypoint.sh

EXPOSE 8080
ENTRYPOINT ["/docker-entrypoint.sh"]
CMD ["nginx", "-g", "daemon off;"]
