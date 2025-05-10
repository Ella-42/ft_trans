# Using Alpine for it's minimal OS
FROM alpine:latest

# Set our working directory to the root services directory
WORKDIR /srv

# Install NPM and NodeJS and set up environment variables and the Fastify server
RUN	apk add --no-cache npm nodejs \
&&	npm install dotenv fastify

# Start the authenticator
ENTRYPOINT node google_authenticator.js
