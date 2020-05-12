import os
import subprocess
import warnings
import base64
import json
import csv
import datetime

from flask_migrate import MigrateCommand
from flask_script import Manager
from dotenv import load_dotenv
from backend import create_app, initialise_counters
from backend.services.users.authentication_service import AuthenticationService
from backend.services.users.user_service import UserService
from backend.services.stats_service import StatsService
from backend.services.interests_service import InterestService
from backend.models.postgis.utils import NotFound
from backend.models.postgis.task import Task, TaskHistory

from sqlalchemy import func
import atexit
from apscheduler.schedulers.background import BackgroundScheduler


# Load configuration from file into environment
load_dotenv(os.path.join(os.path.dirname(__file__), "tasking-manager.env"))

# Check that required environmental variables are set
for key in [
    "TM_APP_BASE_URL",
    "POSTGRES_DB",
    "POSTGRES_USER",
    "POSTGRES_PASSWORD",
    "TM_SECRET",
    "TM_CONSUMER_KEY",
    "TM_CONSUMER_SECRET",
    "TM_DEFAULT_CHANGESET_COMMENT",
]:
    if not os.getenv(key):
        warnings.warn("%s environmental variable not set." % (key,))

# Initialise the flask app object
application = create_app()

# Initialize homepage counters
try:
    initialise_counters(application)
except Exception:
    warnings.warn("Homepage counters not initialized.")

# Add management commands
manager = Manager(application)

# Enable db migrations to be run via the command line
manager.add_command("db", MigrateCommand)


# Job runs once every 2 hours
@manager.command
def auto_unlock_tasks():
    with application.app_context():
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
cron = BackgroundScheduler(daemon=True)
# Initiate the background thread
cron.add_job(auto_unlock_tasks, "interval", hours=2)
cron.start()
application.logger.debug("Initiated background thread to auto unlock tasks")

# Shutdown your cron thread when the application is stopped
atexit.register(lambda: cron.shutdown(wait=False))


@manager.option("-u", "--user_id", help="Test User ID")
def gen_token(user_id):
    """ Helper method for generating valid base64 encoded session tokens """
    token = AuthenticationService.generate_session_token_for_user(user_id)
    print(f"Raw token is: {token}")
    b64_token = base64.b64encode(token.encode())
    print(f"Your base64 encoded session token: {b64_token}")


@manager.command
def refresh_levels():
    print("Started updating mapper levels...")
    users_updated = UserService.refresh_mapper_level()
    print(f"Updated {users_updated} user mapper levels")


@manager.command
def refresh_project_stats():
    print("Started updating project stats...")
    StatsService.update_all_project_stats()
    print("Project stats updated")


@manager.command
def build_locales():
    print("building locale strings...")
    print("running: npm build-locales")
    output = subprocess.Popen(
        "npm run build-locales", shell=True, cwd="./frontend", stdout=subprocess.PIPE
    ).stdout.read()
    print(output)
    lang_codes = [
        a.strip() for a in application.config["SUPPORTED_LANGUAGES"]["codes"].split(",")
    ]
    locale_path = "frontend/src/locales/"
    en_locale_path = f"{locale_path}en.json"

    en_locale = json.loads(open(en_locale_path, "r").read())

    for lang_code in lang_codes:

        # skip english
        if lang_codes == "en":
            continue

        current_locale_file = f"{locale_path}{lang_code}.json"

        if os.path.exists(current_locale_file):
            current_locale = json.loads(open(current_locale_file, "r").read())
        else:
            current_locale = {}

        for key in en_locale:
            current_locale[key] = current_locale.get(key, "")

        with open(current_locale_file, "w") as locale_file:
            locale_file.write(json.dumps(current_locale, indent=3))
            print(f"updated locale {lang_code} on file {current_locale_file}")


@manager.command
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
    manager.run()
