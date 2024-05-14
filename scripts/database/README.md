# Database scripts

These scripts are a collection of scripts doing useful things on the Tasking Manager database.

* `migration-from-tm2-postgres.sql` - Migration from Tasking Manager 2 to the newest version.
* `proj-geom-cleanup.sql` - Clean up script for legacy projects and broken geometries.
* `restart_table.sh` - Delete and create empty database with PostGIS extension again.
* `export-import-projects` - Scripts to CSV export and import into the database projects with their dependent data from backups.