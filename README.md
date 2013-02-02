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

First clone the git repository::

    git clone git://github.com/pgiraud/osm-tasking-manager2.git

Update and load the submodules::

    cd osm-tasking-manager2
    git submodule update --init

Installing OSMTM in a Virtual Python environment is recommended.

To create a virtual Python environment::

    sudo easy_install virtualenv
    virtualenv --no-site-packages env

POSTGIS Installation
--------------------

Installation for Mac users.

The following should create an `osmtm` database::

    brew install postgis
    sh osmtm/scripts/postgis_installation_mac.sh
