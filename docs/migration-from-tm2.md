# Migrate Tasking Manager from version 2 to latest version

Migrating from TM2 consists of two main parts: 1) installing the lastest Tasking Manager application and setting up its unpopulated database and 2) migrating the data from the original TM2 database to the new Tasking Manager database.

## Installation

The method by which you install Tasking Manager on your own computer will vary, but you should follow the [guide to setup a development environment](./setup-development.md) or check out how to [setup a live installation](./setup-live.md). 

Ensure everything is met to start the migration: For this lunch the new Tasking Manager, go to the main homepage, and click on "Contribute" while watching the console. It will say there are currently no projects, which is expected since you have a skeleton database, but you should make sure no errors are thrown when the application tries checking for projects. If the page loads successfully and no errors occur, then you should be set and ready to continue.

## Database Migration

With the empty database for new Tasking Manager created, we can now migrate all the data from the TM2 installation. A [database migration script is included](../scripts/database/migration-from-tm2-postgres.sql) to assist in this process. The beginning of this file contains important information regarding the assumptions of your prior database name and permissions, so please read it. That text will walk you through backing up your old TM2 database and creating a new temporary database for your TM2 data--though not required, it is recommended.

The database migration script is available at https://github.com/hotosm/tasking-manager/blob/master/scripts/database/migration-from-tm2-postgres.sql

## After Migration

If you followed the instructions in the migration script, you should have three databases: the original TM2, the temporary TM2 ("tm2"), and one for the new Tasking Manager ("taskingmanager"). You can rename the the new database to something more intuitive or meaningful:

```
psql -U my-user -c "ALTER DATABASE taskingmanager rename to my-tasking-manager;"
```

You can remove the temporary TM2 database:

```
# PLEASE ONLY RUN THIS IF YOU HAVE FOLLOWED THE 
#   INSTRUCTIONS IN THE MIGRATION SCRIPT!
psql -U my-user -c "DROP DATABASE tm2;"
```

It is up to you when you feel comfortable removing the original TM2 database. You may also want to manually `vacuum`.
