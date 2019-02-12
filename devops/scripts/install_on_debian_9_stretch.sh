#!/bin/bash
#
# Script to install the Tasking Manager on Debian 9 - Stretch
#

# Ensure being run on the supported operating system
distribution=$(lsb_release -si)
version=$(lsb_release -sc)

if [ "$distribution" != "Debian" ] || [ "$version" != "stretch" ]; then
  echo -e "ERROR: Your operating system is not supported by this installation script"
  exit
fi

# Make sure the system is up-to-date
sudo apt update && sudo apt -y upgrade &&

## Install general tools
sudo apt install -y build-essential curl git libgeos-dev software-properties-common &&

# Install Python
sudo apt install -y python3 python3-dev python3-venv &&

# Install the database
sudo apt install -y postgresql-9.6 libpq-dev postgresql-server-dev-9.6 postgresql-9.6-postgis-2.3 postgresql-9.6-postgis-scripts &&

# Install Node
curl -sL https://deb.nodesource.com/setup_10.x > install-node.sh &&
sudo chmod +x install-node.sh && sudo ./install-node.sh &&
sudo apt -y install nodejs &&
sudo npm install -g gulp gulp-cli karma karma-jasmine karma-chrome-launcher &&

## Obtain the tasking manager
git clone https://github.com/hotosm/tasking-manager.git &&

## Prepare the tasking manager
cd tasking-manager/ &&
python3 -m venv ./venv &&
. ./venv/bin/activate &&
pip install --upgrade pip &&
pip install -r requirements.txt &&

# Set up configuration
# Sets db endpoint to localhost.
cp example.env tasking-manager.env &&
sed -i '/POSTGRES_ENDPOINT/s/^# //g' tasking-manager.env &&

# Set up data base
sudo -u postgres psql -c "CREATE USER tm WITH PASSWORD 'tm';" &&
sudo -u postgres createdb -T template0 tasking-manager -E UTF8 -O tm &&
sudo -u postgres psql -d tasking-manager -c "CREATE EXTENSION postgis;" &&

# Initiate database
./venv/bin/python3 manage.py db upgrade &&

# Assamble the tasking manager interface
cd client/ &&
npm install &&
gulp build &&
cd ../ &&

## Please edit the tasking-manager.env as indicated in the README.md ##

# Start the tasking manager
./venv/bin/python manage.py runserver -d
