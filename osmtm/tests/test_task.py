from . import BaseTestCase

class TestTaskFunctional(BaseTestCase):

    def test_task(self):
        import transaction
        from osmtm.models import DBSession
        project = self.create_project()
        DBSession.add(project)
        DBSession.flush()
        project_id = project.id
        transaction.commit()
        self.testapp.get('/project/%d/task/1' % project_id, status=200,
                xhr=True)
