FROM alpine:latest


RUN mkdir -p /var/www/ws && chmod -R 0755 /var/www/ws

WORKDIR /var/www/ws

COPY ./backend/websocket/package.json /var/www/ws/package.json

RUN apk add --no-cache \
    nodejs \
    npm

RUN npm install

ENTRYPOINT ["node", "ws.js"]
