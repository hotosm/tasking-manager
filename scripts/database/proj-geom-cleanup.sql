-- Filter out projects with out of bound geometries
-- Stores results in a temporary table `project_list`
-- X (lng), Y (lat)
SELECT
    projects.id
INTO TEMPORARY TABLE
    invalid_geom
FROM
     projects
WHERE
    ST_XMin(geometry) < -180
    or ST_XMax(geometry) > 180
    or ST_YMin(geometry) < -90
    or ST_YMax(geometry) > 90;

-- Filter out projects with low mappig rates
-- Stores results in a temporary table `stale_projects`
-- Last updated in 2016 and < 10% mapped tasks
SELECT
   projects.id
INTO TEMPORARY TABLE
   stale_projects
FROM
   projects
WHERE
   extract(year FROM last_updated) < 2017
   AND tasks_mapped/total_tasks < 0.1;


-- Function to iterate over invalid_geoms and delete table entries
-- Affected tables:
--    project_info, project_chat
--    task_history, task_invalidation_history, tasks
CREATE OR REPLACE FUNCTION delete_invalid_geom()
  RETURNS SETOF text AS
$func$
DECLARE
   proj int;
BEGIN
   FOR proj IN
      SELECT * FROM invalid_geom
   LOOP
      DELETE FROM public.project_info WHERE project_id = proj;
      DELETE FROM public.project_chat WHERE project_id = proj;
      DELETE FROM public.task_history WHERE project_id = proj;
      DELETE FROM public.project_priority_areas WHERE project_id = proj;
      DELETE FROM public.messages WHERE project_id = proj;
      DELETE FROM public.task_invalidation_history WHERE project_id = proj;
      DELETE FROM public.tasks WHERE project_id = proj;
      DELETE FROM public.projects WHERE id = proj;
      RETURN NEXT proj;
      -- RAISE NOTICE 'Project: %', proj;
   END LOOP;
END
$func$  LANGUAGE plpgsql;

SELECT * from delete_invalid_geom();


CREATE OR REPLACE FUNCTION garden_stale_projects()
  RETURNS SETOF text AS
$func$
DECLARE
   proj int;
BEGIN
   FOR proj IN
      SELECT * FROM stale_projects
   LOOP
      UPDATE projects SET STATUS = 0 WHERE id = proj;
      RETURN NEXT proj;
      -- RAISE NOTICE 'Project: %', proj;
   END LOOP;
END
$func$  LANGUAGE plpgsql;

SELECT * from garden_stale_projects();
