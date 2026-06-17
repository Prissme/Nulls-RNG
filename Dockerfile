# ── Null's RNG — Image de production ──────────────────────────────────────
# Serveur statique ultra-léger basé sur nginx Alpine (~25 MB)
FROM nginx:alpine

# Copier le fichier du jeu dans le dossier servi par nginx
COPY index.html /usr/share/nginx/html/index.html

# Koyeb expose le port 8080 par défaut — on redirige nginx vers ce port
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Exposer le port 8080
EXPOSE 8080

# Démarrage de nginx en mode foreground (obligatoire pour Docker)
CMD ["nginx", "-g", "daemon off;"]
