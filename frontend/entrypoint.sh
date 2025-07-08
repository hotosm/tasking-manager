#!/bin/sh
set -ex

echo "Installing node modules..."
yarn

# run script in CMD
exec "$@"
