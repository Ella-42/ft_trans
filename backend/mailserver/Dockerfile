# Using Alpine for it's minimal OS
FROM alpine:latest

# Set our working directory to the root services directory
WORKDIR /srv

# Install NPM, NodeJS, environment variables and Fastify
RUN	apk add --no-cache npm nodejs \
&&	npm install dotenv fastify

# Start Fastify API for email handling
ENTRYPOINT node mail.js
