-- SQL queries for migrating data from TM2 table structure to TM3 table structure
-- Assumes:
--   TM2 tables are in schema "hotold" 
--   TM3 tables are in schema "hotnew"
--  scripts must be run by a db role which has access to update tables and sequences in both schemas.

-- USERS Initial Load
-- make sure new tables emptied of any test data first
truncate hotnew.users cascade;
-- truncate hotnew.areas_of_interest cascade;

-- Populate users with ids and default stats - sets users to beginner mapper level
insert into hotnew.users (id,username,role,mapping_level, tasks_mapped, tasks_validated, tasks_invalidated, is_email_verified)
(select id,username,
	case when role is null then 0 else role end,
	1,0,0,0, FALSE
	 from hotold.users);
	 
-- update sequence  (commented out as not needed. ID comes from OSM not from the sequence.)
-- select setval('hotnew.users_id_seq',(select max(id) from hotnew.users));

-- LICENCES
INSERT INTO hotnew.licenses(
            id, name, description, plain_text)
    (SELECT id, name, description, plain_text
	from hotold.licenses);
	
-- update sequence
select setval('hotnew.licenses_id_seq',(select max(id) from hotnew.licenses));

-- USERS_LICENSES
INSERT INTO hotnew.users_licenses ("user", license)
     (select "user", license
     from hotold.users_licenses);


-- AREAS OF INTEREST

--populate areas of interest with details from old
--insert into hotnew.areas_of_interest (id, geometry, centroid)
--  (select id, geometry, centroid from hotold.areas);
 
--select setval('hotnew.areas_of_interest_id_seq',(select max(id) from hotnew.areas_of_interest));

-- PROJECTS
-- Transfer project data, all projects set to mapper level beginner
-- TODO:   tasks_bad_imagery
-- Skipped projects with null author_id
INSERT INTO hotnew.projects(
            id, status, aoi_id, created, priority, default_locale, author_id, 
            mapper_level, enforce_mapper_level, enforce_validator_role, private, 
            entities_to_map, changeset_comment, due_date, imagery, josm_preset, 
            last_updated, mapping_types, organisation_tag, campaign_tag, 
            total_tasks, tasks_mapped, tasks_validated, tasks_bad_imagery)
  (select id, status, area_id, created, priority, 'en', author_id, 
            0, false, false, private, 
            entities_to_map, changeset_comment, due_date, imagery, josm_preset, 
            last_update, null, '', '', 
            1, 0, 0, 0
            from hotold.project
            where author_id is not null
            );

select setval('hotnew.projects_id_seq',(select max(id) from hotnew.projects));


-- Insert AOI and Geom into projects
Update hotnew.projects
   set geometry = a.geometry,
       centroid = a.centroid
  from hotold.areas as a
where  a.id = hotnew.projects.aoi_id





-- Project info & translations
-- Skip any records relating to projects that have not been imported
INSERT INTO hotnew.project_info(
            project_id, locale, name, short_description, description, instructions)
    (select id, locale, name, short_description, description, instructions
    from hotold.project_translation pt
    where exists(select p.id from hotnew.projects p where p.id = pt.id));

-- Delete empty languages
delete from project_info where name = '' and short_description = '' and description = '' and instructions = '';

-- Create trigger for text search
CREATE TRIGGER tsvectorupdate BEFORE INSERT OR UPDATE
ON project_info FOR EACH ROW EXECUTE PROCEDURE
tsvector_update_trigger(text_searchable, 'pg_catalog.english', project_id_str, short_description, description);

-- set project-id which will update text search index
update project_info set project_id_str = project_id::text;

CREATE INDEX textsearch_idx ON project_info USING GIN (text_searchable);

-- TASKS
-- Get all tasks that don't have a state of -1 (removed) and where they relate to a project that has been migrated above
-- default any null x, y values to -1
-- default any null zoom levels to 13
INSERT INTO hotnew.tasks(
            id, project_id, x, y, zoom, geometry, task_status)
    (SELECT t.id, t.project_id, 
	t.x, 
    t.y, 
    t.zoom, 
    t.geometry,
	0
    from hotold.task t
    where not exists(select id from hotold.task_state ts where ts.task_id = t.id and ts.project_id = t.project_id and ts.state = -1)
    and exists(select id from hotnew.projects p where p.id = t.project_id) );

-- Update tasks with "Done" task_status and mapped_by info
update hotnew.tasks nt
	set task_status = 2,
	mapped_by = val.user_id
    from 
		(select * from hotold.task_state where state = 2) as val
	where val.task_id = nt.id
	and val.project_id = nt.project_id;

-- Update tasks with validated task_status and validated_by info from old task_state tables
--  Note, old task_status validated = 3;  new task status validated = 4
update hotnew.tasks nt
	set task_status = 4,
	validated_by = val.user_id
    from 
		(select * from hotold.task_state where state = 3) as val
	where val.task_id = nt.id
	and val.project_id = nt.project_id;

