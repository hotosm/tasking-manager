#5. Create your app database
dropdb osmtm
createdb -T template_postgis -O www-data osmtm;

dropdb osmtm_tests
createdb -T template_postgis -O www-data osmtm_tests;
