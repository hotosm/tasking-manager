-- Create pg_cron extension if not already installed
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Create the function that will update project stats
CREATE OR REPLACE FUNCTION update_project_stats()
RETURNS void AS $$
DECLARE
    project RECORD;
BEGIN
    UPDATE users SET projects_mapped = NULL;

    FOR project IN
        SELECT id FROM projects WHERE last_updated < NOW() - INTERVAL '1 week' LOOP
        UPDATE projects SET
            total_tasks = (SELECT COUNT(*) FROM tasks WHERE project_id = project.id),
            tasks_mapped = (SELECT COUNT(*) FROM tasks WHERE project_id = project.id AND task_status = 2),
            tasks_validated = (SELECT COUNT(*) FROM tasks WHERE project_id = project.id AND task_status = 4),
            tasks_bad_imagery = (SELECT COUNT(*) FROM tasks WHERE project_id = project.id AND task_status = 6);

        UPDATE users
        SET projects_mapped = array_append(projects_mapped, project.id)
        WHERE id IN (
            SELECT DISTINCT user_id
            FROM task_history
            WHERE action = 'STATE_CHANGE' AND project_id = project.id
        );
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Schedule the cron job to run every 2 hours
SELECT cron.schedule('update_project_stats', '0 */2 * * *', 'SELECT update_project_stats();');
