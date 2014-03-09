OpenStreetMap Tasking Manager
=============================

About
-----

OSMTM enables collaborative work on specific areas in OpenStreetMap by defining
clear workflows to be achieved and by breaking tasks down into pieces.

The application is written in Python using the Pyramid framework.

This is the 2.0 version of the Tasking Manager.

Dependencies
------------

OSMTM has a set of dependencies that you need to install first.

On debian systems you can do::

    sudo apt-get install build-essential protobuf-compiler libprotobuf-dev libgeos-dev python-dev

On OS X you can do::

    brew install protobuf geos


Installation
------------

First clone the git repository:

    git clone --recursive git://github.com/pgiraud/osm-tasking-manager2.git

Installing OSMTM in a Virtual Python environment is recommended.

To create a virtual Python environment:

    cd osm-tasking-manager2
    sudo easy_install virtualenv
    virtualenv --no-site-packages env
    env/bin/python setup.py develop

In order to see jobs and tiles on the maps, you'll need to have Mapnik as
a Python module.
First install mapnik (using homebrew if on Mac).
Then, you'll probably need to add a symbolic link to the Mapnik package in your
virtualenv site-packages:

    ln -s /Library/Python/2.7/site-packages/mapnik env/lib/python2.7/site-packages/

or

    ln -s /usr/lib/pymodules/python2.7/mapnik env/lib/python2.7/site-packages/

Now you need to create the database. We're assuming that you have PostGIS
installed. If it's not the case, see instructions below.
We also assume that there's a `postgis_template` database already existing.

First create a `www-data` db user. Give it `www-data` as password when prompted:

    sudo -u postgres createuser -SDRP www-data

Then create the database:

    sudo -u postgres sh osmtm/scripts/create_db.sh

Launch the application
----------------------

    pserve --reload development.ini

POSTGIS Installation
--------------------

Installation for Mac users.

The following should create an `osmtm` database:

    brew install postgis
    sh osmtm/scripts/install_postgis_mac.sh

Styles
------

The CSS stylesheet are compiled using less. Launch the following command as
soon as you change the css::

    lessc -ru osmtm/static/css/main.less > osmtm/static/css/main.css

Tests
-----

The `create_db.sh` script should have created a test database as well.

To run the tests, use the following command:

    env/bin/nosetests
