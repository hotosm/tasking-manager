# OpenStreetMap Tasking Manager

[![Build Status](https://travis-ci.org/hotosm/osm-tasking-manager2.svg?branch=master)](https://travis-ci.org/hotosm/osm-tasking-manager2)
[![Coverage Status](https://coveralls.io/repos/hotosm/osm-tasking-manager2/badge.png?branch=master)](https://coveralls.io/r/hotosm/osm-tasking-manager2?branch=master)

## About

OSMTM enables collaborative work on specific areas in OpenStreetMap by defining
clear workflows to be achieved and by breaking tasks down into pieces.

The application is written in Python using the Pyramid framework.

This is the 2.0 version of the Tasking Manager.

See a list of Tasking Manager installations [here](http://wiki.openstreetmap.org/wiki/OSM_Tasking_Manager#Operational_installations_of_the_Tasking_Manager).

## Installation

First clone the git repository:

    git clone --recursive git://github.com/hotosm/osm-tasking-manager2.git

Installing OSMTM in a Virtual Python environment is recommended.

To create a virtual Python environment:

    cd osm-tasking-manager2
    sudo easy_install virtualenv
    virtualenv --no-site-packages env
    ./env/bin/pip install -r requirements.txt

*Tip: if you encounter problems installing `psycopg2` especially on Mac, it is recommended to follow advice proposed [here](http://stackoverflow.com/questions/22313407/clang-error-unknown-argument-mno-fused-madd-python-package-installation-fa).*

### Database

OSMTM requires a PostgreSQL/PostGIS database. Version 2.3 or higher of PostGIS
is required.

First create a database user/role named `www-data`:

    sudo -u postgres createuser -SDRP www-data

Then create a database named `osmtm`:

    sudo -u postgres createdb -T template0 osmtm -E UTF8 -O www-data
    sudo -u postgres psql -d osmtm -c "CREATE EXTENSION postgis;"

### Local settings

You certainly will need some local specific settings, like the db user or
password. For this, you can create a `local.ini` file in the project root,
where you can then override every needed setting.
For example:

    [app:main]
    sqlalchemy.url = postgresql://www-data:PASSWORD@localhost/osmtm
    default_comment_prefix = #yourinstancename-project
    check_expiration_interval = 60

Note: you can also put your local settings file anywhere else on your
file system, and then create a `LOCAL_SETTINGS_PATH` environment variable
to make the project aware of this.

Currently, these are the settings you can over-ride:

 - `sqlalchemy.url`: Postgres URL to use for database connection
 - `default_comment_prefix`: Default prefix to use for changeset comments, defaults to `#hotosm-project`
 - `check_expiration_interval`: The interval at which the database should be checked for expired tasks, in seconds. Defaults to `5` seconds.

### Populate the database

You're now ready to do the initial population of the database. An
`initialize_osmtm_db` script is available in the virtual env for that:

    ./env/bin/initialize_osmtm_db

### Launch the application

    ./env/bin/pserve --reload development.ini

You will see messages, hopefully including a line like `serving on http://0.0.0.0:6543`.
Visit that address in your web browser - you should see your local Tasking Manager!

### Running the application behind proxy server

You need to make the following changes to the osmtm/views/osmauth.py file.

    # Add the below lines in the starting
    import httplib2
    httplib2.debuglevel = 4
    PROXY = httplib2.ProxyInfo(httplib2.socks.PROXY_TYPE_HTTP_NO_TUNNEL, 'PROXY-SERVER', PROXY-PORT)

NOTE: Replace the PROXY-SERVER with your proxy server address and PROXY-PORT with the port number on which your proxy is established.

    # then add "proxy_info=PROXY" for every line in oauth.Client.
    client = oauth.Client(consumer, proxy_info=PROXY)

    client = oauth.Client(consumer, token, proxy_info=PROXY)

Replace the host address in the development.ini file with your IP address of the system.

    host='SYSTEM-IP-ADDRESS'


### Styles

The CSS stylesheet are compiled using less. Launch the following command as
soon as you change the css:

    lessc -ru osmtm/static/css/main.less > osmtm/static/css/main.css

## Launch the application

    env/bin/pserve --reload development.ini

## Tests

The tests use a separate database. Create that database first:

    sudo -u postgres createdb -O www-data osmtm_tests
    sudo -u postgres psql -d osmtm_tests -c "CREATE EXTENSION postgis;"

Create a `local.test.ini`file in the project root, where you will add the
settings for the database connection.
For example:

    [app:main]
    sqlalchemy.url = postgresql://www-data:www-data@localhost/osmtm_tests

To run the tests, use the following command:

    ./env/bin/nosetests

## Application deployment

1. pull latest updates from the repository: `git pull origin`
1. update the submodules: `git submodule update --init`
1. update/install python modules: `./env/bin/pip install -r requirements.txt`
1. create database dump: `pg_dump -Fc -f osmtm2_latest.dmp database_name`
1. run database migrations: `./env/bin/alembic upgrade head`
1. compile messages: `./env/bin/python setup.py compile_catalog`
1. restart application server

## Installation as a mod_wsgi Application

an example Apache configuration file

```
WSGIDaemonProcess OSMTM_process user=ubuntu group=ubuntu processes=1 \
        threads=4 \
        python-path=/home/ubuntu/osm-tasking-manager2:/home/ubuntu/osm-tasking-manager2/env/lib/python2.7/site-packages
WSGIRestrictStdin Off

<VirtualHost *:80>
        ServerName example.org
        # Use only 1 Python sub-interpreter.  Multiple sub-interpreters
        # play badly with C extensions.
        WSGIPassAuthorization On
        WSGIScriptAlias /osmtm /home/ubuntu/osm-tasking-manager2/env/OSMTM.wsgi

        <Location />
            WSGIProcessGroup OSMTM_process
            WSGIApplicationGroup %{GLOBAL}
        </Location>

        <Directory /home/ubuntu/osm-tasking-manager2/env>
            <Files OSMTM.wsgi>
                Require all granted
            </Files>
            Order allow,deny
            Allow from all
        </Directory>

        LogLevel warn

        CustomLog /var/log/apache2/osmtm-access.log combined
        ErrorLog /var/log/apache2/osmtm-error.log
</VirtualHost>
```

## Customization

In case you install your own instance you may want to customize its look and
feel. You can do so by modifying the following files:
`osmtm/templates/custom.mako`, `osmtm/static/css/custom.less` &
`osmtm/static/img/favicon.ico`

## Localization

OSMTM is localized on [Transifex](https://www.transifex.com/projects/p/osm-tasking-manager2/) service.

It's possible to create translations for two resources: **current** and
**master**. *Current* resource represents currently deployed instance of the
OSMTM [http://tasks.hotosm.org](). *Master* resource represents actively
developed code that will become *current* once it gets deployed.

### Initializing translation files

In general managing translation files involves:

* generate *pot* file: `./env/bin/python setup.py extract_messages`
* initialize a message catalogue file (english): `./env/bin/python setup.py init_catalog -l en`
  * if the catalogue is already created use: `./env/bin/python setup.py update_catalog`
* eventually compile messages: `./env/bin/python setup.py compile_catalog`
* append new language to the `available_languages` configuration variable in *production.ini* file, for example `available_languages = en fr`

### Using Transifex service

* in the project top level directory, initialize transifex service (after installing `transifex-client`): `tx init`
  * the init process will ask for service URL and username/password, which will be saved to `~/.transifexrc` file
* if the project has already been initialized, but you are missing `~/.transifexrc`, create the file and modify it's access privileges `chmod 600 ~/.transifexrc`

Example `.transifexrc` file:

    [https://www.transifex.com]
    hostname = https://www.transifex.com
    password = my_super_password
    token =
    username = my_transifex_username

* after creating the project on the Transifex service: `osm-tasking-manager2`, generate the pot file, and add it as a `master` resource on the project, full resource name, in this case, is `osm-tasking-manager2.master`

#### Setting up resources

* add initial source file, in this case English:
  * `tx set --source -r osm-tasking-manager2.master -l en osmtm/locale/en/LC_MESSAGES/osmtm.po`
* add existing source files, in this case French:
  * `tx set -r osm-tasking-manager2.master -l fr osmtm/locale/fr/LC_MESSAGES/osmtm.po`
* push resources on the transifex service (this will overwrite any existing resources on the service)
  * `tx push -s -t`
  * `-s` - pushes source files (English)
  * `-t` - pushes translation files (French)

#### Pulling changes

* to pull latest changes from Transifex service execute: `tx pull`
  * this will pull every available language from the Transifex service, even the languages that are not yet mapped
  * if the language is not mapped, translated language file will be saved to the local `.tx` directory, which is not what we want so we need to define the mapping
  * for example, if we want to correctly map Croaian language you need to execute: `tx set -r osm-tasking-manager2.master -l hr osmtm/locale/hr/LC_MESSAGES/osmtm.po`
    * there is no need to create the actual po file or the directory structure, Transifex client will manage that for us
* there is also a possibility to pull specific languages: `tx pull -l hr`
* or pull only languages that have a certain completeness percentage: `tx pull --minimum-perc=90`

### Transifex workflow

#### Updating source files, locally and on the service

* update pot and source po file
  * `./env/bin/python setup.py extract_messages`
  * `./env/bin/python setup.py init_catalog -l en`

* push the source file to Transifex service
  * `tx push -s`

#### Pull latest changes from the service

* when adding a new language:
  * we need to configure local mapping: `tx set -r osm-tasking-manager2.master -l hr osmtm/locale/hr/LC_MESSAGES/osmtm.po`
  * append the new language to the `available_languages` configuration variable in *production.ini* file: `available_languages = en fr hr`
* after there are some translation updates, pull latest changes for mapped resources
  * `tx pull -l fr,hr`
* compile language files
  * `./env/bin/python setup.py compile_catalog`

## API

The tasking manager exposes some of its functionality via a RESTful API. It is documented on the following page: https://github.com/hotosm/osm-tasking-manager2/wiki/API.
