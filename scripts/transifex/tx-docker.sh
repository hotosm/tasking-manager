#!/bin/bash

# Detect certificate file automatically (for Mac/Linux)
CERT_FILE=""
if [[ "$OSTYPE" == "darwin"* ]]; then
    CERT_FILE="/etc/ssl/cert.pem"  # macOS default
elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
    CERT_FILE="/etc/ssl/certs/ca-certificates.crt"  # Debian/Ubuntu default
fi

if [ ! -f "$CERT_FILE" ]; then
    echo "Could not find system certificate file automatically."
    echo "Please set the CERT_FILE environment variable manually."
    exit 1
fi

CUR_WORK_DIR=$(pwd)
CERT_DOCKER_PATH="/etc/ssl/certs/ca-certificates.crt"

docker run --rm -it -v $HOME/.transifexrc:/.transifexrc -v "$CERT_FILE":"$CERT_DOCKER_PATH" -v $CUR_WORK_DIR:/app -w /app  transifex/txcli "$@"
