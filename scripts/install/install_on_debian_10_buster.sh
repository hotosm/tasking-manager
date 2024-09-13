#!/bin/bash
#
# Script to install the Tasking Manager on Debian 10 Buster
# The script must be executed from the root of the project

# Ensure being run on the supported operating system
distribution=$(lsb_release -si)
version=$(lsb_release -sc)

if [ "$distribution" != "Debian" ] || [ "$version" != "buster" ]; then
  echo -e "ERROR: Your operating system is not supported by this installation script"
  exit
fi

# Make sure the system is up-to-date
sudo apt update && sudo apt -y upgrade &&

## Install general tools
sudo apt install -y build-essential curl git libgeos-dev software-properties-common &&

# Install Python and Node
curl -sL https://deb.nodesource.com/setup_10.x | sudo bash -
sudo apt install -y python3 python3-dev nodejs &&

# Install the database
sudo apt install -y postgresql-10 libpq-dev postgresql-server-dev-10 postgresql-10-postgis-2.4 postgresql-10-postgis-scripts &&

## Obtain the tasking manager
git clone https://github.com/hotosm/tasking-manager.git &&

## Prepare the tasking manager
cd tasking-manager/ &&
pip install --upgrade pip &&
pip install --upgrade pdm &&
pdm install &&

# Set up configuration
# Sets db endpoint to localhost.
if ! test -f tasking-manager.env
	then
    cp example.env tasking-manager.env
fi
. ./tasking-manager.env &&
sed -i '/POSTGRES_ENDPOINT/s/^# //g' tasking-manager.env &&

# Set up data base
if ! sudo -u postgres psql -c "SELECT u.usename FROM pg_catalog.pg_user u;" | grep -w -q $POSTGRES_USER
	then
		sudo -u postgres psql -c "CREATE USER $POSTGRES_USER WITH PASSWORD '$POSTGRES_PASSWORD';"
fi
if ! sudo -u postgres psql -c "SELECT datname FROM pg_database WHERE datistemplate = false;" | grep -w -q $POSTGRES_DB
	then
    sudo -u postgres createdb -T template0 $POSTGRES_DB -E UTF8 -O $POSTGRES_USER &&
    sudo -u postgres psql -d $POSTGRES_DB -c "CREATE EXTENSION postgis;"
fi


# Populate database
cd tests/database/ &&
sudo -u postgres psql -d $POSTGRES_DB -c "\i tasking-manager.sql" &&
for tbl in `sudo -u postgres psql -qAt -c "select tablename from pg_tables where schemaname = 'public';" $POSTGRES_DB`;
do  sudo -u postgres psql -c "alter table \"$tbl\" owner to $POSTGRES_USER" $POSTGRES_DB ; done &&
for tbl in `sudo -u postgres psql -qAt -c "select tablename from pg_tables where schemaname = 'topology';" $POSTGRES_DB`;
do  sudo -u postgres psql -c "alter table \"$tbl\" owner to $POSTGRES_USER" $POSTGRES_DB ; done &&
cd ../../ &&

# Upgrade database
pdm run flask db upgrade &&

# Assamble the tasking manager interface
cd frontend/ &&
npm install &&
npm run build &&
cd ../ &&

## Please edit the tasking-manager.env as indicated in the README.md ##

# Start the tasking manager
pdm run flask run -d
