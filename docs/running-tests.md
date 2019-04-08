# Run tests

If you are working on code development, you may be writing tests to cover your new code. Or you may want to make sure that your changes do not cause unintended side effects on prior code. This guide details how you can get the infrastructure up and running to execute API tests.

## Initial Setup

First, we need to initialize the testing database. This ensures that tests are run on a clean database that does not contain any duplicate data and so that the tests can be reproducible in any environment.

1. Create a new PostgreSQL database for testing: `sudo -u postgres psql -c "CREATE DATABASE tasking-manager-tests OWNER 'hottm';"`.
2. Update the `TM_DB` environmental variable to point to this database: `export TM_DB="postgresql://hottm:hottm@localhost/tasking-manager-tests"`.
3. In the base Tasking Manager directory, initialize the database schema: `venv/bin/python manage.py db upgrade`.

## Running Tests

With the database initialized, we can now invoke the test call.

1. Update the `TM_DB` environmental variable to point to the testing database: `export TM_DB="postgresql://hottm:hottm@localhost/tasking-manager-tests"`.
2. In the base Tasking Manager directory, call the test application: `venv/bin/nosetests ./tests/server`
