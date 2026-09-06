#!/bin/sh
# Génère la config Nginx en remplaçant NGINX_API_URL par sed (pas envsubst)
# pour ne pas toucher aux variables internes Nginx ($host, $remote_addr, etc.)

set -e

: "${NGINX_API_URL:=http://api:3000}"

sed "s|NGINX_API_URL_PLACEHOLDER|${NGINX_API_URL}|g" \
  /etc/nginx/templates/archivision.conf.template \
  > /etc/nginx/conf.d/archivision.conf

echo "Nginx config générée (NGINX_API_URL=${NGINX_API_URL})"

exec nginx -g "daemon off;"
