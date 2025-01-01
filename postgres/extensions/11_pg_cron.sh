#!/bin/bash

set -e

# Perform all actions as $POSTGRES_USER
export PGUSER="$POSTGRES_USER"

# Load PostGIS into both template_database and $POSTGRES_DB
echo "Loading PG_CRON extensions into $DB"
"${psql[@]}" --dbname="test_db" <<-'EOSQL'
	CREATE EXTENSION IF NOT EXISTS pg_cron;
EOSQL
