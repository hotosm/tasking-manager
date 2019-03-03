#!/bin/sh

CIRCLE_UPSTREAM_COMMIT="$(git rev-parse origin/develop)"
GIT_UPSTREAM_ADDRESS="$(git config --get remote.origin.url)"

echo "This script will run your LOCAL version of .circleci/config.yml on the remote build server."
echo "It will run the config against the latest commit on the upstream master branch used for CircleCI."
echo ""
echo "Run from within the .circleci folder in your local repo as ./circleci-trigger-locally.sh"
echo ""
echo "To use you must export your CircleCI personal API key token and it has to have permission"
echo "to trigger the build."
echo ""
echo "https://circleci.com/docs/2.0/managing-api-tokens/#creating-a-personal-api-token"
echo ""
echo "Example: export CIRCLE_TOKEN=<token-from-link-above>"
echo ""
echo "Running against ${CIRCLE_UPSTREAM_COMMIT} on ${GIT_UPSTREAM_ADDRESS}"
echo ""

case ${CIRCLE_TOKEN-} in '') echo "$0: FATAL ERROR: CIRCLE_TOKEN must be set correctly in your environment." >&2; exit 1;; esac

curl --user ${CIRCLE_TOKEN}: \
  --request POST \
  --form revision=${CIRCLE_UPSTREAM_COMMIT} \
  --form config=@config.yml \
  --form notify=false \
    https://circleci.com/api/v1.1/project/github/livingmap/gis-osm-tasking-manager/tree/develop
