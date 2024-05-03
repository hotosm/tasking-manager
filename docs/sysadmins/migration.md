# Migrate Tasking Manager between major versions

The migrations are always a source for problems and they are made for
us to run and work. But they are not production ready. Therefore,
please do always backups and run the migration first in a testing
environment, make sure everything works as expected before you move
on!

## Migration from version 3 to version 4

First and optionally, you might want to run the following SQL script
against your database for a cleanup of eventual duplications of
priority areas:

$ `psql -d myDataBase -a -f scripts/database/duplicate-priority-area-cleanup.sql`

Now, migrating from version 3 to version 4 can be done through the
build in alembic migrations by simply running:

$ `flask db upgrade` or `pdm run upgrade`

Depending on the size of your database this might take a good while.

## Migration from version 2 to version 3

Migrating from TM2 consists of two main parts: 1) installing the
lastest Tasking Manager application and setting up its unpopulated
database and 2) migrating the data from the original TM2 database to
the new Tasking Manager database.

### Installation

The method by which you install Tasking Manager on your own computer
will vary, but you should follow the [guide to setup a development
environment](../developers/development-setup.md).

Ensure everything is met to start the migration: For this lunch the
new Tasking Manager, go to the main homepage, and click on
"Contribute" while watching the console. It will say there are
currently no projects, which is expected since you have a skeleton
database, but you should make sure no errors are thrown when the
application tries checking for projects. If the page loads
successfully and no errors occur, then you should be set and ready to
continue.

### Database Migration

With the empty database for new Tasking Manager created, we can now
migrate all the data from the TM2 installation. A [database migration
script is included](https://github.com/hotosm/tasking-manager/blob/develop/scripts/database/migration-from-tm2-postgres.sql)
to assist in this process. The beginning of this file contains important
information regarding the assumptions of your prior database name and
permissions, so please read it. That text will walk you through
backing up your old TM2 database and creating a new temporary database
for your TM2 data--though not required, it is recommended.

The database migration script is available at
https://github.com/hotosm/tasking-manager/blob/develop/scripts/database/migration-from-tm2-postgres.sql.

### After Migration

If you followed the instructions in the migration script, you should
have three databases: the original TM one, the temporary TM one, and
one for the new Tasking Manager ("taskingmanager"). You can rename the
the new database to something more intuitive or meaningful:

	psql -U my-user -c "ALTER DATABASE taskingmanager rename to my-tasking-manager;"

You can remove the temporary TM2 database:

	# PLEASE ONLY RUN THIS IF YOU HAVE FOLLOWED THE
	#   INSTRUCTIONS IN THE MIGRATION SCRIPT!
	psql -U my-user -c "DROP DATABASE tm2;"

It is up to you when you feel comfortable removing the original TM
database. You may also want to manually `vacuum`.

## Migration from version 1 to version 2

There is no known upgrade path. Please inform us, if you know more.
