# computes stats for the last day and uploads them to the task edit stats table

NOW=$(date +"%m_%d_%Y")
FILENAME=/tmp/task_edit_stats_$NOW.csv
echo ":::Computing task edit stats for $NOW:::"

FLASK_ENV=production python xml-info.py --num-days 1 --stats --fileout $FILENAME
bash upload_task_edit_stats.sh $FILENAME

rm $FILENAME
