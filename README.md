# HOT tasking-manager

## Dev Ops

### Server Config

#### Environment Vars

On boot the Tasking Manager App will look for the following environment vars:

* **TASKING_MANAGER_ENV** - Allows you to specify which config to load from ./server/config.py  Acceptable values:
    * **Dev** - This is the default
    * **Staging** - Use this for your staging/test environment
    * **Prod** - Use this for your production environment

## Client

### Setup
From the command line navigate to the root client directory and run npm install:

```
cd client
npm install
```

### Running the app
TODO: add instructions on how to start the server

To run the application, navigate to the root client directory and use Gulp.

```
cd client
gulp run
```

### Testing the app

#### Karma unit tests
To run the tests from the command line, navigate to the root client directory and run Karma

```
cd client
karma start ..\tests\client\karma.conf.js
```
