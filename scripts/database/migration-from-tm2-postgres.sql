-- SQL queries for migrating data from TM2 table structure to TM3 table structure
-- This script copies from "tm2" to "taskingmanager". Continue reading to learn how to prepare for this.
--
-- We assume the original operational TM2 db is named "tasking-manager" and the user is "tm".
-- Also, we assume you have created the TM3 database by following the README or migration guide,
--   meaning you will have a database named "taskingmanager" already. Make sure you have run the alembic
--   database upgrades to load the schema of "taskingmanager". As a refresher, this is done in the base
--   TM3 directory via: flask db upgrade
-- If you run into errors, make sure your environmental variable is set for TM_DB.
--
-- Now to the migration...
-- To be extra cautious, we first backup the old TM2 database and load it into a temporary
--   "tm2" database that is used for the migration:
--
--  pg_dump -U tm -W tasking-manager > tm2.sql
--
-- Next we load this into our temporary "tm2" database:
--
--  psql -U tm -d tm2 -f tm2.sql
--
-- Now, you are able to run this script to copy and transform the data from the temporary "tm2"
--   to the new "taskingmanager" database.
--
-- You should now be done with the migration.

-- USERS Initial Load
-- make sure new tables emptied of any test data first
truncate taskingmanager.users cascade;
-- truncate taskingmanager.areas_of_interest cascade;

-- Populate users with ids and default stats - sets users to beginner mapper level
--   previous roles were 8: experienced mapper, 4: experienced validator, 2: project manager, 1: admin, 0: mapper
--   new roles are 4: experienced validator, 2: project manager, 1: admin, 0: mapper, -1: read only
insert into taskingmanager.users (id,username,role,mapping_level, tasks_mapped, tasks_validated, tasks_invalidated,
                          is_email_verified, date_registered, last_validation_date)
(select id,username,
	case
          when role is null then 0
          when role = 8 then 0
          when role = 4 then 4
          when role = 2 then 2
          when role = 1 then 1
          else 0
        end,
	1,0,0,0, FALSE, current_timestamp, current_timestamp
	 from tm2.users);

-- update sequence  (commented out as not needed. ID comes from OSM not from the sequence.)
-- select setval('taskingmanager.users_id_seq',(select max(id) from taskingmanager.users));

-- LICENCES
INSERT INTO taskingmanager.licenses(
            id, name, description, plain_text)
    (SELECT id, name, description, plain_text
	from tm2.licenses);

-- update sequence
select setval('taskingmanager.licenses_id_seq',(select max(id) from taskingmanager.licenses));

-- USERS_LICENSES
INSERT INTO taskingmanager.users_licenses ("user", license)
     (select "user", license
     from tm2.users_licenses);


-- AREAS OF INTEREST

--populate areas of interest with details from old
--insert into taskingmanager.areas_of_interest (id, geometry, centroid)
--  (select id, geometry, centroid from tm2.areas);

--select setval('taskingmanager.areas_of_interest_id_seq',(select max(id) from taskingmanager.areas_of_interest));

-- PROJECTS
-- Transfer project data, all projects set to mapper level beginner
-- Skipped projects with null author_id
INSERT INTO taskingmanager.projects(
            id, status, created, priority, default_locale, author_id,
            mapper_level, enforce_mapper_level, enforce_validator_role, private,
            entities_to_map, changeset_comment, due_date, imagery, josm_preset,
            last_updated, mapping_types, organisation_tag, campaign_tag,
            total_tasks, tasks_mapped, tasks_validated, tasks_bad_imagery, centroid, geometry)
  (select p.id, p.status, p.created, p.priority, 'en', p.author_id,
            1, false, false, p.private,
            p.entities_to_map, p.changeset_comment, p.due_date, p.imagery, p.josm_preset,
            p.last_update, null, '', '',
            1, 0, 0, 0, a.centroid, a.geometry
            from tm2.project p,
                 tm2.areas a
            where p.area_id = a.id
            and p.author_id is not null
            );

select setval('taskingmanager.projects_id_seq',(select max(id) from taskingmanager.projects));

-- Set the task_creation_mode to 'arbitrary' when project's zoom was None in
-- TM2 or 'grid' when it was not None
Update taskingmanager.projects
   set task_creation_mode = 1
   from tm2.projects as p
   where p.id = taskingmanager.projects.id and p.zoom is NULL;

