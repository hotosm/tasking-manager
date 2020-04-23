-- Fetch all project IDs in a temporary table
SELECT
    projects.id
INTO TEMPORARY TABLE
    temp_projects_id
FROM
     projects;

 -- Function to iterate over project IDs and update table entries
 -- Affected tables:
 --    projects
 --    task_status = 2(MAPPED), 4(VALIDATED), 6(BADIMAGERY)
CREATE OR REPLACE FUNCTION update_task_stats()
  RETURNS SETOF text AS
$func$
DECLARE
   proj int;
BEGIN
   FOR proj IN
      SELECT * FROM temp_projects_id
   LOOP
      update projects set tasks_mapped = (select count(*) from tasks where project_id = proj and task_status = 2) where id = proj;
      update projects set tasks_validated = (select count(*) from tasks where project_id = proj and task_status = 4) where id = proj;
      update projects set tasks_bad_imagery = (select count(*) from tasks where project_id = proj and task_status = 6) where id = proj;
      RETURN NEXT proj;
      RAISE NOTICE 'Project: %', proj;
   END LOOP;
END
$func$  LANGUAGE plpgsql;

SELECT * from update_task_stats();
