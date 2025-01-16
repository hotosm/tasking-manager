import datetime

from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.cron import CronTrigger
from apscheduler.triggers.interval import IntervalTrigger
from loguru import logger

from backend.db import db_connection
from backend.models.postgis.task import Task


async def auto_unlock_tasks():
    async with db_connection.database.connection() as conn:
        # Identify distinct project IDs that were touched in the last 2 hours
        two_hours_ago = datetime.datetime.utcnow() - datetime.timedelta(minutes=120)
        projects_query = """
        SELECT DISTINCT project_id
        FROM task_history
        WHERE action_date > :two_hours_ago
        """
        projects = await conn.fetch_all(
            query=projects_query, values={"two_hours_ago": two_hours_ago}
        )
        for project in projects:
            project_id = project["project_id"]
            logger.info(f"Processing project_id: {project_id}")
            await Task.auto_unlock_tasks(project_id, conn)


async def update_all_project_stats():
    """
    Async function to update project statistics in the database.
    """
    async with db_connection.database.connection() as conn:
        logger.info("Started updating project stats.")
        await conn.execute("UPDATE users SET projects_mapped = NULL;")
        projects_query = "SELECT DISTINCT id FROM projects;"
        projects = await conn.fetch_all(query=projects_query)
        for project in projects:
            project_id = project["id"]
            logger.info(f"Processing project ID: {project_id}")

            # Update project statistics
            await conn.execute(
                """
                UPDATE projects
                SET total_tasks = (SELECT COUNT(*) FROM tasks WHERE project_id = :project_id),
                    tasks_mapped = (SELECT COUNT(*) FROM tasks WHERE project_id = :project_id AND task_status = 2),
                    tasks_validated = (SELECT COUNT(*) FROM tasks WHERE project_id = :project_id AND task_status = 4),
                    tasks_bad_imagery = (SELECT COUNT(*) FROM tasks WHERE project_id = :project_id AND task_status = 6)
                WHERE id = :project_id;
            """,
                {"project_id": project_id},
            )

            # Update user stats
            await conn.execute(
                """
                UPDATE users
                SET projects_mapped = array_append(projects_mapped, :project_id)
                WHERE id IN (
                    SELECT DISTINCT user_id
                    FROM task_history
                    WHERE action = 'STATE_CHANGE' AND project_id = :project_id
                );
            """,
                {"project_id": project_id},
            )

        logger.info("Finished updating project stats.")


async def update_recent_updated_project_stats():
    """
    Async function to update project statistics for the recently updated projects in the database.
    """
    async with db_connection.database.connection() as conn:
        logger.info("Started updating recently updated projects' project stats.")

        # Calculate the cutoff date for the past week
        one_week_ago = datetime.datetime.utcnow() - datetime.timedelta(days=7)

        # Fetch projects updated in the past week
        projects_query = """
        SELECT DISTINCT id
        FROM projects
        WHERE last_updated > :one_week_ago;
        """
        projects = await conn.fetch_all(
            query=projects_query, values={"one_week_ago": one_week_ago}
        )
        for project in projects:
            project_id = project["id"]
            logger.info(f"Processing project ID: {project_id}")

            # Update project statistics
            await conn.execute(
                """
                UPDATE projects
                SET total_tasks = (SELECT COUNT(*) FROM tasks WHERE project_id = :project_id),
                    tasks_mapped = (SELECT COUNT(*) FROM tasks WHERE project_id = :project_id AND task_status = 2),
                    tasks_validated = (SELECT COUNT(*) FROM tasks WHERE project_id = :project_id AND task_status = 4),
                    tasks_bad_imagery = (SELECT COUNT(*) FROM tasks WHERE project_id = :project_id AND task_status = 6)
                WHERE id = :project_id;
            """,
                {"project_id": project_id},
            )

            # Update user stats
            await conn.execute(
                """
                UPDATE users
                SET projects_mapped =
                    CASE
                        WHEN :project_id = ANY(projects_mapped) THEN projects_mapped
                        ELSE array_append(projects_mapped, :project_id)
                    END
                WHERE id IN (
                    SELECT DISTINCT user_id
                    FROM task_history
                    WHERE action = 'STATE_CHANGE' AND project_id = :project_id
                );
            """,
                {"project_id": project_id},
            )

        logger.info("Finished updating project stats.")


def setup_cron_jobs():
    scheduler = AsyncIOScheduler()

    scheduler.add_job(
        auto_unlock_tasks,
        IntervalTrigger(minutes=120),
        id="auto_unlock_tasks",
        replace_existing=True,
    )

    scheduler.add_job(
        update_all_project_stats,
        CronTrigger(hour=0, minute=0),  # Cron trigger for 12:00 AM
        id="update_project_stats",
        replace_existing=True,
    )

    scheduler.add_job(
        update_recent_updated_project_stats,
        CronTrigger(minute=0),  # Cron trigger for every hour
        id="update_recent_updated_project_stats",
        replace_existing=True,
    )
    scheduler.start()
    logger.info("Scheduler initialized: auto_unlock_tasks runs every 2 hours.")
