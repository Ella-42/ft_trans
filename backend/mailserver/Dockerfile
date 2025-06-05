# Using Alpine for it's minimal OS
FROM alpine:latest

# Set our working directory to the root services directory
WORKDIR /srv

# Install NPM and NodeJS and set up environment variables
RUN	apk add --no-cache npm nodejs \
&&	npm install dotenv

# Start the email client
ENTRYPOINT node client.js
