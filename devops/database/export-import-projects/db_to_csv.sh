
do_dash() {
   echo "---------------------------------------------------------------"
}

SAVE=true

# 983,523,5780,286,1088,5014,4626,2854,1125,1858,2169,4443,3035,4179,3866,1774,1308,5667,3156,5498,4992,5831,4828,5639,3566,4811,3518,2014,3271,2871,5655,5447,4324,2338,2283,1770,3736,3605,1702,704,2843,1179,5580,2679,4083,5601,2051,2893,1999,546,4226,3109,6035,4465,4090,1707,1019,2157,4983,2156,886,4153,553,2543,1970,2759,2632,5839,4539,4531,4746,1783,3323,2199,5958,830,2638,2072,5417,1367,1192,5059,2890,1877,1782,5651,4743,4111,897,339,5583,3562,3448,3098,188,5523,5582,4784,2770,6127
do_dash; echo "\n Defining variables"

RDS_LIST=( "prod-05-jun" "prod-06-jun" "prod-07-jun" "prod-08-jun" "prod-09-jun"
           "prod-10-jun" "prod-11-jun" "prod-snapshot-before-12-jun-deploy" "prod-12-jun" )
PROJECT_IDS=( "(4995)" "(4413,5365,5401,5402,5474,5501,5604,5605,5740,5773,5795,5840,5890,5999,6000,6002)"
             "(1945,3744,5127,5375,5685,5762,5956,5968,5969,5978,6067)"
             "(3901,5808,5844)" "(5953,5692,5169,4166,3904)"
             "(6015,6005,5948,5274,4411,4392,4259)"
             "(2742,3389,5340,5455,5652)" "(5942,4351)"
             "(2469,4597,5509,5660,5831,5895,5907,5964,6059,6061)" )
IDX=0

# Create folder.
echo "Creating folders"
FOLDER_PATH=dump/lost_projects
mkdir -p $FOLDER_PATH


