# ── Null's RNG — Image de production ──────────────────────────────────────
FROM nginx:alpine

# Copier tous les fichiers du jeu
COPY index.html /usr/share/nginx/html/index.html
COPY css/       /usr/share/nginx/html/css/
COPY js/        /usr/share/nginx/html/js/

COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 8080
CMD ["nginx", "-g", "daemon off;"]
