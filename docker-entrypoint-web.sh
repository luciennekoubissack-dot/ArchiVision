#!/bin/sh
# Génère la config Nginx en remplaçant le placeholder par l'URL de l'API.
# Utilise la syntaxe sed POSIX compatible avec busybox (Alpine).

set -e

: "${NGINX_API_URL:=http://api:3000}"

# Remplace le placeholder par l'URL de l'API (syntaxe sed busybox/Alpine)
sed "s#NGINX_API_URL_PLACEHOLDER#${NGINX_API_URL}#g" \
  /etc/nginx/templates/archivision.conf.template \
  > /etc/nginx/conf.d/archivision.conf

echo "Nginx config générée (NGINX_API_URL=${NGINX_API_URL})"

exec nginx -g "daemon off;"
