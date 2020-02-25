#!/usr/bin/env bash
set -e

BASE_DIR=/tasking-manager

pushd ${BASE_DIR:-tasking-manager}/frontend
npm install
npm install -g pm
npm run build

popd
