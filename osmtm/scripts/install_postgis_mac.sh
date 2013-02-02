# adapted from https://gist.github.com/1081907

#1. Ensure that postgreSQl is running

#2. Creating the postgis_template

dropdb postgis_template
createdb postgis_template
createlang plpgsql postgis_template

psql -d postgis_template -f /usr/local/Cellar/postgis/2.0.2/share/postgis/postgis.sql

#[Mac OSX] Import Postgis Data
psql -d postgis_template -f /usr/local/Cellar/postgis/2.0.2/share/postgis/postgis.sql
psql -d postgis_template -f /usr/local/Cellar/postgis/2.0.2/share/postgis/spatial_ref_sys.sql
 
psql -d postgis_template -f /usr/local/Cellar/postgis/2.0.2/share/postgis/topology.sql
 
#Test if works
psql -d postgis_template -c "SELECT postgis_full_version();"
 
#3. Set template permissions to gisgroup
createuser -R -S -L -D -I gisgroup;
 
psql -d postgis_template -c "ALTER DATABASE postgis_template OWNER TO gisgroup;"
psql -d postgis_template -c "ALTER TABLE geometry_columns OWNER TO gisgroup;"
psql -d postgis_template -c "ALTER TABLE spatial_ref_sys OWNER TO gisgroup;"
psql -d postgis_template -c "CREATE SCHEMA gis_schema AUTHORIZATION gisgroup;"
 
#4. Adds your app's user
createuser -i -l -S -R -d www-data 
 
psql -d postgres -c 'GRANT gisgroup TO "www-data";'
 
#5. Create your app database
dropdb osmtm
createdb -T postgis_template -O www-data osmtm;
