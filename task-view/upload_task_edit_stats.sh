#!/bin/bash
CSV_FILE=`readlink -f $1`

echo "UPLOADING TASK EDIT STATS from $CSV_FILE"
psql -U postgres osmtm -t  << SQL
  CREATE TEMP TABLE temp_task_edit_stats (
      task_id integer,
      project_id integer,
      data json
  );

  COPY temp_task_edit_stats from '$CSV_FILE' CSV HEADER;

  INSERT INTO task_edit_stats (task_id, project_id, data)
  SELECT * from temp_task_edit_stats
  ON CONFLICT (project_id, task_id)
  DO
   UPDATE
     SET data = EXCLUDED.data;
SQL
echo 'UPLOAD FINISHED'
