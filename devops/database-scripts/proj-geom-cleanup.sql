
SELECT
    projects.id
INTO TEMPORARY TABLE
    project_list
FROM 
     projects
WHERE ST_XMin(geometry) < -180
    or ST_XMax(geometry) > 180
    or ST_YMin(geometry) < -90
    or ST_YMax(geometry) > 90;


CREATE OR REPLACE FUNCTION delete_results()
  RETURNS SETOF text AS
$func$
DECLARE
   elem int;
BEGIN
   FOR elem IN
      SELECT * FROM project_list
   LOOP
      DELETE FROM public.project_info WHERE project_id = elem;
      DELETE FROM public.project_chat WHERE project_id = elem;
      DELETE FROM public.task_history WHERE project_id = elem;
      DELETE FROM public.task_invalidation_history WHERE project_id = elem;
      DELETE FROM public.tasks WHERE project_id = elem;
      RETURN NEXT elem;
      RAISE NOTICE 'Project: %', elem;
   END LOOP;
END
$func$  LANGUAGE plpgsql;

SELECT * from delete_results()
