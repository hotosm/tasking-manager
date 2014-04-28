# OpenStreetMap Tasking Manager

[![Build Status](https://travis-ci.org/pgiraud/osm-tasking-manager2.svg?branch=master)](https://travis-ci.org/pgiraud/osm-tasking-manager2)
[![Coverage Status](https://coveralls.io/repos/pgiraud/osm-tasking-manager2/badge.png?branch=master)](https://coveralls.io/r/pgiraud/osm-tasking-manager2?branch=master)

## About

OSMTM enables collaborative work on specific areas in OpenStreetMap by defining
clear workflows to be achieved and by breaking tasks down into pieces.

The application is written in Python using the Pyramid framework.

This is the 2.0 version of the Tasking Manager.

## Installation

First clone the git repository:

    git clone --recursive git://github.com/pgiraud/osm-tasking-manager2.git

Installing OSMTM in a Virtual Python environment is recommended.

To create a virtual Python environment:

    cd osm-tasking-manager2
    sudo easy_install virtualenv
    virtualenv --no-site-packages env
    env/bin/python setup.py develop
    
*Tip: if you encounter problems installing `psycopg2` especially on Mac, it is recommended to follow advice proposed [here](http://stackoverflow.com/questions/22313407/clang-error-unknown-argument-mno-fused-madd-python-package-installation-fa).*

### Database

OSMTM requires a PostgreSQL/PostGIS database. Version 2.x of PostGIS is
required.

First create a database user/role named `www-data`:

    sudo -u postgres createuser -SDRP www-data

Then create a database named `osmtm`:

    sudo -u postgres createdb -O www-data osmtm
    sudo -u postgres psql -d osmtm -c "CREATE EXTENSION postgis;"

Now edit the `development.ini` file and set the value of `sqlalchemy.url` as
appropriate. For example:

    sqlalchemy.url = postgresql://your_db_user:your_db_password@localhost/osmtm

You're now ready to do the initial population of the database. An
`initialize_osmtm_db` script is available in the virtual env for that:

    env/bin/initialize_osmtm_db development.ini

## Launch the application

    env/bin/pserve --reload development.ini

## Styles

The CSS stylesheet are compiled using less. Launch the following command as
soon as you change the css::

    lessc -ru osmtm/static/css/main.less > osmtm/static/css/main.css

## Tests

The tests use a separate database. Create that database first:

    sudo -u postgres createdb -O www-data osmtm_tests
    sudo -u postgres psql -d osmtm_tests -c "CREATE EXTENSION postgis;"

Edit `osmtm/tests/__init__.py` and change the database connection string set
in the `db_url` variable as appropriate.

To run the tests, use the following command:

    env/bin/nosetests
