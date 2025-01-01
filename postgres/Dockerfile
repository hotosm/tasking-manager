FROM postgis/postgis:${POSTGIS_TAG:-14-3.3}

USER root

RUN apt-get update && apt-get install -y postgresql-14-cron

COPY ./extensions/11_pg_cron.sh /docker-entrypoint-initdb.d/11_pg_cron.sh

COPY ./extensions/pg_cron_setup.sql /docker-entrypoint-initdb.d/pg_cron_setup.sql

CMD ["-c", "shared_preload_libraries=pg_cron", "-c", "cron.timezone=UTC", "-c", "cron.database_name=test_db"]
