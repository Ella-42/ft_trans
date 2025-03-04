# Using Alpine for it's minimal OS
FROM alpine:latest

# Install Nginx and set up the run directory
RUN	apk add --no-cache nginx \
&&	mkdir -p /run/nginx /var/www/js \
&&	chown -R nobody:nobody /run/nginx /var/www/js

# Start Nginx
ENTRYPOINT nginx -g 'daemon off;'
