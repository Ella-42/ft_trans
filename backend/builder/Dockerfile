# Using Alpine for it's minimal OS
FROM alpine:latest

# Set our working directory to the root services directory
WORKDIR /srv

# Install NPM, NodeJS and Fastify
RUN	apk add --no-cache npm nodejs

# Start the authenticator
ENTRYPOINT	npm install --production=false \
&&			npm run build
