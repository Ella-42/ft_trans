FROM alpine:latest

RUN mkdir -p /var/www/js && chmod -R 0755 /var/www/js

WORKDIR /var/www/js

COPY ./backend/database/package.json /var/www/js/package.json

RUN apk add --no-cache \
    nodejs \
    npm \
    sqlite \
    sqlite-libs

RUN npm install

RUN mkdir -p /var/www/db && chmod -R 0755 /var/www/db

ENTRYPOINT ["node", "api.js"]