Update taskingmanager.projects
   set task_creation_mode = 0
   from tm2.projects as p
   where p.id = taskingmanager.projects.id and p.zoom is not NULL;

-- Project info & translations
-- Skip any records relating to projects that have not been imported
INSERT INTO taskingmanager.project_info(
            project_id, locale, name, short_description, description, instructions)
    (select id, locale, name, short_description, description, instructions
    from tm2.project_translation pt
    where exists(select p.id from taskingmanager.projects p where p.id = pt.id));

-- Delete empty languages
delete from taskingmanager.project_info where name = '' and short_description = '' and description = '' and instructions = '';

-- Create trigger for text search
CREATE TRIGGER tsvectorupdate BEFORE INSERT OR UPDATE
ON taskingmanager.project_info FOR EACH ROW EXECUTE PROCEDURE
tsvector_update_trigger(text_searchable, 'pg_catalog.english', project_id_str, short_description, description);

-- set project-id which will update text search index
update taskingmanager.project_info set project_id_str = project_id::text;

CREATE INDEX textsearch_idx ON taskingmanager.project_info USING GIN (text_searchable);

-- TASKS
-- Get all tasks that don't have a state of -1 (removed) and where they relate to a project that has been migrated above
-- default any null x, y values to -1
-- default any null zoom levels to 13
INSERT INTO taskingmanager.tasks(
            id, project_id, x, y, zoom, geometry, task_status)
    (SELECT t.id, t.project_id,
	t.x,
    t.y,
    t.zoom,
    t.geometry,
	0
    from tm2.task t
    where not exists(select id from tm2.task_state ts where ts.task_id = t.id and ts.project_id = t.project_id and ts.state = -1)
    and exists(select id from taskingmanager.projects p where p.id = t.project_id) );

-- Copy across per-task-instructions
update taskingmanager.project_info p
   set per_task_instructions = old.per_task_instructions
  from (select id, locale, per_task_instructions from tm2.project_translation
         where  length(per_task_instructions) > 5) old
  where project_id = old.id
    and p.locale = old.locale;

-- Update tasks with "Done" task_status and mapped_by info
update taskingmanager.tasks nt
	set task_status = 2,
	mapped_by = val.user_id
    from
		(select * from tm2.task_state where state = 2) as val
	where val.task_id = nt.id
	and val.project_id = nt.project_id;

-- Update tasks with validated task_status and validated_by info from old task_state tables
--  Note, old task_status validated = 3;  new task status validated = 4
update taskingmanager.tasks nt
	set task_status = 4,
	validated_by = val.user_id
    from
		(select * from tm2.task_state where state = 3) as val
	where val.task_id = nt.id
	and val.project_id = nt.project_id;

-- Update PROJECT with task stats.  Don't have info on bad-imagery
update taskingmanager.projects p
  set total_tasks = (select count(id) from taskingmanager.tasks t where t.project_id = p.id);
--  tasks_mapped = (select count(id) from taskingmanager.tasks t where t.project_id = p.id and task_status in (2,4)),
--  tasks_validated = (select count(id) from taskingmanager.tasks t where t.project_id = p.id and task_status = 4);

-- update tasks mapped count
UPDATE taskingmanager.projects
SET tasks_mapped=subquery.count
FROM (
  select project_id, count(project_id)
  from taskingmanager.tasks
  where taskingmanager.tasks.task_status in (2, 4)
  group by tasks.project_id) AS subquery
WHERE taskingmanager.projects.id=subquery.project_id
;

UPDATE taskingmanager.projects
SET tasks_validated=subquery.count
FROM (
  select project_id, count(project_id)
  from taskingmanager.tasks
  where tasks.task_status = 4
  group by tasks.project_id) AS subquery
WHERE taskingmanager.projects.id=subquery.project_id
;


-- TASK HISTORY
--  State Changes
--   only insert state changes where user_id exists, and only for tasks that have been migrated
INSERT INTO taskingmanager.task_history(
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
	from tm2.task_state ts
	where user_id is not null
	and exists(select id from taskingmanager.tasks t where t.project_id = ts.project_id and t.id = ts.task_id ));

