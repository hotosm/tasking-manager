-- Filter out projects with duplicate priorities
-- Stores results in a temporary table `priority_duplicates`
-- X (lng), Y (lat)
DROP TABLE IF EXISTS priority_duplicates;
SELECT
	project_id, priority_area_id, geometry, count(*)
	INTO TEMPORARY TABLE
    priority_duplicates
	FROM project_priority_areas, priority_areas
	WHERE priority_areas.id = project_priority_areas.priority_area_id
	GROUP BY project_id, priority_area_id, geometry
	HAVING count(*) > 1
	ORDER BY project_id DESC;




-- Function to iterate over duplicate priority areas and delete table entries
-- Affected tables:
--    priority_areas, project_priority_areas
CREATE OR REPLACE FUNCTION delete_duplicate_priority_geom()
   RETURNS SETOF text AS
$func$
DECLARE
  proj int;
  priority int;
	bounds geometry;
BEGIN
  FOR proj, priority, bounds IN
	 SELECT project_id, priority_area_id, geometry FROM priority_duplicates
  LOOP
   DELETE  FROM public.project_priority_areas WHERE priority_area_id = priority AND project_id = proj;
   DELETE  FROM public.priority_areas WHERE id = priority ;
   INSERT INTO public.priority_areas (id, geometry) VALUES (priority, bounds);
   INSERT INTO public.project_priority_areas (project_id, priority_area_id) VALUES (proj, priority);
   RETURN NEXT proj;
  END LOOP;
END
 $func$  LANGUAGE plpgsql;

SELECT * FROM delete_duplicate_priority_geom();
