# Deploying Tasking Manager using Docker Compose

## Overview
This guide is aimed at organisations who may want to deploy their own version of Tasking Manager (TM). It draws on experiences of deploying TM for the Ireland chapter of OpenStreetMap who use TM to organise the mapping of buildings in Ireland.
The information here is focused on our deployment of TM using Docker. Our deployment was to an Ubuntu Virtual Machine in the Azure Cloud with the postgres database hosted on "Azure Database for PostgreSQL servers". These particulars are likely less important to anyone reading this guide but some adjustments may be necessary.

## Requirements
- A server (we are using Ubuntu 20.04) with public IP address
- DNS entry pointing to your server IP (e.g. tasks.yourdomain.tld A 123.123.123.123)
- SSH access to your server

## Steps
The steps below are for Ubuntu but you should be able to adapt for your preferred distribution. 

### Install Pre-requisites

```
sudo apt install docker.io git curl wget python3
```

### Pull the Code
Clone down the public repository:
```
cd /opt
git clone https://github.com/hotosm/tasking-manager.git
```

### Code Changes
In the docker setup we need to add the following two lines to the top of the `backend/__init__.py` file to avoid a [recursion bug](https://github.com/hotosm/tasking-manager/issues/5483). 

```
vi /opt/tasking-manager/backend/__init__.py
```
Lines to be prepended to the file:
```
import gevent
gevent.monkey.patch_ssl()
```
You may need to rebuild the docker images if you make this change (details below).

### Environment File
Create or amend the file `/opt/tasking-manager/tasking-manager.env`
An example is shown below:
```
OSM_NOMINATIM_SERVER_URL=https://nominatim.openstreetmap.org
OSM_REGISTER_URL=https://www.openstreetmap.org/user/new
OSM_SERVER_URL=https://www.openstreetmap.org
POSTGRES_ENDPOINT=changeme
POSTGRES_DB=tm
POSTGRES_PASSWORD=changeme
POSTGRES_USER=changeme
TM_APP_API_URL=https://tasks.yourwebsite.tld
TM_APP_API_VERSION=v2
TM_APP_BASE_URL=https://tasks.yourwebsite.tld
# OpenStreetMap OAuth2 client id and secret (required)
TM_CLIENT_ID=changeme
TM_CLIENT_SECRET=changeme
# Redirect uri registerd while creating OAuth2 application (required)
TM_REDIRECT_URI=https://tasks.yourwebsite.tld/authorized
# Scope of TM defined while creating OAuth2 application (required)
TM_SCOPE=read_prefs write_api
TM_CONSUMER_KEY=changeme
TM_CONSUMER_SECRET=changeme
TM_DEFAULT_CHANGESET_COMMENT="#changeme"
TM_DEFAULT_LOCALE=en
TM_EMAIL_FROM_ADDRESS=noreply@tasks.openstreetmap.ie
TM_HOMEPAGE_STATS_API_URL=https://osmstats-api.hotosm.org/wildcard?key=hotosm-project-*
TM_ORG_CODE=OSMCHANGEME
TM_ORG_FB=https://www.facebook.com/groups/changeme/
TM_ORG_GITHUB=https://github.com/changeme
TM_ORG_INSTAGRAM=
TM_ORG_LOGO=https://yourwebsite.tld/logo.png
TM_ORG_NAME="OSM Chapter"
TM_ORG_PRIVACY_POLICY_URL=yourwebsite.tld/privacy
TM_ORG_TWITTER=http://twitter.com/osm_ie/
TM_ORG_URL=www.yourwebsite.tld
TM_ORG_YOUTUBE=https://www.youtube.com/user/example
TM_SECRET=s0m3l0ngchangeme
TM_SEND_PROJECT_EMAIL_UPDATES=1
TM_SMTP_HOST=smtp.changeme.tld
TM_SMTP_PASSWORD=changeme
TM_SMTP_PORT=587
TM_SMTP_USER=noreply@yourwebsite.tld
TM_USER_STATS_API_URL=https://osm-stats-production-api.azurewebsites.net/users/
```

### Docker Compose
The TM app is comprised of several components:
- backend (Django)
- frontend (React)
- database
- proxy (traefik)
- migrations

The containers for each of these components can be run via `docker-compose` as shown in the config file below. The Traefik service proxies requests from your HTTPS port to the backend or frontend services. Traefik as configured below will also provision an SSL certificate from Let's Encrypt.

Notes: 
- You will need to build the container images before running `docker-compose up` 
- I found it necessary to remove the file `docker-compose.override.yml`
```
rm docker-compose.override.yml
```

Next create or amend the `/opt/tasking-manager/docker-compose.yml` file. Example shown below:
```
version: "3.4"

x-backend-config: &backend
  image: hotosm-tasking-manager:backend
  env_file: ${ENV_FILE:-tasking-manager.env}
  depends_on:
    - postgresql
    - traefik
  links:
    - postgresql
  networks:
    - tm-web

services:
  # Main application
  backend:
    <<: *backend
    container_name: backend
    restart: always
    labels:
      - "traefik.http.routers.backend.rule=(Host(`tasks.tasks.changeme.tld`) && PathPrefix(`/api/`))"
      - "traefik.http.services.backend.loadbalancer.server.port=5000"
      - "traefik.http.routers.backend.tls.certresolver=myresolver"

  migration:
    <<: *backend
    container_name: migration
    restart: on-failure
    command: python manage.py db upgrade

  frontend:
    image: hotosm-tasking-manager:frontend
    container_name: frontend
    restart: always
    networks:
      - tm-web
    depends_on:
      - backend
      - traefik
    labels:
      - "traefik.http.routers.frontend.rule=(Host(`tasks.changeme.tld`))"
      - "traefik.http.services.frontend.loadbalancer.server.port=80"
      - "traefik.http.routers.frontend.tls.certresolver=myresolver"

  postgresql:
    image: mdillon/postgis:9.6
    container_name: postgresql
    restart: always
    volumes:
      - ./data/postgres:/var/lib/postgresql/data
    ports:
      - "5432:5432"
    env_file: ${ENV_FILE:-tasking-manager.env}
    networks:
      - tm-web

  traefik:
    image: traefik:v2.9
    container_name: traefik
    restart: always
    ports:
      - "80:80"
      - "8080:8080"
      - "443:443"
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock:ro
      - "./letsencrypt:/letsencrypt"
    command:
      - "--api.insecure=true"
      - "--providers.docker"
      - "--entrypoints.web.address=:80"
      - "--entrypoints.websecure.address=:443"
      - "--certificatesresolvers.myresolver.acme.httpchallenge=true"
      - "--certificatesresolvers.myresolver.acme.httpchallenge.entrypoint=web"
      # - "--certificatesresolvers.myresolver.acme.caserver=https://acme-staging-v02.api.letsencrypt.org/directory"
      - "--certificatesresolvers.myresolver.acme.email=changeme@gmail.com"
      - "--certificatesresolvers.myresolver.acme.storage=/letsencrypt/acme.json"
    networks:
      - tm-web

networks:
  tm-web:
    external: true
```

#### Build the Images
The TM container images are not on docker hub so you will need to build them before running the service:
```
cd /opt/tasking-manager
/usr/bin/docker build -t hotosm-tasking-manager:frontend -f scripts/docker/Dockerfile.frontend .
/usr/bin/docker build -t hotosm-tasking-manager:backend -f scripts/docker/Dockerfile.backend .
```
Create the docker network:
```
docker network create tm-web
```
#### Start the services

```
cd /opt/tasking-manager
docker-compose up -d 
```

### Customising
Some possible customisations to the frontend user interface include:
- text (e.g. /opt/tasking-manager/frontend/src/locales/en.json), 
- colors (e.g. /opt/tasking-manager/frontend/src/assets/styles/_variables.scss), or 
- graphics (e.g. /opt/tasking-manager/frontend/src/assets/img/main-logo.svg)
You will need to rebuild the container images and restart docker-compose (possibly using docker-compose up -d --build) after making customisation changes e.g.
```
cd /opt/tasking-manager
/usr/bin/docker build -t hotosm-tasking-manager:frontend -f scripts/docker/Dockerfile.frontend .
/usr/bin/docker build -t hotosm-tasking-manager:backend -f scripts/docker/Dockerfile.backend .
docker-compose down
docker-compose up -d --build
```

## Troubleshooting

### Traefik
If you suspect problems with the traefik configuration you can connect to the traefik UI using an SSH tunnel:
```
ssh -L 8080:localhost:8080 tasks.yourserver.tld
```
then open a web browser to http://127.0.0.1:8080

### Docker Logs
Check the container logs for problems:
```
cd /opt/tasking-manager
docker-compose logs -f
```

### Database Migration
Database migrations are normally performed by the docker-compose setup so the commands below may not apply to you. In our case we needed to upgrade from an older version and make database changes for the deployment to succeed. 
Install Python libraries:
```
apt install libpq-dev python3-dotenv python3-flask-script python3-flask-migrate python3-flask-cors python3-requests-oauthlib python3-flask-restful python3-flask-mail python3-flask-httpauth python3-cachetools python3-markdown python3-pip python3-geojson python3-geoalchemy2 python3-bleach python3-shapely python3-slugify python3-psycopg2 python3-apscheduler
```
Install pip prerequisites:
```
pip3 install wheel schematics
```
Create and activate a python environment:
```
python3 -m venv env
source ./env/bin/activate
```
Install TM prerequisites into environment via pip:
```
pip install -r requirements.txt
```
We ran into issues with some values in our projects table where the field value of organisation_tag was OSMIRL. This conflicted with the existing tag of #osmIRL so we renamed occurences of OSMIRL to #osmIRL.

Then perform the upgrade:
```
python3 manage.py db upgrade
```
