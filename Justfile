## Please check https://github.com/casey/just for Installation and setup.

# Run the help script
default:
  @just --unstable help

# View available commands
help:
  @just --unstable --list --justfile {{justfile()}}

# Run database migrations for backend
migrate:
  docker compose up tm-migration

# Delete running containers & cleanup
clean:
  docker compose down -v

# Run frontend tests
frontend-code-test:
  docker compose run --rm tm-frontend bash -c "CI=true yarn test -w 3 --silent"

# Run backend tests
backend-code-check:
  pre-commit run --all-files

# Run backend coverage tests
backend-functional-tests:
  docker run -d  \
    -e SQLALCHEMY_DATABASE_URI="postgresql://taskingmanager@localhost/test_tm" \
    -e POSTGRES_TEST_DB="test_tm" \
    -e POSTGRES_DB="test_tm" \
    -e POSTGRES_USER="taskingmanager" \
    -e POSTGRES_ENDPOINT="localhost" \
    -e POSTGRES_PASSWORD="tm" \
    -e TM_ORG_CODE="CICode" \
    -e TM_ORG_NAME="CircleCI Test Organisation" \
    postgis/postgis:${POSTGIS_TAG:-14-3.3}

  # Sleep to initialize db container.
  sleep 10
