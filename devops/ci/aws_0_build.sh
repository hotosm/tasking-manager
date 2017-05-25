#!/usr/bin/env bash
set -ev # halt script on error

# Install latest LTS node
apt-get update
curl -sL https://deb.nodesource.com/setup_6.x | bash -
apt-get install nodejs
node --version

# Install NPM packages and build client from gulpfile
cd client
npm install
./node_modules/.bin/gulp build
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
apt-get install -y libgeos-c1 libgeos-dev  # Required for shapely
pip install -r requirements.txt

# Run Python tests
nosetests ./tests/server --with-xunit --xunit-file ./shippable/testresults/unitresults.xml --with-coverage --cover-erase --cover-package=./server || true
coverage xml -o shippable/codecoverage/coverage.xml || true
