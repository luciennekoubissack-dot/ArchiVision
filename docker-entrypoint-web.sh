#!/bin/sh
# Substitue les variables d'environnement dans le template nginx.conf
# et démarre Nginx.
#
# Variable requise :
#   NGINX_API_URL — URL du service API (ex. http://api:3000 ou https://api.xxx.railway.app)

set -e

# Valeur par défaut si la variable n'est pas définie (Docker Compose local)
: "${NGINX_API_URL:=http://api:3000}"

envsubst '${NGINX_API_URL}' \
  < /etc/nginx/templates/archivision.conf.template \
  > /etc/nginx/conf.d/archivision.conf

echo "Nginx config générée (NGINX_API_URL=${NGINX_API_URL})"

exec nginx -g "daemon off;"
