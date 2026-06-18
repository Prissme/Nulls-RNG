# ── Null's RNG — Image de production ──────────────────────────────────────
FROM nginx:alpine

# gettext fournit envsubst, utilisé pour injecter les variables Koyeb
RUN apk add --no-cache gettext

# Créer le sous-dossier pour les images du système de combat
RUN mkdir -p /usr/share/nginx/html/images/

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

# Nouvelles images des Robots de combat (dans le sous-dossier images/)
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
