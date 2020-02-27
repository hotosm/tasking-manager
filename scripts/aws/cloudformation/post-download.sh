#!/usr/bin/env bash

BASE_DIR=${BASE_DIR:-/tasking-manager}

pushd ${BASE_DIR}
python3.6 -m venv ./venv
./venv/bin/python3.6 -m pip install --upgrade pip
./venv/bin/python3.6 -m pip install -r requirements.txt

popd
