# Using Alpine for it's minimal OS
FROM alpine:latest

# Install Nginx and set up the run directory
RUN	apk add --no-cache nginx nginx-mod-http-js \
&&	mkdir -p /run/nginx /var/www/js /var/www/html \
&&	chown -R nobody:nobody /run/nginx /var/www/js /var/www/html

# Start Nginx
ENTRYPOINT nginx -g 'daemon off;'
