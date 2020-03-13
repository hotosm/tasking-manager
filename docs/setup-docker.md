## Installation with Docker

**Get the code**

`git clone https://github.com/hotosm/tasking-manager.git`.

**Configure**

* Copy the example configuration file to start your own configuration: `cp example.env tasking-manager.env`.
* Adjust the `tasking-manager.env` configuration file to fit your configuration.

**Connect with OpenStreetMap**

The Tasking Manager uses OpenStreetMap accounts for users to login. 

In order to configure this connection you have to go to `https://www.openstreetmap.org/user/<Your_OSM_UserName>/oauth_clients/new` and fill in the form:

<img width="300" alt="Required OSM OAuth settings" src="./assets/osm-oauth-settings.jpg">

Afterwards copy the consumer key and secret from OpenStreetMap into your configuration file `tasking-manager.env`, and set the two variables: `TM_CONSUMER_KEY` and `TM_CONSUMER_SECRET`.

**Run the Tasking Manager**

The **easiest way** to run the Tasking Manager requires [Docker](https://docs.docker.com/get-started/) and [Docker Compose](https://docs.docker.com/compose/) to be installed on your system.  Afterwards you'll just need:

* One command to get everything together and start the Tasking Manager: `docker-compose up -d`
* Visit with your browser `http://127.0.0.1:5000`

For stopping this command do the job: `docker-compose stop`
And you can check the logs with `docker-compose logs -f`

**Alternatively** you can review how to install a [development setup](./setup-development.md).

### Working with the setup

The Tasking Manager Docker setup comes with pre-built client modules and backend requirements. To start all required services to run tasking manager locally, run
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