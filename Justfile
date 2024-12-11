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
  docker compose run --rm tm-frontend bash -c "export CI=true; yarn test -w 3 --silent"

frontend-build-test:
  docker compose run --rm tm-frontend bash -c "export CI=true; export GENERATE_SOURCEMAP=false; yarn build"

# Run backend tests
backend-code-check:
  pre-commit run --all-files

# Run backend coverage tests
backend-functional-tests:
  #!/bin/bash
  set -euo pipefail

  # Generate unique names for the network, containers, and images
  POSTGRES_PASSWORD="tm"
  NETWORK_NAME="network_$(uuidgen | cut -d'-' -f1)"
  POSTGRES_CONTAINER_NAME="postgres_$(uuidgen | cut -d'-' -f1)"
  BACKEND_CONTAINER_NAME="backend_$(uuidgen | cut -d'-' -f1)"
  POSTGRES_IMAGE="postgis/postgis:${POSTGIS_TAG:-14-3.3}"
  BACKEND_IMAGE="tm-backend-image:$(uuidgen | cut -d'-' -f1)"

  # Create the network dynamically
  echo "Creating network: $NETWORK_NAME"
  docker network inspect "$NETWORK_NAME" &> /dev/null || docker network create "$NETWORK_NAME"

  # Run the Postgres container with a unique name
  echo "Running Postgres container: $POSTGRES_CONTAINER_NAME"
  docker run -d --name "$POSTGRES_CONTAINER_NAME" \
    -e POSTGRES_DB="test_tm" \
    -e POSTGRES_USER="taskingmanager" \
    -e POSTGRES_PASSWORD="tm" \
    --network "$NETWORK_NAME" \
    "$POSTGRES_IMAGE"

  # Build the backend image with a unique name
  echo "Building backend image: $BACKEND_IMAGE"
  docker build -t "$BACKEND_IMAGE" .

  # Run the backend container with a unique name
  echo "Running backend container: $BACKEND_CONTAINER_NAME"
  docker run --rm --name "$BACKEND_CONTAINER_NAME" \
    -e SQLALCHEMY_DATABASE_URI="postgresql://taskingmanager:$POSTGRES_PASSWORD@$POSTGRES_CONTAINER_NAME/test_tm" \
    -e POSTGRES_TEST_DB="test_tm" \
    -e POSTGRES_USER="taskingmanager" \
    -e POSTGRES_ENDPOINT="$POSTGRES_CONTAINER_NAME" \
    -e TM_ORG_CODE="CICode" \
    -e TM_ORG_NAME="CircleCI Test Organisation" \
    -v $(pwd):/usr/src/app \
    --network "$NETWORK_NAME" \
    "$BACKEND_IMAGE" /bin/bash -c "\
      pip3 install coverage pytest && \
      coverage run --source ./backend -m pytest"

  # Cleanup section
  docker rm -f "$POSTGRES_CONTAINER_NAME" &> /dev/null || true
  docker rmi -f "$BACKEND_IMAGE" &> /dev/null || true
  docker network rm "$NETWORK_NAME" &> /dev/null || true
  echo "Cleanup complete."
