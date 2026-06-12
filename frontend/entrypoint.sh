#!/bin/sh
set -ex

echo "Installing node modules..."
yarn config set registry https://registry.npmjs.org
yarn install --network-timeout 600000 --network-concurrency 1 --verbose

# run script in CMD
exec "$@"