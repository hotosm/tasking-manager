#!/usr/bin/env bash

echo Running HOT Tasking Manager Deploy, current branch is $CIRCLE_BRANCH

# We don't want to deploy Pull Requests only builds on develop and master
if [[ ! -z $CI_PULL_REQUEST ]]
    then
        echo Not Deploying Build $CIRCLE_BUILD_NUM - Branch is $CIRCLE_BRANCH, Is Pull Request is $CI_PULL_REQUESTS
        return
fi

# Set Version Number
VERSION=v.0.0.$CIRCLE_BUILD_NUM-$CIRCLE_BRANCH

# Only deploy to Staging if we're on develop
if [ $CIRCLE_BRANCH == "develop-branch-travis" ]
    then
        # Install AWS requirements
        pip install -r requirements.aws.txt
        printf 'n\n' | eb init hot-tasking-manager --region us-west-1
        eb use tasking-manager-staging

        # Deploy develop builds to Staging environment
        echo Deploying $VERSION to tasking-manager-staging
        eb deploy -l $VERSION
fi
