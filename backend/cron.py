import datetime

from apscheduler.schedulers.asyncio import AsyncIOScheduler
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


def setup_cron_jobs():
    scheduler = AsyncIOScheduler()
    scheduler.add_job(
        auto_unlock_tasks,
        IntervalTrigger(minutes=120),
        id="auto_unlock_tasks",
        replace_existing=True,
    )
    scheduler.start()
    logger.info("Scheduler initialized: auto_unlock_tasks runs every 2 hours.")
