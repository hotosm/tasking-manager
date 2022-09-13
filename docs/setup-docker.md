# Installation with Docker

This requires [Docker](https://docs.docker.com/get-started/) and [Docker Compose](https://docs.docker.com/compose/) to be installed on your system. **Alternatively** you can review how to install a local [development setup](./setup-development.md). That documentation may also complement the following in some aspects.

## Get the code

`git clone https://github.com/hotosm/tasking-manager.git`.

## Configure

* Copy the example configuration file to start your own configuration: `cp example.env tasking-manager.env`.
* Adjust the `tasking-manager.env` configuration file to fit your configuration. The defaults will create a working local test setup.

### Authenticate with OpenStreetMap

The Tasking Manager uses OpenStreetMap accounts for users to login.

In order to configure this connection you have to go to `https://www.openstreetmap.org/user/<Your_OSM_UserName>/oauth_clients/new` and fill in the form:

<img width="300" alt="Required OSM OAuth settings" src="./assets/osm-oauth-settings.jpg">

Afterwards copy the consumer key and secret from OpenStreetMap into your configuration file `tasking-manager.env`, and set the two variables: `TM_CONSUMER_KEY` and `TM_CONSUMER_SECRET`.

**NB**: if you've configured a custom OSM server, make sure that you create the user and oAuth client there.

## Run the Tasking Manager

* One command to get everything together and start the Tasking Manager: `docker-compose up -d`
* Visit with your browser [http://localhost:3000](http://localhost:3000)
  * The API is available at [http://localhost:5000](http://localhost:5000/api-docs).

Stop the containers with: `docker-compose down` or access the logs with `docker-compose logs -f`

Some functionality in the Tasking Manager and the API need special privileges. You can promote yourself to _Administrator_ after your first login, if you want to use this advanced functionality on your local instance. Log in to the backed database (see below) and change your users _role_ in the *Users* table to **1**.

### Public host

By default, things are made to work from `localhost`. If you want to setup a public host in production, at least the following settings need to be adapted:

* `tasking-manager.env`:
  * `TM_APP_BASE_URL=https://your_domain:3000` e.g. `TM_APP_BASE_URL=https://tasks.smartcitiestransport.com:3000`
  * `TM_APP_API_URL=https://your_domain:5000`
  
Yet, we suggest to use a reverse proxy like [traefik](https://traefik.io/traefik/) to route your traffic and expose the frontend and the api both behind port 80 under different paths. See [docker-compose.traefik.yaml](../docker-compose.traefik.yaml) for an example on how to configure it. Run `docker-compose -f docker-compose.yml -f docker-compose.traefik.yml up -d` and visit [http://localhost](http://localhost) to see it in action. Make sure to update `tasking-manager.env` accordingly.

### Backend database

#### Persistent data

If you may be removing and starting the postgresql container, you may want to setup a persistent volume:

In `docker-compose.override.yml`:

```yaml
services:
  postgresql:
    volumes:
      - "./postgresql-data:/var/lib/postgresql/data"
```

#### Database access

To access the backend database, you need to make it available on your host machine:

In `docker-compose.override.yml`:

```yaml
services:
  postgresql:
    ports:
      - a_free_port_on_your_host:5432
```

# Using make

The most common docker actions are available in a [make](https://www.gnu.org/software/make/) script for convenience. To start all required services to run tasking manager locally, run
```
make up
```

Also, you can edit and execute client tests with `make test-client`. For backend tests you need to run `make test-backend`. For both, the command is `make tests`.


With this approach users and developers have the possibility to review and setup their own instance of tasking manager without the need of installation or configuration of the resources. Hence, it becomes possible to examine Pull requests, executing
```
make PRNUMBER=prnumber
```
where `prnumber` corresponds to the pull request number created on github.

Finally, to destroy running containers for all services, please run
```
make down
```

*Notes.*

1. It is important to set the hotosm/tasking-manager remote as origin.
2. When a new frontend module or backend requirement is included within their respective files, remember to rebuild dockerfile image, executing the following command
```
make build
```
