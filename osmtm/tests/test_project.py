from . import BaseTestCase

class TestProjectFunctional(BaseTestCase):

    def test_project__not_found(self):
        self.testapp.get('/project/999', status=302)

    def test_project(self):
        project_id = self.create_project()
        self.testapp.get('/project/%d' % project_id, status=200)

    def test_project_new_forbidden(self):
        self.testapp.get('/project/new', status=403)

        headers = self.login_as_foo()
        self.testapp.get('/project/new', headers=headers, status=403)

    def test_project_new_not_submitted(self):
        headers = self.login_as_admin()
        self.testapp.get('/project/new', headers=headers, status=200)

    def test_project_new_grid_submitted(self):
        headers = self.login_as_admin()
        res = self.testapp.get('/project/new', headers=headers,
                params={
                    'form.submitted': True,
                    'type': 'grid'
                },
                status=302)
        res = res.follow(headers=headers, status=200)

        form = res.forms[0]
        self.assertTrue('zoom' in form.fields and 'geometry' in form.fields)

    def test_project_new_imported_submitted(self):
        headers = self.login_as_admin()
        res = self.testapp.get('/project/new', headers=headers,
                params={
                    'form.submitted': True,
                    'type': 'imported'
                },
                status=302)
        res = res.follow(headers=headers, status=200)

        form = res.forms[0]
        self.assertTrue('import' in form.fields)
