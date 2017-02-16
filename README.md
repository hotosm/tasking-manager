# HOT tasking-manager

## Dev Ops

### Server Config

#### Environment Vars

On boot the Tasking Manager App will look for the following environment vars:

* **TASKING_MANAGER_ENV** - Allows you to specify which config to load from ./server/config.py  Acceptable values:
    * **Dev** - This is the default
    * **Staging** - Use this for your staging/test environment
    * **Prod** - Use this for your production environment
