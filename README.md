# HOT tasking-manager

## Intro
The app is split into a Client (AngularJS) and Server (Python) structure.  Each can be developed independently of each other.  See below for instructions on how to set up your deve environment.

[See our FAQ if you hit any problems getting setup](https://github.com/hotosm/tasking-manager/wiki/Dev-Environment-FAQ)


## Client Development
### Dependencies
Following must be available locally:

* NodeJS LTS v6+ [NodeJS LTS install here](https://nodejs.org/en/)

#### Build the Client
* Install Gulp.  [Gulp](http://gulpjs.com/) is used to automate the Client build and needs to be installed globally:
    * ```npm install gulp -g```
* Build the client, with gulp:
    * ```gulp build```

### Running Locally
If you plan to do client development you can run the app using gulp, without having to worry too much about the server

```
cd client
gulp run
```

### Running Unit Tests
The client has a suite of [Jasmine](https://jasmine.github.io/) Unit Tests, that you can run using [Karma](https://karma-runner.github.io/1.0/index.html) as follows

```
 cd client
 karma start ..\tests\client\karma.conf.js
```

## Server Development
### Dependencies
Following must be available locally:

* Python 3.6 - [Python 3.6 install here](https://www.python.org/downloads/)

### Build the Server
* Create a Python Virtual Environment, using Python 3.6:
    * ```python -m venv ./venv```
* Activate your virtual environment:
    * Linux/Mac:
        * ```. ./venv/bin/activate```
    * Windows:
        * ```.\venv\scripts\activate```
* Install all dependencies:
    * ```pip install -r requirements.txt```
        
### Environment vars:
As the project is open source we have to keep secrets out of the repo.  You will need to setup the following env vars locally:

* **TM_DB** - This is the for the PostGIS connection string
* **TM_SECRET** - This is secret key for the TM app used by itsdangerous and flask-oauthlib for entropy
* **TM_CONSUMER_SECRET** - This is the OAUTH Consumer Secret used for authenticating the Tasking Manager App in OSM

* Linux/Mac
    * ```export TM_DB=postgresql://USER:PASSWORD@HOST/DATABASE```
    * ```export TM_SECRET=secret-key-here```
    * ```export TM_CONSUMER_SECRET=outh-consumer-secret-key-goes-here```
* Windows:
    * ```setx TM_DB "postgresql://USER:PASSWORD@HOST/DATABASE"```
    * ```setx TM_SECRET "secret-key-here"```
    * ```setx TM_CONSUMER_SECRET "outh-consumer-secret-key-goes-here"```

### Creating the DB
We use [Flask-Migrate](https://flask-migrate.readthedocs.io/en/latest/) to create the database from migrations directory.  Create the database as follows:

```
python manage.py db upgrade
```

### Running Locally
You can now run the app as follows:

```
python manage.py runserver -d
```

### Running Unit Tests
The project includes a suite of Unit and Integration tests that you should run after any changes with [nose](http://nose.readthedocs.io/en/latest/)

```
nosetests ./tests/server
```

## Dev Ops

### Server Config

#### Environment Vars

On boot the Tasking Manager App will look for the following environment vars:

* **TASKING_MANAGER_ENV** - Allows you to specify which config to load from ./server/config.py  Acceptable values:
    * **Dev** - This is the default
    * **Staging** - Use this for your staging/test environment
    * **Prod** - Use this for your production environment

