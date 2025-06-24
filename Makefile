# **************************************************************************** #
#                                                                              #
#                                                         :::      ::::::::    #
#    Makefile                                           :+:      :+:    :+:    #
#                                                     +:+ +:+         +:+      #
#    By: lpeeters <lpeeters@student.s19.be>         +#+  +:+       +#+         #
#                                                 +#+#+#+#+#+   +#+            #
#    Created: 2025/03/04 21:07:01 by lpeeters          #+#    #+#              #
#    Updated: 2025/06/24 22:47:46 by lpeeters         ###   ########.fr        #
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

# Display logs for various services
logs:
	@	echo "database:\n"; \
		docker logs database \
	&&	echo "\n\nauthenticator:\n" \
	&&	docker logs authenticator \
	&&	echo "\n\nmailserver:\n" \
	&&	docker logs mailserver \
	&&	echo "\n\nNginx:\n" \
	&&	docker logs nginx

# Shell into the Nginx Docker container
nginx:
	@docker exec -it nginx sh

# Shell into the authenticator Docker container
authenticator:
	@docker exec -it authenticator sh

# Shell into the mailserver Docker container
mailserver:
	@docker exec -it mailserver sh

# Shell into the server Docker container
database:
	@docker exec -it database sh

# Remove all Docker containers, images, volumes and networks
clean:
	@docker stop $$(docker ps -qa) $(silent); \
	 docker rm $$(docker ps -qa) $(silent); \
	 docker rmi -f $$(docker images -qa) $(silent); \
	 docker volume rm $$(docker volume ls -q) $(silent); \
	 docker network rm $$(docker network ls -q) $(silent) || true

# Restart the Docker stack
re: down clean up

# Targets
.PHONY: up down status nginx authenticator mailserver database logs clean re
