# HOT tasking-manager
The HOT Tasking Manager helps you set up mapping projects and tasks for your mapping team. Using this repository, you can set up your own instance of the tasking manager to customise permissions for members of your team or set up personalised mapping projects. If you are looking to use the HOT Tasking Manager, you can find it at https://tasks.hotosm.org/.

## Get involved!
Check out the [Working Group meeting details](https://github.com/hotosm/tasking-manager/wiki/TM-Working-Group-Meeting-Details), review the [Roadmap](https://github.com/hotosm/tasking-manager/projects/1), and review our [Contributor guidelines](https://github.com/hotosm/tasking-manager/blob/develop/CONTRIBUTING.md).

## Architecture

The Tasking Manager is composed of two parts:
* **Client**: A front-end user interface, called the client. It's built using AngularJS.
* **Server**: A back-end database and API built using python3.

The two parts can be developed independently of each other.

## Client
The client is the front-end user interface of the Tasking Manager. If you're interested in developing the client alone, you can build it using `gulp`, without having to worry about the server set up. You can point the client at a non-local API url (e.g. a staging environment), by changing the environment in `client/taskingmanager.config.json`. All the files pertaining to the client are available in the `client/` directory. 

**Dependencies**
The following dependencies must be available _globally_ on your system:
* Download and install [NodeJS LTS v6+](https://nodejs.org/en/) and [NPM](https://www.npmjs.com/)
* Install [Gulp](http://gulpjs.com/).
  * `npm install gulp -g`
* Install [Karma](https://karma-runner.github.io/1.0/index.html)
  * `npm install -g karma karma-jasmine karma-chrome-launcher`

**Build**
Once you have the above dependencies, install and run the client dependencies using `npm` and `gulp`
```
cd client
npm install
gulp run
```

**Tests**
The client has a suite of [Jasmine](https://jasmine.github.io/) Unit Tests. These can be run using [Karma](https://karma-runner.github.io/1.0/index.html) as follows

```
 cd client
 karma start ../tests/client/karma.conf.js
```
## Server
The backend server is made up of a postgres database and an associated API that calls various end points to create tasks, manage task state, and produce analytics.

**Dependencies**
* [Python 3.6+](https://www.python.org/downloads/)
  * Note: The project does not work with Python 2.x. You **will** need Python 3.x
* [postgreSQL](https://www.postgresql.org/download/) with [postGIS](https://postgis.net/install/)
* [pip](https://pip.pypa.io/en/stable/installing/)

**Get secrets from OpenStreetMap**
Since the tasking manager works with your OpenStreetMap credentials, register your local tasking manager application on OpenStreetMap to test advanced functionality.
* Go to `https://www.openstreetmap.org/user/<Your_OSM_UserName>/oauth_clients/new`, and fill in the following information.

<img width="300" alt="screen shot 2019-01-08 at 10 58 26 pm" src="https://user-images.githubusercontent.com/3166852/50847977-f81b3480-1398-11e9-9cfd-771f58efefb0.png">

* Once registered, you should get a  `Consumer Key` and `Consumer Secret`. Use these values for the `TM_CONSUMER_KEY` and `TM_CONSUMER_SECRET` environment variables below.

**Environment**
Set up the following environment variables to configure your local tasking manager instance(Required variables are in bold): 

Variable name | Purpose |
----------------|------------------
**TM_DB** | This is for the PostGIS connection string.  If you can't access an existing DB refer to DevOps page to [set up a local DB in Docker](https://github.com/hotosm/tasking-manager/wiki/Dev-Ops#creating-a-local-postgis-database-with-docker)
**TM_SECRET** | This is secret key for the TM app used by itsdangerous and flask-oauthlib for entropy. While testing a local instance, use any random string.
**TM_CONSUMER_KEY** | This is the [OAUTH Consumer Key used for authenticating the Tasking Manager App in OSM](https://github.com/hotosm/tasking-manager/blob/develop/README.md#GetSecretsFromOpenStreetMap)
**TM_CONSUMER_SECRET** | This is the [OAUTH Consumer Secret used for authenticating the Tasking Manager App in OSM](https://github.com/hotosm/tasking-manager/blob/develop/README.md#GetSecretsFromOpenStreetMap)
TM_SMTP_HOST | The hostname for the SMTP server that is used to send email alerts
TM_SMTP_PORT | The port number for the SMTP server that is used to send email alerts
TM_SMTP_USER | The user for the SMTP server that is used to send email alerts
TM_SMTP_PASSWORD | The password for the SMTP server that is used to send email alerts

<details>
  <summary><bold>Set up the environment on Linux/Mac:</bold></summary>

**NOTE:** It is strongly recommended to set these within your `.bash_profile` so they are available to all processes

```bash
export TM_DB=postgresql://USER:PASSWORD@HOST/DATABASE
export TM_SECRET=secret-key-here
export TM_CONSUMER_KEY=oauth-consumer-key-goes-here
export TM_CONSUMER_SECRET=oauth-consumer-secret-key-goes-here
export TM_SMTP_HOST=smtp-server-host-here
export TM_SMTP_PORT=smtp-server-port-here
export TM_SMTP_USER=smtp-server-user-here
export TM_SMTP_PASSWORD=smtp-server-password-here
```
</details>

<details>
   <summary><bold>Set up the environment on Windows</bold></summary>
 
```bash
setx TM_DB "postgresql://USER:PASSWORD@HOST/DATABASE"
setx TM_SECRET "secret-key-here"
setx TM_CONSUMER_KEY "oauth-consumer-key-goes-here"
setx TM_CONSUMER_SECRET "oauth-consumer-secret-key-goes-here"
setx TM_SMTP_HOST "smtp-server-host-here"
setx TM_SMTP_PORT "smtp-server-port-here"
setx TM_SMTP_USER "smtp-server-user-here"
setx TM_SMTP_PASSWORD "smtp-server-password-here"
```

</details>

<br/>
In addition to the above, the Tasking Manager App will look for the following environment vars, on boot (Required values are in bold).

Variable | Purpose | Acceptable Values
------------|--------------|---------------
**TM_ENV** | Allows you to specify which config to load from `./server/config.py`.  |* **Dev** - This is the default <br/> * **Staging** - Use this for your staging/test environment <br/> * **Prod** - Use this for your production environment <br/>

**Build**
* Create a Python Virtual Environment, using Python 3.6:
    * ```python3 -m venv ./venv```
* Activate your virtual environment and install dependencies:
    * Linux/Mac:
        * ```. ./venv/bin/activate```
        * ```pip install -r requirements.txt```
    * Windows (use installer because of precompiled libs):
        * ```.\venv\scripts\activate```
        * ```.\devops\win\install.bat```

**Tests**
The project includes a suite of Unit and Integration tests that you should run after any changes

```
python -m unittest discover tests/server
```

## Create the Database from existing data
We use [Flask-Migrate](https://flask-migrate.readthedocs.io/en/latest/) to create the database from the migrations directory. If you can't access an existing DB refer to DevOps page to [set up a local DB in Docker](https://github.com/hotosm/tasking-manager/wiki/Dev-Ops#creating-a-local-postgis-database-with-docker) create the database as follows

```
python3 manage.py db upgrade
```

## API

If you plan to only work on the API you only have to build the server architecture. Install the server dependencies, and run these commands:

* Run the server:
    * ``` python manage.py runserver -d -r```
* Point your browser to:
    * [http://localhost:5000/api-docs](http://localhost:5000/api-docs)

## DevOps
If you encounter any issues while setting up a dev environment, please visit our [FAQ ❓ page](https://github.com/hotosm/tasking-manager/wiki/Dev-Environment-FAQ) to find possible solutions.

## Localisation

Please see the [Localisation Wiki](https://github.com/hotosm/tasking-manager/wiki/Localisation) to translate the tasking Manager to your language.

## Troubleshooting

We keep track of issues we troubleshoot during the installation at https://github.com/hotosm/tasking-manager/wiki/Dev-Environment-FAQ. Please feel free to extend this document with additional issues you find.
