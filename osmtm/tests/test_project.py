from . import BaseTestCase

class TestProjectFunctional(BaseTestCase):

    def test_project__not_found(self):
        self.testapp.get('/project/999', status=302)

    def test_project(self):
        import transaction
        from osmtm.models import DBSession
        project = self.create_project()
        DBSession.add(project)
        DBSession.flush()
        project_id = project.id
        transaction.commit()
        self.testapp.get('/project/%d' % project_id, status=200)
