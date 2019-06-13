NEW_DB='tm_new'

echo $NEW_DB
psql -U $DB_USER -d $DB -c "DROP DATABASE $NEW_DB"
psql -U $DB_USER -d $DB -c "CREATE DATABASE $NEW_DB"
psql -U $DB_USER -d $NEW_DB -c "CREATE EXTENSION postgis;"