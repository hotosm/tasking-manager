from locust import HttpUser, between, task

class Project(HttpUser):
    wait_time = between(1, 5)
    @task
    def index(self):
        self.client.get("/api/v2/projects/")

    # @task
    # def projects(self):
    #     # headers = {
    #     #     'Authorization': f'Token TVRBeU5UQTBOVFkuWmFpU2dBLmNKaFRpbjYyX0NnbjBJUnIzNXhqZlEtUHRXQQ=='
    #     # }
    #     # for i in range(95, 100):
    #     #     self.client.get("/projects/{}".format(i))
    #     self.client.get("/api/v2/projects/")

class Country(HttpUser):
    wait_time = between(1, 5)
    @task
    def projects(self):
        self.client.get("/api/v2/countries/")
