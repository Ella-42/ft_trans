FROM alpine:3.21

RUN mkdir -p /var/www/dummy && chmod -R 0755 /var/www/dummy

WORKDIR /var/www/dummy

COPY ./dummy/src/package.json /var/www/dummy/package.json

RUN apk add --no-cache \
    nodejs \
    npm

RUN npm install

RUN npm install fastify

EXPOSE 8080

ENTRYPOINT ["node", "/var/www/dummy/server.js"]
