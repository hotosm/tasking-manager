from server.models.project import AreaOfInterest, Project


class ProjectService:

    def create_draft_project(self, data):

        area = AreaOfInterest(data['area'])
        project = Project(data, area=area)
        project.save()
        iain = project



