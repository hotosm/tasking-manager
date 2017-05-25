#!/usr/bin/env bash
set -ev # halt script on error

# Install latest LTS node
sudo apt-get update
curl -sL https://deb.nodesource.com/setup_6.x | sudo -E bash -
sudo apt-get install nodejs
node --version

# Install NPM packages and build client from gulpfile
cd client
sudo -E npm install
sudo -E ./node_modules/.bin/gulp build
cd ..

# Required to display test results in Shippable GUI
mkdir -p shippable/testresults
mkdir -p shippable/codecoverage

# JS Unit Tests
cd tests/client
sudo -E ../../client/node_modules/.bin/karma start ./karma.conf.js --single-run --browsers PhantomJS --reporters junit
cd ../..

# Install Python dependencies
sudo apt-get install -y libgeos-c1 libgeos-dev  # Required for shapely
python --version
virtualenv env
env/bin/pip install --upgrade pip
env/bin/pip install -r requirements.txt
python --version

# Run Python tests
pwd
env
source env/bin/activate
env/bin/pip freeze
env/bin/nosetests ./tests/server --with-xunit --xunit-file ./shippable/testresults/unitresults.xml \
  --with-coverage --cover-erase --cover-package=./server
env/bin/coverage xml -o shippable/codecoverage/coverage.xml
