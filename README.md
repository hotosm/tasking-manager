# HOT tasking-manager

## Intro
The app is split into a Client (AngularJS) and Server (Python) structure.  Each can be developed independently of each other

## Installing
### Dependencies
Before you can run/develop locally you must have the following installed on your dev environment

* Python 3.6 - [Python 3.6 install here](https://www.python.org/downloads/)
* NodeJS LTS v6+ [NodeJS LTS install here](https://nodejs.org/en/)

###  Development Environment
All developers should follow these steps to create a dev environment. A [FAQ is available here](https://github.com/hotosm/tasking-manager/wiki/Dev-Environment-FAQ) if you hit any problems.


#### Setting up the Server
* Create a Python Virtual Environment, using Python 3.6:
    * ```python -m venv ./venv```
* Activate your virtual environment:
    * Linux/Mac:
        * ```. ./venv/bin/activate```
    * Windows:
        * ```.\venv\scripts\activate```
* Install all dependencies:
    * ```pip install -r requirements.txt```
* Set environment variable to point to appropriate postgres database instance with HOT schema set up.  You will need to modify the sample connection string with username, password etc:
    * Linux/Mac:
        * ```export TASKING_MANAGER_DB=postgresql://USER:PASSWORD@HOST/DATABASE```
    * Windows (may require you to restart your dev env to pick up the variable):
        * ```setx TASKING_MANAGER_DB "postgresql://USER:PASSWORD@HOST/DATABASE"```
    
#### Build the Client
* Install Gulp.  [Gulp](http://gulpjs.com/) is used to automate the Client build and needs to be installed globally:
    * ```npm install gulp -g```
* Build the client, with gulp:
    * ```gulp build```
    
## Client Development
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
### Running Locally
If you plan to do server development you can run the app using python

```
python manage.py runserver -d
```


## Dev Ops

### Server Config

#### Environment Vars

On boot the Tasking Manager App will look for the following environment vars:

* **TASKING_MANAGER_ENV** - Allows you to specify which config to load from ./server/config.py  Acceptable values:
    * **Dev** - This is the default
    * **Staging** - Use this for your staging/test environment
    * **Prod** - Use this for your production environment

