FROM alpine:latest

WORKDIR /var/www/js

RUN	apk add --no-cache nodejs npm

ENTRYPOINT \
	npm install fastify \
&&	node test.js
