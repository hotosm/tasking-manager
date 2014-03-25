from . import BaseTestCase

class TestTaskFunctional(BaseTestCase):

    def test_task(self):
        project_id = self.create_project()
        self.testapp.get('/project/%d/task/1' % project_id, status=200,
                xhr=True)
