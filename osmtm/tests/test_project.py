from . import BaseTestCase

class TestProjectFunctional(BaseTestCase):

    def create_project(self):
        import geoalchemy2
        import shapely
        import transaction
        from osmtm.models import Area, Project, DBSession

        shape = shapely.geometry.Polygon(
            [(7.23, 41.25), (7.23, 41.12), (7.41, 41.20)])
        geometry = geoalchemy2.shape.from_shape(shape, 4326)
        area = Area(geometry)
        project = Project(u'test project')
        project.area = area
        project.auto_fill(12)

        DBSession.add(project)
        DBSession.flush()
        project_id = project.id
        transaction.commit()

        return project_id

    def test_project__not_found(self):
        self.testapp.get('/project/999', status=302)

    def test_project(self):
        project_id = self.create_project()
        self.testapp.get('/project/%d' % project_id, status=200)

    def test_project_new_forbidden(self):
        self.testapp.get('/project/new', status=403)

        headers = self.login_as_user1()
        self.testapp.get('/project/new', headers=headers, status=403)

    def test_project_new(self):
        headers = self.login_as_admin()
        self.testapp.get('/project/new', headers=headers, status=200)

    def test_project_edit_forbidden(self):
        headers = self.login_as_user1()
        res = self.testapp.get('/project/999/edit', headers=headers, status=403)

    def test_project_edit_not_submitted(self):
        headers = self.login_as_admin()
        project_id = self.create_project()
        self.testapp.get('/project/%d/edit' % project_id, headers=headers,
                status=200)

    def test_project_edit_submitted(self):
        headers = self.login_as_admin()
        headers['Accept-Language'] = 'fr'
        project_id = self.create_project()
        res = self.testapp.get('/project/%d/edit' % project_id, headers=headers,
                params={
                    'form.submitted': True,
                    'imagery': 'imagery_bar',
                    'license_id': 1,
                    'name_fr': 'the_name_in_french'
                },
                status=302)

        res2 = res.follow(headers=headers, status=200)
        self.assertTrue('the_name_in_french' in res2.body)