--  Locking
--   assuming all the lock events in the old system are locked_for_mapping events not for validation
--   not attempting to calculate the length of time task locked
--   only insert lock events where user_id exists, and only for tasks that have been migrated
INSERT INTO taskingmanager.task_history(
            project_id, task_id, action, action_text, action_date, user_id)
    (SELECT project_id, task_id, 'LOCKED_FOR_MAPPING',
	'',
	date,
	user_id
	from tm2.task_lock ts
	where user_id is not null
	and lock = true
	and exists(select id from taskingmanager.tasks t where t.project_id = ts.project_id and t.id = ts.task_id ));

--  Comments
--   only insert comments where author_id exists, and only for tasks that have been migrated
INSERT INTO taskingmanager.task_history(
            project_id, task_id, action, action_text, action_date, user_id)
    (SELECT project_id, task_id, 'COMMENT',
	comment,
	date,
	author_id
	from tm2.task_comment tc
	where author_id is not null
	and exists(select id from taskingmanager.tasks t where t.project_id = tc.project_id and t.id = tc.task_id ));


-- Update date registered based on first contribution in task_history, should cover 90% of users
update taskingmanager.users
   set date_registered = action_date
   from (select t.user_id, min(action_date) action_date
           from taskingmanager.users u,
                taskingmanager.task_history t
          where u.id = t.user_id
          group by user_id) old
 where id = old.user_id;


-- Update USER STATISTICS
-- User Task stats
with
   m as
     (select user_id, count(id) as mapped
	from taskingmanager.task_history
	where action = 'STATE_CHANGE'
	and action_text = 'MAPPED'
	group by user_id),
   v as
     (select user_id, count(id) as validated
	from taskingmanager.task_history
	where action = 'STATE_CHANGE'
	and action_text = 'VALIDATED'
	group by user_id),
   i as
     (select user_id, count(id) as invalidated
	from taskingmanager.task_history
	where action = 'STATE_CHANGE'
	and action_text = 'INVALIDATED'
	group by user_id)
update taskingmanager.users us
   set tasks_mapped = coalesce(m.mapped,0),
   tasks_validated = coalesce(v.validated,0),
   tasks_invalidated = coalesce(i.invalidated,0)
from taskingmanager.users u
  left join m on m.user_id = u.id
  left join v on v.user_id = u.id
  left join i on i.user_id = u.id
 where us.id = u.id;

-- User Project List
with p as
  (select user_id, array_agg(distinct project_id) as projects
	from taskingmanager.task_history
	where action = 'STATE_CHANGE'
	group by user_id)
update taskingmanager.users u
  set projects_mapped = p.projects
from p
where u.id = p.user_id;


-- MESSAGES
-- only migrating messages that have not yet been read
INSERT INTO taskingmanager.messages(
            message, subject, from_user_id, to_user_id, date, read)
    (select message, subject,  from_user_id, to_user_id, date, read
     from tm2.message
     where read = false);


-- PRIORITY_AREAS
--  migrate all areas
INSERT INTO taskingmanager.priority_areas(
            id, geometry)
    (SELECT id, geometry
    from tm2.priority_area);

-- Update sequence
select setval('taskingmanager.priority_areas_id_seq',(select max(id) from taskingmanager.priority_areas));

-- Migrate project_priority areas link but only where a matching project exists.
-- Remove duplicate records
INSERT INTO taskingmanager.project_priority_areas(
            project_id, priority_area_id)
    (SELECT distinct pa.project_id, pa.priority_area_id
    from tm2.project_priority_areas pa
    where exists(select null from taskingmanager.projects p where p.id = pa.project_id) );

-- PROJECT ALLOWED USERS
-- Remove duplicate records
INSERT INTO taskingmanager.project_allowed_users(
            project_id, user_id)
    (select distinct project_id, user_id
    from tm2.project_allowed_users);

-- TASK ISSQUARE FLAG
-- Ensure the is_sqaure flag is consistent with the x,y,zoom values
UPDATE taskingmanager.tasks SET is_square = (x IS NOT NULL AND y IS NOT NULL AND zoom IS NOT NULL);


--------------------------------------------------
--  Migration Results 28/04/2017
--
--  Projects:  Old = 2500   New = 2426      (97%)
--  Users   :  Old = 65323  New = 65323    (100%)
--  Tasks   :  Old = 814106 New = 750281    (92%)
--  Areas   :  Old = 2500   New = 2500     (100%)
--  Licences:  Old = 6      New = 6        (100%)
--------------------------------------------------
