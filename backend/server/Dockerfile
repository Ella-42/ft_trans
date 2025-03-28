FROM alpine:latest

ENV DB_PATH="/var/www/db/pong.sqlite"


RUN mkdir -p /var/www/js && chmod -R 0755 /var/www/js

WORKDIR /var/www/js

COPY ./backend/server/package.json /var/www/js/package.json

RUN apk add --no-cache \
    nodejs \
    npm \
    sqlite \
    sqlite-libs

RUN npm install

RUN /bin/sh -c ' \
    rm -f package.json'

RUN mkdir -p /var/www/db && chmod -R 0755 /var/www/db

RUN /bin/sh -c ' \
    echo "Listing /var/www/db contents:" && \
    ls -l /var/www/db && \
    if [ -f "$DB_PATH" ]; then \
        echo "Database already exists."; \
    else \
        echo "Creating SQLite database file: pong.sqlite"; \
        sqlite3 "$DB_PATH" ".databases"; \
        sqlite3 "$DB_PATH" "CREATE TABLE IF NOT EXISTS users ( \
            id INTEGER PRIMARY KEY AUTOINCREMENT, \
            nickname TEXT NOT NULL UNIQUE, \
            password TEXT NOT NULL, \
            email TEXT NOT NULL UNIQUE \
        );"; \
        echo "Database and user initialized."; \
    fi && \
    echo "SQLite database setup completed."'

ENTRYPOINT ["node", "test.js"]
