import asyncio
import atexit
import datetime

from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.interval import IntervalTrigger

from backend.db import db_connection
from backend.models.postgis.task import Task


async def auto_unlock_tasks():
    async with db_connection.database.connection() as conn:
        # Identify distinct project IDs that were touched in the last 2 hours
        two_hours_ago = datetime.datetime.utcnow() - datetime.timedelta(minutes=120)
        # Query to fetch distinct project IDs with recent task history
        projects_query = """
        SELECT DISTINCT project_id
        FROM task_history
        WHERE action_date > :two_hours_ago
        """
        projects = await conn.fetch_all(
            query=projects_query, values={"two_hours_ago": two_hours_ago}
        )
        # For each project, update task history for tasks that were not manually unlocked
        for project in projects:
            project_id = project["project_id"]
            await Task.auto_unlock_tasks(project_id, conn)


# Setup scheduler with asyncio support
def setup_cron_jobs():
    scheduler = AsyncIOScheduler()

    # Add the job to run every minute
    scheduler.add_job(
        auto_unlock_tasks,
        IntervalTrigger(minutes=120),
        id="auto_unlock_tasks",
        replace_existing=True,
    )

    # Start the scheduler
    scheduler.start()
    print("Scheduler initialized: auto_unlock_tasks runs every 2 hours.")

    # Ensure scheduler stops gracefully on app shutdown
    atexit.register(lambda: asyncio.run(scheduler.shutdown(wait=False)))
