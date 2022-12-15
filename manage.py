import os
import warnings
import base64
import csv
import datetime
from flask.cli import FlaskGroup, click
from flask_migrate import Migrate
from dotenv import load_dotenv
from sqlalchemy import func
import atexit
from apscheduler.schedulers.background import BackgroundScheduler

from backend import create_app, initialise_counters, db
from backend.services.users.authentication_service import AuthenticationService
from backend.services.users.user_service import UserService
from backend.services.stats_service import StatsService
from backend.services.interests_service import InterestService
from backend.models.postgis.utils import NotFound
from backend.models.postgis.task import Task, TaskHistory


# Load configuration from file into environment
load_dotenv(os.path.join(os.path.dirname(__file__), "tasking-manager.env"))

# Check that required environmental variables are set
for key in [
    "TM_APP_BASE_URL",
    "POSTGRES_DB",
    "POSTGRES_USER",
    "POSTGRES_PASSWORD",
    "TM_SECRET",
    "TM_CLIENT_ID",
    "TM_CLIENT_SECRET",
    "TM_DEFAULT_CHANGESET_COMMENT",
]:
    if not os.getenv(key):
        warnings.warn("%s environmental variable not set." % (key,))

# Initialise the flask app object
app = create_app()

cli = FlaskGroup(create_app=create_app)
# Initialize homepage counters
try:
    initialise_counters(app)
except Exception:
    warnings.warn("Homepage counters not initialized.")

migrate = Migrate(app, db)


@app.shell_context_processor
def make_shell_context():
    return dict(app=app, db=db)


# Job runs once every 2 hours
@cli.command("auto-unlock")
def auto_unlock_tasks():
    with app.app_context():
        # Identify distinct project IDs that were touched in the last 2 hours
        query = (
            TaskHistory.query.with_entities(TaskHistory.project_id)
            .filter(
                func.DATE(TaskHistory.action_date)
                > datetime.datetime.utcnow() - datetime.timedelta(minutes=130)
            )
            .distinct()
        )
        projects = query.all()
        # For each project update task history for tasks that were not manually unlocked
        for project in projects:
            project_id = project[0]
            Task.auto_unlock_tasks(project_id)


# Setup a background cron job
cron = BackgroundScheduler(daemon=True, timezone=app.config["TIMEZONE"])
# Initiate the background thread
cron.add_job(auto_unlock_tasks, trigger="interval", hours=2)
cron.start()
app.logger.debug("Initiated background thread to auto unlock tasks")

# Shutdown your cron thread when the app is stopped
atexit.register(lambda: cron.shutdown(wait=False))


@cli.command("gen_token")
@click.option("-u", "--user_id", help="user_id to generate token for")
def gen_token(user_id):
    """Helper method for generating valid base64 encoded session tokens"""
    token = AuthenticationService.generate_session_token_for_user(user_id)
    print(f"Raw token is: {token}")
    b64_token = base64.b64encode(token.encode())
    print(f"Your base64 encoded session token: {b64_token}")


@cli.command("refresh_levels")
def refresh_levels():
    print("Started updating mapper levels...")
    users_updated = UserService.refresh_mapper_level()
    print(f"Updated {users_updated} user mapper levels")


@cli.command("refresh_project_stats")
def refresh_project_stats():
    print("Started updating project stats...")
    StatsService.update_all_project_stats()
    print("Project stats updated")


@cli.command("update_project_categories")
@click.option("-f", "--filename")
def update_project_categories(filename):
    with open(filename, "r", encoding="ISO-8859-1", newline="") as csvfile:
        reader = csv.DictReader(csvfile)
        for row in reader:
            project_id = int(row.get("projectId"))
            primary_category = row.get("primaryCat")
            interest_ids = []
            # Map only primary_category interest to projects
            if primary_category:
                try:
                    interest = InterestService.get_by_name(primary_category)
                except NotFound:
                    interest = InterestService.create(primary_category)
                interest_ids.append(interest.id)

            try:
                InterestService.create_or_update_project_interests(
                    project_id, interest_ids
                )
            except Exception as e:
                print(f"Problem updating {project_id}: {type(e)}")


if __name__ == "__main__":
    cli()
