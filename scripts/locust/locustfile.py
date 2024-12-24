import os
from locust import HttpUser, TaskSet, task, between

class ProjectAndComments(TaskSet):
    @task
    def get_project(self):
        self.client.get("/api/v2/projects/114/")

    @task
    def get_comments(self):
        self.client.get("/api/v2/projects/114/comments/")

class ProjectList(TaskSet):
    @task
    def get_project(self):
        self.client.get("/api/v2/projects/")

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
        task_name = os.getenv("TASK_SET", "get_contributions").lower()
        print(task_name, "The task name....")
        self.tasks = [task_mapping.get(task_name, GetContributions)]


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
