
## Development setup

### Architecture

The Tasking Manager is composed of two parts:

* **Client**: A front-end user interface built using React.
* **Server**: A back-end database and API built using Python.

The two parts can be developed independently of each other.

### Frontend

The client is the front-end user interface of the Tasking Manager. It is based on the React framework and you can find all files in the `frontend` directory.

**Dependencies**

The following dependencies must be available _globally_ on your system:
* Download and install [NodeJS LTS v10+](https://nodejs.org/en/) and [NPM](https://www.npmjs.com/)
* Go into the `frontend` directory and execute `npm install`.

#### Available Scripts

In the project directory, you can run:

##### `npm start`

Runs the app in the development mode.<br>
Open [http://localhost:3000](http://localhost:3000) to view it in the browser.

The page will reload if you make edits.<br>
You will also see any lint errors in the console.

##### `npm test`

Launches the test runner in the interactive watch mode.<br>
See the section about [running tests](https://facebook.github.io/create-react-app/docs/running-tests) for more information.

##### `npm run build`

Builds the app for production to the `build` folder.<br>
It correctly bundles React in production mode and optimizes the build for the best performance.

The build is minified and the filenames include the hashes.<br>
Your app is ready to be deployed!

See the section about [deployment](https://facebook.github.io/create-react-app/docs/deployment) for more information.

#### Learn More

You can learn more in the [Create React App documentation](https://facebook.github.io/create-react-app/docs/getting-started).

To learn React, check out the [React documentation](https://reactjs.org/).

### Server

The backend server is made up of a postgres database and an associated API that calls various end points to create tasks, manage task state, and produce analytics.

#### Dependencies

* [Python 3.6+](https://www.python.org/downloads/)
  * Note: The project does not work with Python 2.x. You **will** need Python 3.6+
* [PostgreSQL](https://www.postgresql.org/download/) with [PostGIS](https://postgis.net/install/)
* [pip](https://pip.pypa.io/en/stable/installing/)
* [libgeos-dev](https://trac.osgeo.org/geos/)

You can check the [Dockerfile](../scripts/docker/tasking-manager/Dockerfile) to have a reference of how to install it in a Debian/Ubuntu system.

#### Configuration

* Copy the example configuration file to start your own configuration: `cp example.env tasking-manager.env`.
* Adjust the `tasking-manager.env` configuration file to fit your configuration.
* Make sure that the following variables are set correctly in the `tasking-manager.env` configuration file:
  - `TM_APP_BASE_URL`=web-server-endpoint
  - `POSTGRES_DB`=tasking-manager-database-name
  - `POSTGRES_USER`=database-user-name
  - `POSTGRES_PASSWORD`=database-user-password
  - `POSTGRES_ENDPOINT`=database-endpoint-can-be-localhost
  - `POSTGRES_PORT`=database-port
  - `TM_SECRET`=define-freely-any-number-and-letter-combination
  - `TM_CONSUMER_KEY`=oauth-consumer-key-from-openstreetmap
  - `TM_CONSUMER_SECRET`=oauth-consumer-secret-key-from-openstreetmap

#### Build

* Create a Python Virtual Environment, using Python 3.6+:
    * ```python3 -m venv ./venv```
* Activate your virtual environment and install dependencies:
    * Linux/Mac:
        * ```. ./venv/bin/activate```
        * ```pip install -r requirements.txt```

#### Tests

The project includes a suite of Unit and Integration tests that you should run after any changes

```
python3 -m unittest discover tests/server
```

#### Export translatable strings to en.json source file

```
cd frontend && yarn build-locales
```


### Database

#### Create a fresh database

We use [Flask-Migrate](https://flask-migrate.readthedocs.io/en/latest/) to create the database from the migrations directory. Check the instructions on how to setup a PostGIS database with [docker](#creating-a-local-postgis-database-with-docker) or on your [local system](#non-docker). Then you can execute the following command to apply the migrations:

```
python3 manage.py db upgrade
```

#### Migrating your data from TM2

You can use [this script](../scripts/tm2-pg-migration/migrationscripts.sql) to migrate your data from the prior tasking manager version (v2) to the current one. Please see [this documentation page](./migration-tm2-to-tm3.md) for important information about this process.

#### Set permissions to create a task

To be able to create a task and have full permissions as an admin inside TM, login to the TM with your OSM account to populate your user information in the database, then execute the following command on your terminal (with the OS user that is the owner of the database):

`psql -d <your_database> -c "UPDATE users set role = 1 where username = '<your_osm_username>'"`

### API

If you plan to only work on the API you only have to build the server architecture. Install the server dependencies, and run the server:

`
python3 manage.py runserver -d -r
`

You can access the API documentation on [http://localhost:5000/api-docs](http://localhost:5000/api-docs), it also allows you to execute requests on your local TM instance. The API docs is also available on our [production](https://tasks.hotosm.org/api-docs/) and [staging](https://tasks-stage.hotosm.org) instances.

#### API Authentication

In order to authenticate on the API, you need to have an Authorization Token.

1. Run the command line `manage.py` with the `gen_token` option and `-u <OSM_User_ID_number>`. The command line can be run in any shell session as long as you are in the tasking-manager directory.

```
venv/bin/python manage.py gen_token -u 99999999
```

This will generate a line that looks like this:
> Your base64 encoded session token: b'SWpFaS5EaEoxRlEubHRVC1DSTVJZ2hfalMc0xlalu3KRk5BUGk0'

2. In the Swagger UI, where it says
> Token sessionTokenHere==

replace `sessionTokenHere==` with the string of characters between the apostrophes (' ') above so you end up with something that looks like this in that field:

> Token SWpFaS5EaEoxRlEubHRVC1DSTVJZ2hfalMc0xlalu3KRk5BUGk0

Your user must have logged in to the local testing instance once of course and have the needed permissions for the API call.

You can get your OSM user id number either by finding it in your local testing/dev database `select * from users` or from OSM by viewing the edit history of your user, selecting a changeset from the list, and then at the bottom link `Changeset XML` and it will be in the `uid` field of the XML returned.

To get your token on the production or staging Tasking Manager instances, after sign in in the browser, inspect a network request and search for the `Authorization` field in the request headers section.

### DevOps

# Docker

## Creating a local PostGIS database with Docker

If you're not able to connect to an existing tasking-manager DB, we have a [Dockerfile]() that will allow you to run PostGIS locally as follows.

### Dependencies

Following must be available locally:

* [Docker CE](https://www.docker.com/community-edition#/download)

### Build & Run the PostGIS dockerfile

1. From the root of the project:

`
docker build -t tasking-manager-db ./scripts/docker/postgis
`

2. The image should be downloaded and build locally.  Once complete you should see it listed, with

`
docker images
`

3. You can now run the image (this will run PostGIS in a docker container, with port 5432 mapped to localhost):

`
docker run -d -p 5432:5432 tasking-manager-db
`

4.  Confirm the image is running successfully:

`
docker ps
`

5. Finally you can set your env variable to point at your containerised DB:

`
export TM_DB=postgresql://hottm:hottm@localhost/tasking-manager
`

6.  Refer to the rest of the instructions in the README to setup the DB and run the app

# Non-Docker

## Creating the PostGIS database

It may be the case you would like to set up the database without using Docker for one reason or another. This provides you with a set of commands to create the database and export the database address to allow you to dive into server development.

### Dependencies

First, ensure that Postgresql and PostGIS are installed and running on your computer.

### Create the database user and database

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


It is possible to install and run the Tasking Manager using [Docker](https://docker.com) and [Docker Compose](https://docs.docker.com/compose/).

Clone the Tasking Manager repository and use `docker-compose up` to get a working version of the API running.
