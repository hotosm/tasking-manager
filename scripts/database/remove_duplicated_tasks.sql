with
  t1 AS (select project_id, x, y, zoom, ARRAY_AGG(CONCAT(id,';', task_status)) AS ids from tasks group by project_id, x, y, zoom),
  t2 AS (select project_id, x, y, ids, zoom, array_length(ids, 1) AS cnt from t1 where array_length(ids, 1) > 1  AND x is not null
    order by cnt desc),
  t3 AS (select project_id, x, y, zoom, unnest(ids) as task_id from t2),
  t4 AS (select project_id, x, y, zoom, split_part(task_id, ';', 1) AS task_id, split_part(task_id, ';', 2) AS task_status from t3),
  t5 AS (select *,
    CASE task_status
      WHEN '0' THEN 1
      WHEN '1' THEN 2
      WHEN '3' THEN 2
      WHEN '2' THEN 3
      WHEN '6' THEN 3
      WHEN '4' THEN 4
      WHEN '5' THEN 4
      ELSE -1 END AS PRIORITY
    from t4),
  t6 AS (Select DISTINCT ON (t5.project_id, t5.x, t5.y, t5.zoom) t5.project_id, t5.x, t5.y, t5.zoom, t5.task_id, t5.priority
  from t5 ORDER BY t5.project_id, t5.x, t5.y, t5.zoom, t5.priority desc)
Select t5.task_id::int AS id, t5.project_id, t5.x, t5.y, t5.zoom INTO temp_table
  from t5, t6 where t5.project_id=t6.project_id AND t5.x=t6.x AND t5.y=t6.y AND t5.zoom=t6.zoom AND t5.task_id!=t6.task_id;

DELETE FROM task_invalidation_history AS th USING temp_table AS tt where th.project_id=tt.project_id AND th.task_id=tt.id;
DELETE FROM task_history AS th USING temp_table AS tt where th.project_id=tt.project_id AND th.task_id=tt.id;
DELETE FROM task_annotations AS ta USING temp_table AS tt where ta.project_id=tt.project_id AND ta.task_id=tt.id;
DELETE FROM messages AS ms USING temp_table AS tt where ms.project_id=tt.project_id AND ms.task_id=tt.id;
DELETE FROM tasks AS ts USING temp_table AS tt where ts.x=tt.x AND ts.y=tt.y AND ts.project_id=tt.project_id AND ts.id=tt.id;

DROP TABLE temp_table;
