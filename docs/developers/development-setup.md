
# Development setup

## Architecture

The Tasking Manager is composed of two parts:

* **Frontend**: A user interface built using React.
* **Backend**: A database and API built using Python.

The two parts can be developed independently of each other.

## OSM Auth

The Tasking Manager uses OAuth2 with OSM to authenticate users.

In order to use the frontend, you may need to create keys for OSM:

1. [Login to OSM][1]
   (_If you do not have an account yet, click the signup
   button at the top navigation bar to create one_).

   Click the drop down arrow on the top right of the navigation bar
   and select My Settings.

2. Register your Tasking Manager instance to OAuth 2 applications.

   Put your login redirect url as `http://127.0.0.1:3000/authorized/`

   > Note: `127.0.0.1` is required for debugging instead of `localhost`
   > due to OSM restrictions.

3. Permissions required:
    - Read user preferences (read_prefs).
    - Modify the map (write_api).

4. Now save your Client ID and Client Secret for the next step.

## Configure The Dot Env File

1. Copy the `example.env` to `tasking-manager.env`.

    ```bash
    cp example.env tasking-manager.env
    ```

2. Update the following variables

    ```dotenv
    TM_CLIENT_ID=from-previous-step
    TM_CLIENT_SECRET=from-previous-step
    ```

