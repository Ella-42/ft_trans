# **************************************************************************** #
#                                                                              #
#                                                         :::      ::::::::    #
#    Makefile                                           :+:      :+:    :+:    #
#                                                     +:+ +:+         +:+      #
#    By: lpeeters <lpeeters@student.s19.be>         +#+  +:+       +#+         #
#                                                 +#+#+#+#+#+   +#+            #
#    Created: 2025/03/04 21:07:01 by lpeeters          #+#    #+#              #
#    Updated: 2025/07/08 19:42:20 by lpeeters         ###   ########.fr        #
#                                                                              #
# **************************************************************************** #

# Silence error output
silent = 2> /dev/null

# Build and launch the Docker stack
up:
	@docker-compose up --build -d

# Stop the Docker stack
down:
	@docker-compose down

# Check Docker stack status
status:
	@docker ps -a

# Shell into the Nginx Docker container
nginx:
	@docker exec -it nginx sh

# Shell into the authenticator Docker container
authenticator:
	@docker exec -it authenticator sh

# Shell into the mailserver Docker container
mailserver:
	@docker exec -it mailserver sh

# Shell into the database Docker container
database:
	@docker exec -it database sh

# Remove all Docker containers, images, volumes and networks
clean:
	@docker stop $$(docker ps -qa) $(silent); \
	 docker rm $$(docker ps -qa) $(silent); \
	 docker rmi -f $$(docker images -qa) $(silent); \
	 docker volume rm $$(docker volume ls -q) $(silent); \
	 docker network rm $$(docker network ls -q) $(silent) || true

# Display logs for various services
log:
	@	echo "database:\n"; \
		docker logs database \
	&&	echo "\n\nauthenticator:\n" \
	&&	docker logs authenticator \
	&&	echo "\n\nmailserver:\n" \
	&&	docker logs mailserver \
	&&	echo "\n\nNginx:\n" \
	&&	docker logs nginx

# Display logs for the Nginx Docker container
logNginx:
	@docker logs nginx

# Display logs for the authenticator Docker container
logAuthenticator:
	@docker logs authenticator

# Display logs for the mailserver Docker container
logMailserver:
	@docker logs mailserver

# Display logs for the database Docker container
logDatabase:
	@docker logs database

# Restart the Docker stack
re: down clean up

# Restart the Nginx Docker container
reNginx:
	@docker restart nginx

# Restart the authenticator Docker container
reAuthenticator:
	@docker restart authenticator

# Restart the mailserver Docker container
reMailserver:
	@docker restart mailserver

# Restart the database Docker container
reDatabase:
	@docker restart database

# Targets
.PHONY: up down status nginx authenticator mailserver database clean log logNginx logAuthenticator logMailserver logDatabase re reNginx reAuthenticator reMailserver reDatabase