for HOST in "${RDS_LIST[@]}"; do
  do_dash; echo "Priority areas tables"
  TABLE=priority_areas
  mkdir -p $FOLDER_PATH/$HOST
  FILE=$FOLDER_PATH/$HOST/$TABLE.csv
  echo $HOST
  echo ${PROJECT_IDS[IDX]}
  psql "host=$HOST.$ENDPOINT dbname=$DB user=$DB_USER password=$DB_PASSWORD" -c \
  	"\copy (SELECT * FROM $TABLE WHERE id in
  		(SELECT priority_area_id from project_priority_areas where project_id in ${PROJECT_IDS[IDX]}))
  		to '$FILE' DELIMITER ',' CSV HEADER"

  ###############################################################################################

  do_dash; echo "Projects table"
  TABLE=projects
  mkdir -p $FOLDER_PATH/$HOST
  FILE=$FOLDER_PATH/$HOST/$TABLE.csv
  psql "host=$HOST.$ENDPOINT dbname=$DB user=$DB_USER password=$DB_PASSWORD" -c \
  	"\copy (SELECT * FROM $TABLE WHERE id in ${PROJECT_IDS[IDX]}) to '$FILE' DELIMITER ',' CSV HEADER"

  ###############################################################################################

  do_dash; echo "Project allowed users"
  TABLE=project_allowed_users
  mkdir -p $FOLDER_PATH/$HOST
  FILE=$FOLDER_PATH/$HOST/$TABLE.csv
  psql "host=$HOST.$ENDPOINT dbname=$DB user=$DB_USER password=$DB_PASSWORD" -c \
  	"\copy (SELECT * FROM $TABLE WHERE project_id in ${PROJECT_IDS[IDX]}) to '$FILE' DELIMITER ',' CSV HEADER"

  ###############################################################################################

  do_dash; echo "Tasks table"
  TABLE=tasks
  mkdir -p $FOLDER_PATH/$HOST
  FILE=$FOLDER_PATH/$HOST/$TABLE.csv
  psql "host=$HOST.$ENDPOINT dbname=$DB user=$DB_USER password=$DB_PASSWORD" -c \
  	"\copy (SELECT * FROM $TABLE WHERE project_id in ${PROJECT_IDS[IDX]}) to '$FILE' DELIMITER ',' CSV HEADER"

  ###############################################################################################

  do_dash; echo "Task history"
  TABLE=task_history
  mkdir -p $FOLDER_PATH/$HOST
  FILE=$FOLDER_PATH/$HOST/$TABLE.csv
  psql "host=$HOST.$ENDPOINT dbname=$DB user=$DB_USER password=$DB_PASSWORD" -c \
  	"\copy (SELECT * FROM $TABLE WHERE project_id in ${PROJECT_IDS[IDX]}) to '$FILE' DELIMITER ',' CSV HEADER"

  ###############################################################################################

  do_dash; echo "Task invalidation history"
  TABLE=task_invalidation_history
  mkdir -p $FOLDER_PATH/$HOST
  FILE=$FOLDER_PATH/$HOST/$TABLE.csv
  psql "host=$HOST.$ENDPOINT dbname=$DB user=$DB_USER password=$DB_PASSWORD" -c \
  	"\copy (SELECT * FROM $TABLE WHERE project_id in ${PROJECT_IDS[IDX]}) to '$FILE' DELIMITER ',' CSV HEADER"

  ###############################################################################################

  do_dash; echo "Project priority areas"
  TABLE=project_priority_areas
  mkdir -p $FOLDER_PATH/$HOST
  FILE=$FOLDER_PATH/$HOST/$TABLE.csv
  psql "host=$HOST.$ENDPOINT dbname=$DB user=$DB_USER password=$DB_PASSWORD" -c \
  	"\copy (SELECT * FROM $TABLE WHERE project_id in ${PROJECT_IDS[IDX]}) to '$FILE' DELIMITER ',' CSV HEADER"

  ###############################################################################################

  do_dash; echo "Project chat"
  TABLE=project_chat
  mkdir -p $FOLDER_PATH/$HOST
  FILE=$FOLDER_PATH/$HOST/$TABLE.csv
  psql "host=$HOST.$ENDPOINT dbname=$DB user=$DB_USER password=$DB_PASSWORD" -c \
  	"\copy (SELECT * FROM $TABLE WHERE project_id in ${PROJECT_IDS[IDX]}) to '$FILE' DELIMITER ',' CSV HEADER"

  ###############################################################################################

  do_dash; echo "Project info"
  TABLE=project_info
  mkdir -p $FOLDER_PATH/$HOST
  FILE=$FOLDER_PATH/$HOST/$TABLE.csv
  psql "host=$HOST.$ENDPOINT dbname=$DB user=$DB_USER password=$DB_PASSWORD" -c \
  	"\copy (SELECT * FROM $TABLE WHERE project_id in ${PROJECT_IDS[IDX]}) to '$FILE' DELIMITER ',' CSV HEADER"

  ###############################################################################################

  do_dash; echo "Messages"
  TABLE=messages
  mkdir -p $FOLDER_PATH/$HOST
  FILE=$FOLDER_PATH/$HOST/$TABLE.csv
  psql "host=$HOST.$ENDPOINT dbname=$DB user=$DB_USER password=$DB_PASSWORD" -c \
  	"\copy (SELECT * FROM $TABLE WHERE project_id in ${PROJECT_IDS[IDX]}) to '$FILE' DELIMITER ',' CSV HEADER"

  ((IDX++))
done



###############################################################################################
# TABLE=users
# do_dash; echo "users from tables"
# psql "host=$HOST dbname=$DB user=$DB_USER password=$DB_PASSWORD" -c \
# 	"copy(SELECT * FROM $TABLE WHERE id in
# 		(select author_id from projects where id in $PROJECT_IDS)
# 		OR id in (select users.id from users,project_allowed_users where users.id=project_allowed_users.user_id AND project_allowed_users.project_id in $PROJECT_IDS)
# 		OR id in (select users.id from users,task_history where users.id=task_history.user_id AND task_history.project_id in $PROJECT_IDS)
# 		OR id in (select users.id from users,tasks where users.id in (tasks.locked_by, tasks.validated_by, tasks.mapped_by) AND tasks.project_id in $PROJECT_IDS))
# 		to '$FILE' DELIMITER ',' CSV HEADER"

# if $SAVE; then
# 	save_to_db
# fi


# ###############################################################################################

# do_dash; echo "licenses from tables"
# TABLE=licenses
# psql "host=$HOST dbname=$DB user=$DB_USER password=$DB_PASSWORD" -c \
# 	"copy(SELECT * FROM $TABLE WHERE id in (select license_id from projects where id in $PROJECT_IDS)) to '$FILE' DELIMITER ',' CSV HEADER"

# if $SAVE; then
# 	save_to_db
# fi

###############################################################################################
