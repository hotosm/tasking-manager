# Deployment Process

### Deploying to AWS

**Backend**

Prerequisites:
  - AWS Simple Email Service Domain and SMTP Credentials
  - AWS VPC and Security groups:
  	- VPC: `hotosm-network-production-default-vpc-<region>`
  	- Security Groups:
  	  - `hotosm-network-production-<NetworkEnvironment>-ec2s-security-group`
  	  - `hotosm-network-production-<NetworkEnvironment>-elbs-security-group`
  - [cfn-config](https://github.com/mapbox/cfn-config)
  - S3 bucket for storing cfn-config json files

```
cfn-config create <stack-name> scripts/aws/cloudformation/tasking-manager.template.js -t <cfn-template-bucket> -c <cfn-config-bucket>
```

**Frontend**

This step is optional if you choose to setup [CI/CD](./ci-cd.md)

First the environment variables in `./frontend/.env`, then run the following code. `<TaskingManagerReactBucket>` is the name of the bucket in the cloudformation stack created above.

```
cd ./frontend/
yarn
yarn build
aws s3 sync build/ <TaskingManagerReactBucket> --delete
```

### Performing Updates

When deploying updates to the infrastructure or code, follow the steps below.

#### Backup Database
Before updating it's always recommended to backup the database. You can make a snapshot in AWS RDS console, or run the database dump directly. You will need sufficient access to a server on the same VPC as the RDS instance in order to connect to it directly.

```
PGPASSWORD=<PostgresPassword> pg_dump -Fc \
  -h <RDS_URI> \
  -U <PostgresUser> \
  -f backup.dump \
  <PostgresDB>
```

#### Update backend infrastructure

If the deployment contains any changes to the cloudformation template, including new or changes to environment variables, then we must update the infrastructure prior to deployment. These changes are deliberately set outside the CI/CD process to prevent accidental deletion of data. For the HOT Tasking Manager, only staff with sufficient AWS privileges have the ability to perform these functions.

1. Pull the latest changes locally
2. Run the `cfn-config update` command, keeping in mind to update any new parameters that were added.

```
cfn-config update tm4-production \
 scripts/aws/cloudformation/tasking-manager.template.js \
 -t hot-cfn-config -c hot-cfn-config
```

#### Deploy Code to Production

Make sure you have set up [CI/CD properly first](./ci-cd.md). We use a simple git branch model to manage different deployments/environments, so adjust the branch names as needed.

```
git checkout develop
git fetch
git pull origin develop
git checkout deployment/hot-tasking-manager
git pull origin deployment/hot-tasking-manager
git rebase develop
git push origin deployment/hot-tasking-manager
```

In the event that the changes to be deployed are frontend only, you may instead rebase and push the `deployment/hot-tasking-manager-frontend` branch. This will be significantly faster and less disruptive than a standard deployment, which has to replace compute resources.
