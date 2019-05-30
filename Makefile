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
	docker-compose build app

up:
	docker-compose up -d

down:
	docker-compose down

list:
	docker-compose ps

tests:test-client test-server

test-client:
	docker-compose exec app sh -c "cd /usr/src/app/tests/client && ../../client/node_modules/.bin/karma start ./karma.conf.js --single-run --browsers PhantomJS"

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
