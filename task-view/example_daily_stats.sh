#!/bin/bash
# example script last day and uploads them to the task edit stats table

NOW=$(date +"%m_%d_%Y")
FILENAME=/tmp/task_edit_stats_$NOW.csv
echo ":::Computing task edit stats for $NOW:::"

sh /home/andrewwong1/task-view/task-view/bin/activate
NORTHSTAR_DB_PASSWORD=XXX FLASK_ENV=production python /home/andrewwong1/task-view/xml-info.py --num-days 1 --stats --fileout $FILENAME
bash /home/andrewwong1/task-view/upload_task_edit_stats.sh $FILENAME

rm $FILENAME
