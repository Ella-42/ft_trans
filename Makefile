# **************************************************************************** #
#                                                                              #
#                                                         :::      ::::::::    #
#    Makefile                                           :+:      :+:    :+:    #
#                                                     +:+ +:+         +:+      #
#    By: lpeeters <lpeeters@student.s19.be>         +#+  +:+       +#+         #
#                                                 +#+#+#+#+#+   +#+            #
#    Created: 2025/03/04 21:07:01 by lpeeters          #+#    #+#              #
#    Updated: 2025/08/27 21:54:10 by lpeeters         ###   ########.fr        #
#                                                                              #
# **************************************************************************** #

# List of container names
containers = nginx authenticator mailserver database websocket

# Expand name parameter to filter argument
define nameFilter
--filter "name=$1"
endef

# Filter status and cleanup by project name
statusFilter = $(foreach name, $(containers), $(call nameFilter, $(name)))
cleanFilter = --filter "label=com.docker.compose.project=ft_trans"

# Silence error output
silent = 2> /dev/null

# Name, build and launch the Docker stack
up:
	@docker-compose -p ft_trans up --build -d

# Stop the Docker stack
down:
	@docker-compose down

# Check Docker stack status
status:
	@docker ps -a $(statusFilter)

# Shell into the Builder Docker container
builder:
	@docker exec -it builder sh

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

# Shell into the websocket Docker container
websocket:
	@docker exec -it websocket sh

# Remove all Docker containers, images, volumes and networks
clean:
	@docker stop $$(docker ps -qa $(cleanFilter)) $(silent); \
	 docker rm $$(docker ps -qa $(cleanFilter)) $(silent); \
	 docker rmi -f $$(docker images -qa $(cleanFilter)) $(silent); \
	 docker volume rm $$(docker volume ls -q $(cleanFilter)) $(silent); \
	 docker network rm $$(docker network ls -q $(cleanFilter)) $(silent) || true

# Display logs for various services
log:
	@	echo "database:\n"; \
		docker logs database \
	&&	echo "\n\nwebsocket:\n" \
	&&	docker logs websocket \
	&&	echo "\n\nauthenticator:\n" \
	&&	docker logs authenticator \
	&&	echo "\n\nmailserver:\n" \
	&&	docker logs mailserver \
	&&	echo "\n\nNginx:\n" \
	&&	docker logs nginx \
	&&	echo "\n\nBuilder:\n" \
	&&	docker logs builder

# Display logs for the Builder Docker container
logBuilder:
	@docker logs builder

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

# Display logs for the websocket Docker container
logWebsocket:
	@docker logs websocket

# Restart the Docker stack
re: down clean up

# Restart the Nginx Docker container
reBuilder:
	@docker restart builder

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

# Restart the websocket Docker container
reWebsocket:
	@docker restart websocket

# Targets
.PHONY: up down status builder nginx authenticator mailserver database websocket clean log logBuilder logNginx logAuthenticator logMailserver logDatabase logWebsocket re reBuilder reNginx reAuthenticator reMailserver reDatabase reWebsocket
