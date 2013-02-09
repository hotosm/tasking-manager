#5. Create your app database
dropdb osmtm
createdb -T postgis_template -O www-data osmtm;

dropdb osmtm_tests
createdb -T postgis_template -O www-data osmtm_tests;
