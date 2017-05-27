#!/usr/bin/env bash
set -xev # halt script on error

DEMO_BRANCH="develop-branch-travis"
STAGE_BRANCH="develop-branch-travis"
PROD_BRANCH="develop-branch-travis"

DEMO_ENV="taskingmanager-demo"
STAGE_ENV="taskingmanager-stage"
PROD_ENV="taskingmanager-prod"

echo Running HOT Tasking Manager Deploy, current branch is $CIRCLE_BRANCH

# We don't want to deploy Pull Requests only builds on develop and master
if [[ ! -z $CI_PULL_REQUEST ]]
    then
        echo Not Deploying Build $CIRCLE_BUILD_NUM - Branch is $CIRCLE_BRANCH, Is Pull Request is $CI_PULL_REQUESTS
        return
fi

# Set Version Number
VERSION=v.0.0.$CIRCLE_BUILD_NUM-$CIRCLE_BRANCH

if [[ $CIRCLE_BRANCH =~ ^($DEMO_BRANCH|$STAGE_BRANCH|$PROD_BRANCH)$ ]];
  then
    if [ $CIRCLE_BRANCH == $DEMO_BRANCH ]
      then
        ENV=$DEMO_ENV
    elif [ $CIRCLE_BRANCH == $STAGE_BRANCH ]
      then
        ENV=$STAGE_ENV
    if [ $CIRCLE_BRANCH == $PROD_BRANCH ]
      then
        ENV=$PROD_ENV
    fi
    # Install AWS requirements
    pip install -r requirements.aws.txt
    printf '1\nn\n' | eb init taskingmanager --region us-east-1
    # Deploy develop builds to $ENV environment
    eb use $ENV
    echo Deploying $VERSION to $ENV
    eb deploy -l $VERSION
fi
