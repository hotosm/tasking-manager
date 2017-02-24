from server.models.project import Area, Project


class ProjectService:

    def create_draft_project(self, data):

        area = Area(data['area'])
        project = Project(data, area=area)
        project.save()
        iain = project



