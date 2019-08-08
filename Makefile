DOCKER_VERSION := $(shell docker --version 2>/dev/null)
DOCKER_COMPOSE_VERSION := $(shell docker-compose --version 2>/dev/null)

all:
ifndef DOCKER_VERSION
    $(error "command docker is not available, please install Docker")
endif
ifndef DOCKER_COMPOSE_VERSION
    $(error "command docker-compose is not available, please install Docker")
endif

build:
	docker-compose build --no-cache app

up:
	docker-compose up -d

down:
	docker-compose down

list:
	docker-compose ps

refresh-frontend:
	docker-compose exec app sh -c "cd frontend && npm run build"

refresh-translatables:
	docker-compose exec app sh -c "cd frontend && yarn build-locales"

refresh-translations:
	docker-compose exec app sh -c "tx pull -af"

tests:test-client test-server

test-client:
	docker-compose exec app sh -c "cd /usr/src/app/frontend && CI=true npm test"

test-server:
	docker-compose exec app sh -c "python -m unittest discover tests/server"

fetch:
ifndef PRNUMBER
	$(error "Define PRNUMBER variable")
else
	git fetch origin pull/$(PRNUMBER)/head:pr$(PRNUMBER)
	git checkout pr$(PRNUMBER)
endif

checkout:down fetch build up tests down
