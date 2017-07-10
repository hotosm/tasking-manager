#!make
export SHELL := /bin/bash

# Platform-specific variables
# ---------------------------
PLATFORM_INFO:= $(shell python -m platform)
ifeq ($(findstring Ubuntu,$(PLATFORM_INFO)),Ubuntu)
	PLATFORM:= ubuntu
endif
ifeq ($(findstring Darwin,$(PLATFORM_INFO)),Darwin)
	PLATFORM:= darwin
endif

# https://stackoverflow.com/questions/10858261/abort-makefile-if-variable-not-set
# Check that given variables are set and all have non-empty values,
# die with an error otherwise.
#
# Params:
#   1. Variable name(s) to test.
#   2. (optional) Error message to print.
check_defined = \
    $(strip $(foreach 1,$1, \
        $(call __check_defined,$1,$(strip $(value 2)))))
__check_defined = \
    $(if $(value $1),, \
      $(error Undefined $1$(if $2, ($2))))

$(call check_defined, ENV, environment variable required)

# Add all app specific variables to a .env$(ENV) file.
# Call ENV=$(ENV) make command to include these variables
include .env$(ENV)
export $(shell sed 's/=.*//' .env$(ENV))

test:
	env

# Check users permissions on client account
# --------------
permission: ## check AWS permissions
	aws iam get-user

# Check dependencies
# --------------
check:
	# check docker and docker-compose versions
check-db:
	# ensure TM_DB_HOST has been set
check-backup:
	# ensure TM_BACKUP

# Build Docker image
# --------------
buildops: check ## build ops image
	docker build \
	  --no-cache=true \
		--file Dockerfile.ops \
		--tag hotosm-taskingmanager-ops \
		.

migrations: check
	echo -e "\x1b[0;92m run migration script \x1b[0m"; \
	docker run -it \
		-e PGPASSWORD=$$TM_DB_PASSWORD \
		-e TM_DB="postgresql://$$TM_DB_USER:$$TM_DB_PASSWORD@$$TM_DB_HOST/$$TM_DB_DB" \
		-v ${PWD}:/src \
		hotosm-taskingmanager-ops \
		su -c "cd /src && python manage.py db upgrade"

fresh:
	@echo -e ">>> \e[31m fresh db \e[0m : \x1b[0;92m ctrl + c to cancel\ x1b[0m <<<"; \
	sleep 0; \
	echo -e "\x1b[0;92m dropping all connections \x1b[0m" ; \
	docker run -it \
		-e PGPASSWORD=$$TM_DB_PASSWORD \
		hotosm-taskingmanager-ops \
		psql -h $$TM_DB_HOST tm3 taskingmanager \
		-c "SELECT pg_terminate_backend(pg_stat_activity.pid) \
				FROM pg_stat_activity \
				WHERE pg_stat_activity.datname = 'tm3' \
				  AND pid <> pg_backend_pid();"; \
	echo -e "\x1b[0;92m dropping database \x1b[0m"; \
	docker run -it \
		-e PGPASSWORD=$$TM_DB_PASSWORD \
		hotosm-taskingmanager-ops \
		dropdb --if-exists -h $$TM_DB_HOST -U taskingmanager tm3 ; \
	echo -e "\x1b[0;92m creating database \x1b[0m"; \
	docker run -it \
		-e PGPASSWORD=$$TM_DB_PASSWORD \
		hotosm-taskingmanager-ops \
		createdb -h $$TM_DB_HOST -U taskingmanager -T template0 tm3 ; \
	echo -e "\x1b[0;92m enabling postgis \x1b[0m"; \
	docker run -it \
		-e PGPASSWORD=$$TM_DB_PASSWORD \
		hotosm-taskingmanager-ops \
		psql -h $$TM_DB_HOST tm3 taskingmanager -c "CREATE EXTENSION postgis;"

restore:
		@echo -e ">>> \e[31m restore db \e[0m : \x1b[0;92m ctrl + c to cancel\ x1b[0m <<<"; \
		sleep 0; \
		echo -e "\x1b[0;92m restoring database \x1b[0m"; \
		docker run -it \
			-e PGPASSWORD=$$TM_DB_PASSWORD \
			-v ${PWD}:/src \
			hotosm-taskingmanager-ops \
			pg_restore --no-privileges --no-owner -h $$TM_DB_HOST -U taskingmanager -d tm3 /src/tm2_backup.dmp

psql:
	@echo -e ">>> \e[31m migrate tm2 to tm3 \e[0m : \x1b[0;92m ctrl + c to cancel\ x1b[0m <<<"; \
	sleep 0; \
	echo -e "\x1b[0;92m move tm2 schema to hotold \x1b[0m"; \
	docker run -it \
		-e PGPASSWORD=$$TM_DB_PASSWORD \
		-v ${PWD}:/src \
		hotosm-taskingmanager-ops \
		psql -h $$TM_DB_HOST tm3 taskingmanager \

bash:
	@echo -e ">>> \e[31m migrate tm2 to tm3 \e[0m : \x1b[0;92m ctrl + c to cancel\ x1b[0m <<<"; \
	sleep 0; \
	echo -e "\x1b[0;92m move tm2 schema to hotold \x1b[0m"; \
	docker run -it \
		-e PGPASSWORD=$$TM_DB_PASSWORD \
		-v ${PWD}:/src \
		hotosm-taskingmanager-ops \
		bash

tm2-schema:
	@echo -e ">>> \e[31m migrate tm2 to tm3 \e[0m : \x1b[0;92m ctrl + c to cancel\ x1b[0m <<<"; \
	sleep 0; \
	echo -e "\x1b[0;92m move tm2 schema to hotold \x1b[0m"; \
	docker run -it \
		-e PGPASSWORD=$$TM_DB_PASSWORD \
		-v ${PWD}:/src \
		hotosm-taskingmanager-ops \
		psql -h $$TM_DB_HOST tm3 taskingmanager -c "\
			CREATE SCHEMA hotold; \
			alter table public.areas set schema hotold; \
			alter table public.licenses set schema hotold; \
			alter table public.message set schema hotold; \
			alter table public.priority_area set schema hotold; \
			alter table public.project set schema hotold; \
			alter table public.project_allowed_users set schema hotold; \
			alter table public.project_priority_areas set schema hotold; \
			alter table public.project_translation set schema hotold; \
			alter table public.task set schema hotold; \
			alter table public.task_comment set schema hotold; \
			alter table public.task_lock set schema hotold; \
			alter table public.task_state set schema hotold; \
			alter table public.users set schema hotold; \
			alter table public.users_licenses set schema hotold;"

tm2-script:
	echo -e "\x1b[0;92m run migration script \x1b[0m"; \
	docker run -it \
		-e PGPASSWORD=$$TM_DB_PASSWORD \
		-e TM_DB="postgresql://$$TM_DB_USER:$$TM_DB_PASSWORD@$$TM_DB_HOST/$$TM_DB_DB" \
		-v ${PWD}:/src \
		hotosm-taskingmanager-ops \
		psql \
		  -h $$TM_DB_HOST \
			-U $$TM_DB_USER \
		  -d $$TM_DB_DB \
		  -a \
			-f /src/devops/tm2-pg-migration/migrationscripts.sql

# PHONY (non-file) Targets
# ------------------------
.PHONY: help permission

.DEFAULT_GOAL := help

help: ## Show this help
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-30s\033[0m %s\n", $$1, $$2}'

# `make help` -  see http://marmelab.com/blog/2016/02/29/auto-documented-makefile.html
# ------------------------------------------------------------------------------------