-- Update PROJECT with task stats.  Don't have info on bad-imagery
update hotnew.projects p
  set total_tasks = (select count(id) from hotnew.tasks t where t.project_id = p.id),
  tasks_mapped = (select count(id) from hotnew.tasks t where t.project_id = p.id and task_status in (2,4)),
  tasks_validated = (select count(id) from hotnew.tasks t where t.project_id = p.id and task_status = 4);

  
-- TASK HISTORY
--  State Changes
--   only insert state changes where user_id exists, and only for tasks that have been migrated	
INSERT INTO hotnew.task_history(
            project_id, task_id, action, action_text, action_date, user_id)
    (SELECT project_id, task_id, 'STATE_CHANGE', 
	CASE state 
		when 0 then 'READY'
		when 1 then 'INVALIDATED'
		when 2 then 'MAPPED'
		when 3 then 'VALIDATED'
	end,
	date, 
	user_id
	from hotold.task_state ts
	where user_id is not null
	and exists(select id from hotnew.tasks t where t.project_id = ts.project_id and t.id = ts.task_id ));

--  Locking
--   assuming all the lock events in the old system are locked_for_mapping events not for validation
--   not attempting to calculate the length of time task locked
--   only insert lock events where user_id exists, and only for tasks that have been migrated	
INSERT INTO hotnew.task_history(
            project_id, task_id, action, action_text, action_date, user_id)
    (SELECT project_id, task_id, 'LOCKED_FOR_MAPPING', 
	'',
	date, 
	user_id
	from hotold.task_lock ts
	where user_id is not null
	and lock = true
	and exists(select id from hotnew.tasks t where t.project_id = ts.project_id and t.id = ts.task_id ));

--  Comments
--   only insert comments where author_id exists, and only for tasks that have been migrated	
INSERT INTO hotnew.task_history(
            project_id, task_id, action, action_text, action_date, user_id)
    (SELECT project_id, task_id, 'COMMENT', 
	comment,
	date, 
	author_id
	from hotold.task_comment tc
	where author_id is not null
	and exists(select id from hotnew.tasks t where t.project_id = tc.project_id and t.id = tc.task_id ));

	
-- Update USER STATISTICS
-- User Task stats
with 
   m as
     (select user_id, count(id) as mapped
	from hotnew.task_history
	where action = 'STATE_CHANGE' 
	and action_text = 'MAPPED'
	group by user_id), 
   v as 
     (select user_id, count(id) as validated
	from hotnew.task_history
	where action = 'STATE_CHANGE'
	and action_text = 'VALIDATED'
	group by user_id),
   i as
     (select user_id, count(id) as invalidated
	from hotnew.task_history
	where action = 'STATE_CHANGE'
	and action_text = 'INVALIDATED'
	group by user_id)
update hotnew.users us
   set tasks_mapped = coalesce(m.mapped,0),
   tasks_validated = coalesce(v.validated,0), 
   tasks_invalidated = coalesce(i.invalidated,0)
from hotnew.users u
  left join m on m.user_id = u.id
  left join v on v.user_id = u.id
  left join i on i.user_id = u.id
 where us.id = u.id;

-- User Project List 
with p as
  (select user_id, array_agg(distinct project_id) as projects
	from hotnew.task_history
	where action = 'STATE_CHANGE'
	group by user_id)
update hotnew.users u
  set projects_mapped = p.projects
from p
where u.id = p.user_id;	


-- MESSAGES
-- only migrating messages that have not yet been read
INSERT INTO hotnew.messages(
            message, subject, from_user_id, to_user_id, date, read)
    (select message, subject,  from_user_id, to_user_id, date, read
     from hotold.message
     where read = false);

	 
-- PRIORITY_AREAS
--  migrate all areas
INSERT INTO hotnew.priority_areas(
            id, geometry)
    (SELECT id, geometry
    from hotold.priority_area);

-- Update sequence
select setval('hotnew.priority_areas_id_seq',(select max(id) from hotnew.priority_areas));

-- Migrate project_priority areas link but only where a matching project exists.  
-- Remove duplicate records
INSERT INTO hotnew.project_priority_areas(
            project_id, priority_area_id)
    (SELECT distinct pa.project_id, pa.priority_area_id
    from hotold.project_priority_areas pa
    where exists(select null from hotnew.projects p where p.id = pa.project_id) );

-- PROJECT ALLOWED USERS
-- Remove duplicate records
INSERT INTO hotnew.project_allowed_users(
            project_id, user_id)
    (select distinct project_id, user_id
    from hotold.project_allowed_users);


--------------------------------------------------	
--  Migration Results 28/04/2017
--
--  Projects:  Old = 2500   New = 2426      (97%)
--  Users   :  Old = 65323  New = 65323    (100%)
--  Tasks   :  Old = 814106 New = 750281    (92%)
--  Areas   :  Old = 2500   New = 2500     (100%)
--  Licences:  Old = 6      New = 6        (100%)
--------------------------------------------------


