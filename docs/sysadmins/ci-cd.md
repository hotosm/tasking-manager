# CI/CD

We use CircleCI to manage Continuous Integration and Continuous Deployment.

| **Environment**     | **Branch**                              |
|---------------------|-----------------------------------------|
| Production          | deployment/hot-tasking-manager          |
| Production-frontend | deployment/hot-tasking-manager-frontend |
| Staging             | develop                                 |
| TeachOSM            | deployment/teachosm-tasking-manager     |
| Indonesia           | deployment/id-tasking-manager           |

Each environment has its own set of environment variables which are stored as secrets in the CircleCI Organization Settings under Contexts. At the moment, these variables are for the frontend builds only. See the [deployment docs](deployment.md) for updating backend variables.

- OPSGENIE_API
- TM_APP_API_URL
- TM_APP_API_VERSION
- TM_APP_BASE_URL
- TM_CONSUMER_KEY
- TM_CONSUMER_SECRET
- TM_ENABLE_SERVICEWORKER
- TM_MAPBOX_TOKEN
- TM_MATOMO_ENDPOINT
- TM_MATOMO_ID
- TM_ORG_CODE
- TM_ORG_NAME
- TM_ORG_PRIVACY_POLICY_URL
- TM_ORG_URL
- TM_SERVICE_DESK

## Automated Tests

For each Pull Request and branch, the CI runs a set of frontend and backend tests. We have a context in place called "tasking-manager-testing" for setting up the database with the following environment variables:

- POSTGRES_DB
- POSTGRES_ENDPOINT
- POSTGRES_USER
- TM_ORG_CODE
- TM_ORG_NAME

Note that the POSTGRES_DB variable should be for the default database (in our case `tm`) the testing script will create a database called `test_$POSTGRES_DB` during setup.
The `TM_ORG_*` vars are required for certain tests to pass; most notably )`test_variable_replacing` in the `TestTemplateService`.

## Refreshing CircleCI Cache

The CI stores the frontend node_modules folder to save time on builds. Sometimes it will be necessary to force all builds to use a fresh installation, so the cache will have to be refreshed manually.

In the Tasking Manager CircleCI settings there is an environment variable "CACHEVERSION". Set this value to `v{n}` where {n} is an integer increased by 1 each time you wish to clear the cache.
