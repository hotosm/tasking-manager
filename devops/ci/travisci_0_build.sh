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
../../client/node_modules/.bin/karma start ./karma.conf.js --single-run --browsers PhantomJS --reporters junit
cd ../..

# Install Python dependencies
python --version
sudo apt-get install -y libgeos-c1 libgeos-dev  # Required for shapely
pip install -r requirements.txt

# Run Python tests
nosetests ./tests/server --with-xunit --xunit-file ./shippable/testresults/unitresults.xml --with-coverage --cover-erase --cover-package=./server
coverage xml -o shippable/codecoverage/coverage.xml
