import os
from locust import HttpUser, TaskSet, task, between

# Define tokens for Flask and FastAPI
FASTAPI_TOKEN = "TVRBeU5UQTBOVFkuWjJVOWNnLmtBNUZUcDZaMkpYVGJ2QnhFN29mb3lqZXZlSQ=="
FLASK_TOKEN = "TVRBeU5UQTBOVFkuWjJVeDV3LmtDTHhCbFdQR2ROZTEzYzJORWRVblp4akFCMA=="

LOCUST_HOST = os.getenv("LOCUST_HOST", "https://tm.naxa.com.np")


AUTH_TOKEN = FASTAPI_TOKEN if "tm-fastapi.naxa.com.np" in LOCUST_HOST else FLASK_TOKEN

class ProjectAndComments(TaskSet):
    @task
    def get_project(self):
        self.client.get("/api/v2/projects/114/")

    @task
    def get_comments(self):
        self.client.get("/api/v2/projects/114/comments/")

class ProjectList(TaskSet):
    @task
    def project_list(self):
        self.client.get("/api/v2/projects/?action=any&omitMapResults=true", headers={"Authorization": f"Token {AUTH_TOKEN}"})

class TaskStatistics(TaskSet):
    @task
    def get_contributions(self):
        self.client.get("/api/v2/tasks/statistics/?startDate=2024-01-01", headers={"Authorization": f"Token {AUTH_TOKEN}"})

class TaskPage(TaskSet):
    @task
    def get_tasks(self):
        self.client.get("/api/v2/projects/114/tasks/", headers={"Authorization": f"Token {AUTH_TOKEN}"})

class GetSimilarProjects(TaskSet):
    @task
    def get_similar_projects(self):
        self.client.get("/api/v2/projects/queries/114/similar-projects/")

class GetContributions(TaskSet):
    @task
    def get_contributions(self):
        self.client.get("/api/v2/projects/114/contributions/")

class GetContributionsByDay(TaskSet):
    @task
    def get_contributions_by_day(self):
        self.client.get("/api/v2/projects/114/contributions/queries/day/")

class GetStatistics(TaskSet):
    @task
    def get_statistics(self):
        self.client.get("/api/v2/system/statistics/")

class GetActionAny(TaskSet):
    @task
    def get_action_any(self):
        self.client.get("/api/v2/projects/?action=any")

# Mapping task names to classes
task_mapping = {
    "project_and_comments": ProjectAndComments,
    "project_list": ProjectList,
    "task_statistics": TaskStatistics,
    "task_page": TaskPage,
    "similar_projects": GetSimilarProjects,
    "contributions": GetContributions,
    "contributions_by_day": GetContributionsByDay,
    "statistics": GetStatistics,
    "action_any": GetActionAny,
}

# User class
class ApiBenchmarkUser(HttpUser):
    wait_time = between(1, 2)

    # Dynamically select tasks based on environment variable or CLI parameter
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        task_name = os.getenv("TASK_SET", "project_list").lower()
        self.tasks = [task_mapping.get(task_name, TaskPage)]


'''
/api/v2/projects/?action=any&omitMapResults=true
/api/v2/projects/114/
/api/v2/projects/114/comments/
/api/v2/projects/queries/114/similar-projects/
/api/v2/projects/114/contributions/
/api/v2/projects/114/contributions/queries/day/
/api/v2/system/statistics/
/api/v2/projects/?action=any
'''
