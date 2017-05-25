#!/usr/bin/env bash
set -ev # halt script on error

# JS Unit Tests
cd tests/client
sudo ../../client/node_modules/.bin/karma start ./karma.conf.js --single-run --browsers PhantomJS --reporters junit
cd ../..

# Run Python tests
env
./env/bin/python ./env/bin/nosetests ./tests/server --with-xunit --xunit-file ./shippable/testresults/unitresults.xml --with-coverage --cover-erase --cover-package=./server
./env/bin/coverage xml -o shippable/codecoverage/coverage.xml
