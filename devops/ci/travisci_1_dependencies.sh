#!/usr/bin/env bash
set -ev # halt script on error

# Install latest LTS node
env
pwd
echo $TRAVIS_BUILD_DIR
sudo apt-get update
curl -sL https://deb.nodesource.com/setup_6.x | sudo -E bash -
sudo apt-get install nodejs libgeos-c1 libgeos-dev # Required for shapely
node --version

# Install NPM packages and build client from gulpfile
cd client
sudo npm install
sudo ./node_modules/.bin/gulp build
cd ..

# Install Python dependencies
python --version
pip install -r requirements.txt