> If you are a frontend developer and do not wish to configure the
> backend, you can use our staging server API.
>
> Update the variable:
>
>    `TM_APP_API_URL='https://tasking-manager-staging-api.hotosm.org'`
>
> before running the `yarn start` command.
>
> Be aware that the staging API can be offline while we are deploying
> newer versions to the staging server and that you'll not have access
> to some management views due to permissions. Check the
> [configuration](#configuration) section to learn more about how
> to configure Tasking Manager.

For more details see the [configuration section](#configuration).

## Docker

The easiest option to get started with all components may be using Docker.

### Requirements

[Docker Engine](https://docs.docker.com/engine/install/) must be available locally.

### Running Tasking Manager

Once you have the docke engine running, Quickly generate an environment file from an existing `example.env`.
```bash
cp example.env tasking-manager.env
```

Now you can proceed with starting the services.

```bash
docker compose pull
docker compose build
docker compose up --detach
```

Tasking Manager should be available from:
[http://127.0.0.1:3000](http://127.0.0.1:3000)

#### (Optional) Changing the dev port or dotenv file

You change the default port from `3000` to any other port.

However, you must change your OAuth redirect URL to reflect this,
in addition to any variables including a port, e.g. TM_APP_BASE_URL.

The default dotenv file can also be changed.

```bash
TM_DEV_PORT=9000 ENV_FILE=.env docker compose up --detach
```
```bash
docker compose build
docker compose up --detach
```
#### (Optional) Overriding `docker-compose.yml`
If you want to add custom configuration for the docker services. You can make a copy of `docker-compose.override.sample.yml` which you can edit as per your need.

Create an override file from sample.
```
cp docker-compose.override.sample.yml docker-compose.override.yml
```

### External or Self Hosted Database

If you want to use your local postgresql server or some other exter database service.
Find these sets of environment variables in `tasking-manager.env`
```bash
POSTGRES_DB=tasking-manager
POSTGRES_USER=tm
POSTGRES_PASSWORD=tm
POSTGRES_ENDPOINT=<replace-with-your-database-endpoint>
POSTGRES_PORT=5432
```
> **_NOTE:_**  If database server is self managed on your local machine, Use your machine's ip address. Also make sure it can be reachable from `tm-backend` container.

Once Updated, recreate containers with
```
docker compose up -d
```

### Frontend Only Deployment
If you are looking to deploy only Frontend service with docker, You will need to make sure the following env vars are corrent in `tasking-manager.env`

```
TM_APP_API_URL=http://127.0.0.1:5000
```
This refers to the backend service that you are going to consume, If you don't have a Tasking Manager backend instance you can use the staging server hosted by hotosm.
```
TM_APP_API_URL=https://tasking-manager-staging-api.hotosm.org
```
Then proceed with starting only frontend service with docker.
```
docker compose up -d tm-frontend
```

Check server logs with
```
docker logs tasking-manager-main-tm-frontend-1 -f

> TaskingManager-frontend@0.1.0 patch-rapid
> bash -c "cp patch/rapid-imagery.min.json public/static/rapid/data/imagery.min.json"

ℹ ｢wds｣: Project is running at http://172.22.0.2/
ℹ ｢wds｣: webpack output is served from
ℹ ｢wds｣: Content not from webpack is served from /usr/src/app/public
ℹ ｢wds｣: 404s will fallback to /
Starting the development server...

Compiled successfully!

You can now view TaskingManager-frontend in the browser.

  Local:            http://localhost:3000
  On Your Network:  http://172.22.0.2:3000

Note that the development build is not optimized.
To create a production build, use yarn build.
```
For OSM related `CLIENT_ID` and `SECRETS` check [OSM AUTH](#osm-auth) section.
## Running Components Standalone

### Frontend

The client is the front-end user interface of the Tasking Manager. It is based on the React framework and you can find all files in the `frontend` directory.

#### Dependencies

The following dependencies must be available _globally_ on your system:
* Download and install [NodeJS LTS v12+](https://nodejs.org/en/) and [yarn](https://classic.yarnpkg.com/en/docs/install)
* Go into the `frontend` directory and execute `yarn`.

#### Available Scripts

In the project directory, you can run:

##### `yarn start`

Runs the app in the development mode.<br>
Open [http://localhost:3000](http://localhost:3000) to view it in the browser.

The page will reload if you make edits.<br>
You will also see any lint errors in the console.

##### `yarn test`

Launches the test runner in the interactive watch mode.<br>
See the section about [running tests](https://facebook.github.io/create-react-app/docs/running-tests) for more information.

##### `yarn build`

Builds the app for production to the `build` folder.<br>
It correctly bundles React in production mode and optimizes the build for the best performance.

The build is minified and the filenames include the hashes.<br>
Your app is ready to be deployed!

See the section about [deployment](https://facebook.github.io/create-react-app/docs/deployment) for more information.

#### Learn More

You can learn more in the [Create React App documentation](https://facebook.github.io/create-react-app/docs/getting-started).

To learn React, check out the [React documentation](https://reactjs.org/).

### Backend

The backend is made up of a postgres database and an associated API
that calls various end points to create tasks, manage task state, and
produce analytics.

#### Dependencies

* [Python 3.7+](https://www.python.org/downloads/)
  * Python 3.7 is what HOT uses in production. You can use Python 3.8 too.
* [PostgreSQL](https://www.postgresql.org/download/) with [PostGIS](https://postgis.net/install/)
* [pip](https://pip.pypa.io/en/stable/installing/)
* [libgeos-dev](https://trac.osgeo.org/geos/)

You can check the
[Dockerfile](https://github.com/hotosm/tasking-manager/blob/develop/Dockerfile)
to have a reference of how to install it in a Debian/Ubuntu system.

#### Configuration

There are two ways to configure Tasking Manager. You can set some
environment variables on your shell or you can define the
configuration in the `tasking-manager.env` file on the repository root
directory. To use that last option, follow the below instructions:

* Copy the example configuration file to start your own configuration:
  `cp example.env tasking-manager.env`.
* Adjust the `tasking-manager.env` configuration file to fit your configuration.
* Make sure that the following variables are set correctly in the
  `tasking-manager.env` configuration file:
  - `TM_APP_BASE_URL`=web-server-endpoint
  - `POSTGRES_DB`=tasking-manager-database-name
  - `POSTGRES_USER`=database-user-name
  - `POSTGRES_PASSWORD`=database-user-password
  - `POSTGRES_ENDPOINT`=database-endpoint-can-be-localhost
  - `POSTGRES_PORT`=database-port
  - `TM_SECRET`=define-freely-any-number-and-letter-combination
  - `TM_CLIENT_ID`=oauth-client-id-from-openstreetmap
  - `TM_CLIENT_SECRET`=oauth-client-secret-key-from-openstreetmap
  - `TM_REDIRECT_URI`=oauth-client-redirect_uri
  - `TM_SCOPE`=oauth-client-scopes
  - `TM_LOG_DIR=logs`

In order to send email correctly, set these variables as well:
  - `TM_SMTP_HOST`
  - `TM_SMTP_PORT`
  - `TM_SMTP_USER`
  - `TM_SMTP_PASSWORD`
  - `TM_SMTP_USE_TLS=0`
  - `TM_SMTP_USE_SSL=1` (Either TLS or SSL can be set to 1 but not both)

#### Install Dependencies

* Install project dependencies:
  * First ensure the Python version in `pyproject.toml:requires-python` is installed on your system.
  * ```pip install --upgrade pdm```
  * ```pdm install```

#### Tests

The project includes a suite of Unit and Integration tests that you
should run after any changes.

```
python3 -m unittest discover tests/backend
```
or
```
pdm run test
```

#### Export translatable strings to en.json source file

```
cd frontend && yarn build-locales
```


### Database


### Migrations with docker

You need to delete all the versions in ./migrations/version.
Then, import the new model into the file ./backend/__init__.py
Finally, enter inside the migration container and run:

```
python manage.py db migrate
```

and

```
python manage.py db upgrade
```

#### Create a fresh database

We use
[Flask-Migrate](https://flask-migrate.readthedocs.io/en/latest/) to
create the database from the migrations directory. Check the
instructions on how to setup a PostGIS database with
[docker](#creating-a-local-postgis-database-with-docker) or on your
[local system](#creating-a-local-postgis-database-without-docker). Then you can execute the following
command to apply the migrations:

```
flask db upgrade
```
or
```
pdm run upgrade
```

#### Set permissions to create projects

To be able to create projects and have full permissions as an admin
user inside TM, login to the TM with your OSM account to populate your
user information in the database, then execute the following command
on your terminal (with the OS user that is the owner of the database):

`psql -d <your_database> -c "UPDATE users set role = 1 where username = '<your_osm_username>'"`

## API

If you plan to only work on the API you only have to build the backend
architecture. Install the backend dependencies, and run the server:

```bash
# Install dependencies
pdm install

# Run (Option 1)
pdm run start

# Run (Option 2)
pdm run flask run --debug --reload
```

You can access the API documentation on
[http://localhost:5000/api-docs](http://localhost:5000/api-docs), it
also allows you to execute requests on your local TM instance. The API
docs is also available on our
[production](https://tasks.hotosm.org/api-docs) and
[staging](https://tasks-stage.hotosm.org/api-docs/) instances.

### API Authentication

In order to authenticate on the API, you need to have an Authorization Token.

1. Run the command line `manage.py` via `flask` with the `gen_token`
   option and `-u <OSM_User_ID_number>`. The command line can be run
   in any shell session as long as you are in the tasking-manager
   directory.

```
flask gen_token -u 99999999
```

This will generate a line that looks like this:
> Your base64 encoded session token: b'SWpFaS5EaEoxRlEubHRVC1DSTVJZ2hfalMc0xlalu3KRk5BUGk0'

2. In the Swagger UI, where it says
> Token sessionTokenHere==

replace `sessionTokenHere==` with the string of characters between the
apostrophes (' ') above so you end up with something that looks like
this in that field:

> Token SWpFaS5EaEoxRlEubHRVC1DSTVJZ2hfalMc0xlalu3KRk5BUGk0

Your user must have logged in to the local testing instance once of
course and have the needed permissions for the API call.

You can get your OSM user id number either by finding it in your local
testing/dev database `select * from users` or from OSM by viewing the
edit history of your user, selecting a changeset from the list, and
then at the bottom link `Changeset XML` and it will be in the `uid`
field of the XML returned.

### API Authentication on remote instance

To get your token on the production or staging Tasking Manager
instances, sign in in the browser and then either:

- go to the user profile page, enable _Expert mode_ in the settings,
  and copy the token from the _API Key_ section.
- inspect a network request and search for the `Authorization` field
  in the request headers section.

## Additional Info

### Creating a local PostGIS database with Docker

If you're not able to connect to an existing tasking-manager DB, we
have a [Dockerfile]() that will allow you to run PostGIS locally as
follows.

### Build & Run the PostGIS dockerfile

1. From the root of the project:

`
docker build -t tasking-manager-db ./scripts/docker/postgis
`

2. The image should be downloaded and build locally.  Once complete
   you should see it listed, with

`
docker images
`

3. You can now run the image (this will run PostGIS in a docker
   container, with port 5432 mapped to localhost):

`
docker run -d -p 5432:5432 tasking-manager-db
`

4.  Confirm the image is running successfully:

`
docker ps
`

5. Finally you can set your env variable to point at your
   containerised DB:

`
export TM_DB=postgresql://hottm:hottm@localhost/tasking-manager
`

6.  Refer to the rest of the instructions in the README to setup the
    DB and run the app.

## Creating a local PostGIS database without Docker

### Creating the PostGIS database

It may be the case you would like to set up the database without using
Docker for one reason or another. This provides you with a set of
commands to create the database and export the database address to
allow you to dive into backend development.

#### Dependencies

First, ensure that Postgresql and PostGIS are installed and running on
your computer.

#### Create the database user and database

Assuming you have sudo access and the unix Postgresql owner is `postgres`:

```
$ sudo -u postgres psql
$ CREATE USER "hottm" PASSWORD 'hottm';
$ CREATE DATABASE "tasking-manager" OWNER "hottm";
$ \c "tasking-manager";
$ CREATE EXTENSION postgis;
```

Finally, add the environmental variable to access the database:

`
export TM_DB=postgresql://hottm:hottm@localhost/tasking-manager
`


It is possible to install and run the Tasking Manager using
[Docker](https://docker.com) and [Docker
Compose](https://docs.docker.com/compose/).

Clone the Tasking Manager repository and use `docker-compose up` to
get a working version of the API running.

## Sysadmins guide

* [System architecture](../sysadmins/architecture.md)
* [Managing CI/CD with CircleCI](../sysadmins/ci-cd.md)
* [Deployment Guide](../sysadmins/deployment.md)

[1]: https://www.openstreetmap.org/login "Login to OSM"
