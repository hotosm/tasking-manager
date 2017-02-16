#!/usr/bin/env bash

echo Running HOT Tasking Manager Deploy, current branch is $BRANCH

# We don't want to deploy Pull Requests only builds on develop and master
#if [ $IS_PULL_REQUEST == true ]
#    then
#        echo Not Deploying Build $BUILD_NUMBER - Branch is $BRANCH, Is Pull Request is $IS_PULL_REQUEST
#        return
#fi

# Set Version Number
VERSION=v.0.0.$BUILD_NUMBER-$BRANCH


python -m venv ./venv_aws
. ./venv_aws/bin/activate
pip install -r requirements.aws.txt
printf '1\nn\n' | eb init hot-tasking-manager --region eu-west-1
eb use tasking-manager-staging
eb deploy -l $VERSION