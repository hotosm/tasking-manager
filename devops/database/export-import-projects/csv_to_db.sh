
do_dash() {
   echo "---------------------------------------------------------------"
}

do_dash; echo "\n Defining variables"

RDS_LIST=( "prod-05-jun" "prod-06-jun" "prod-07-jun" "prod-08-jun" "prod-09-jun"
           "prod-10-jun" "prod-11-jun" "prod-snapshot-before-12-jun-deploy" "prod-12-jun" )
FOLDER_PATH=dump/lost_projects

for HOST in "${RDS_LIST[@]}"; do
  echo $HOST
  do_dash; echo "Priority areas tables"
  TABLE=priority_areas
  FILE=$FOLDER_PATH/$HOST/$TABLE.csv
  psql "host=$TARGET_HOST.$ENDPOINT dbname=$DB user=$DB_USER password=$DB_PASSWORD" -c \
  	"\copy $TABLE FROM '$FILE' DELIMITER ',' CSV HEADER"

  ###############################################################################################

  do_dash; echo "Projects table"
  TABLE=projects
  FILE=$FOLDER_PATH/$HOST/$TABLE.csv
  psql "host=$TARGET_HOST.$ENDPOINT dbname=$DB user=$DB_USER password=$DB_PASSWORD" -c \
  	"\copy $TABLE FROM '$FILE' DELIMITER ',' CSV HEADER"

  ###############################################################################################

  do_dash; echo "Project allowed users"
  TABLE=project_allowed_users
  FILE=$FOLDER_PATH/$HOST/$TABLE.csv
  psql "host=$TARGET_HOST.$ENDPOINT dbname=$DB user=$DB_USER password=$DB_PASSWORD" -c \
  	"\copy $TABLE FROM '$FILE' DELIMITER ',' CSV HEADER"

  ###############################################################################################

  do_dash; echo "Tasks table"
  TABLE=tasks
  FILE=$FOLDER_PATH/$HOST/$TABLE.csv
  psql "host=$TARGET_HOST.$ENDPOINT dbname=$DB user=$DB_USER password=$DB_PASSWORD" -c \
  	"\copy $TABLE FROM '$FILE' DELIMITER ',' CSV HEADER"

  ###############################################################################################

  do_dash; echo "Task history"
  TABLE=task_history
  FILE=$FOLDER_PATH/$HOST/$TABLE.csv
  psql "host=$TARGET_HOST.$ENDPOINT dbname=$DB user=$DB_USER password=$DB_PASSWORD" -c \
  	"\copy $TABLE FROM '$FILE' DELIMITER ',' CSV HEADER"

  ###############################################################################################

  do_dash; echo "Task invalidation history"
  TABLE=task_invalidation_history
  FILE=$FOLDER_PATH/$HOST/$TABLE.csv
  psql "host=$TARGET_HOST.$ENDPOINT dbname=$DB user=$DB_USER password=$DB_PASSWORD" -c \
  	"\copy $TABLE FROM '$FILE' DELIMITER ',' CSV HEADER"

  ###############################################################################################

  do_dash; echo "Project priority areas"
  TABLE=project_priority_areas
  FILE=$FOLDER_PATH/$HOST/$TABLE.csv
  psql "host=$TARGET_HOST.$ENDPOINT dbname=$DB user=$DB_USER password=$DB_PASSWORD" -c \
  	"\copy $TABLE FROM '$FILE' DELIMITER ',' CSV HEADER"

  ###############################################################################################

  do_dash; echo "Project chat"
  TABLE=project_chat
  FILE=$FOLDER_PATH/$HOST/$TABLE.csv
  psql "host=$TARGET_HOST.$ENDPOINT dbname=$DB user=$DB_USER password=$DB_PASSWORD" -c \
  	"\copy $TABLE FROM '$FILE' DELIMITER ',' CSV HEADER"

  ###############################################################################################

  do_dash; echo "Project info"
  TABLE=project_info
  FILE=$FOLDER_PATH/$HOST/$TABLE.csv
  psql "host=$TARGET_HOST.$ENDPOINT dbname=$DB user=$DB_USER password=$DB_PASSWORD" -c \
  	"\copy $TABLE FROM '$FILE' DELIMITER ',' CSV HEADER"

  ###############################################################################################

  do_dash; echo "Messages"
  TABLE=messages
  FILE=$FOLDER_PATH/$HOST/$TABLE.csv
  psql "host=$TARGET_HOST.$ENDPOINT dbname=$DB user=$DB_USER password=$DB_PASSWORD" -c \
  	"CREATE TABLE temp_$TABLE(LIKE messages);"
  psql "host=$TARGET_HOST.$ENDPOINT dbname=$DB user=$DB_USER password=$DB_PASSWORD" -c \
    	"\copy temp_$TABLE FROM '$FILE' DELIMITER ',' CSV HEADER;"
  psql "host=$TARGET_HOST.$ENDPOINT dbname=$DB user=$DB_USER password=$DB_PASSWORD" -c \
      	"UPDATE $TABLE SET
      		task_id=temp_$TABLE.task_id,
      		project_id=temp_$TABLE.project_id
      	FROM temp_$TABLE
      	WHERE
      		temp_$TABLE.id=$TABLE.id
      	AND
      		temp_$TABLE.id IN (SELECT id FROM $TABLE);
      	INSERT INTO $TABLE SELECT * FROM temp_$TABLE WHERE id NOT IN (SELECT id FROM messages);
      	DROP TABLE temp_$TABLE;"


done
