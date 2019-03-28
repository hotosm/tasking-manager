#!/usr/bin/env bash
set -xev # halt script on error

# demo and stage branch are set via environment variables in CircleCI
# DEMO_BRANCH="testing branch"
# STAGE_BRANCH="develop"
PROD_BRANCH="kaart"

DEMO_ENV="taskingmanager-demo"
STAGE_ENV="taskingmanager-stage"
PROD_ENV="taskingmanager-prod"

echo Running HOT Tasking Manager Deploy, current branch is $CIRCLE_BRANCH

# We don't want to deploy Pull Requests only builds on develop and master
# TODO: commenting this out while develop-branch-travis is a PR
# if [[ ! -z $CI_PULL_REQUEST ]]
#     then
#         echo Not Deploying Build $CIRCLE_BUILD_NUM - Branch is $CIRCLE_BRANCH, Is Pull Request is $CI_PULL_REQUESTS
#         return
# fi

# Set Version Number
VERSION=v.0.0.$CIRCLE_BUILD_NUM-$(echo $CIRCLE_BRANCH | tr -cd '[[:alnum:]]._-')

if [[ $CIRCLE_BRANCH =~ ^($DEMO_BRANCH|$STAGE_BRANCH|$PROD_BRANCH)$ ]];
  then
    # Install AWS requirements
    pip install -r requirements.aws.txt
    printf '1\nn\n' | eb init kaart-tasking-manager --region us-west-2
  else
    echo "$CIRCLE_BRANCH does not match"
fi

# Deploy to Demo Env
if [ $CIRCLE_BRANCH == $DEMO_BRANCH ]
  then
    # Deploy develop builds to Staging environment
    eb use $DEMO_ENV
    echo Deploying $VERSION to $DEMO_ENV
    eb deploy -l $VERSION
fi

# Deploy to Stage Env
if [ $CIRCLE_BRANCH == $STAGE_BRANCH ]
  then
    # Deploy develop builds to Staging environment
    eb use $STAGE_ENV
    echo Deploying $VERSION to $STAGE_ENV
    eb deploy -l $VERSION
fi

# Deploy to Prod Env
if [ $CIRCLE_BRANCH == $PROD_BRANCH ]
  then
    # Deploy develop builds to Staging environment
    eb use $PROD_ENV
    echo Deploying $VERSION to $PROD_ENV
    eb deploy -l $VERSION
fi
