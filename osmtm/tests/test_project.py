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

    def test_project_new_grid_not_submitted(self):
        headers = self.login_as_admin()
        self.testapp.get('/project/new/grid', headers=headers,
                         status=200)

    def test_project_new_grid_submitted(self):
        from osmtm.models import DBSession, Project
        headers = self.login_as_admin()
        self.testapp.get('/project/new/grid', headers=headers,
                         params={
                             'form.submitted': True,
                             'geometry': '{"type":"Polygon","coordinates":[[[2.28515625,46.37725420510028],[3.076171875,45.9511496866914],[3.69140625,46.52863469527167],[2.28515625,46.37725420510028]]]}',  # noqa
                             'zoom': 10
                         },
                         status=302)

        project = DBSession.query(Project).order_by(Project.id.desc()).first()
        self.assertEqual(len(project.tasks), 11)

    def test_project_new_import_not_submitted(self):
        headers = self.login_as_admin()
        self.testapp.get('/project/new/import', headers=headers,
                         status=200)

    def test_project_new_import_invalid_json(self):
        headers = self.login_as_admin()
        self.testapp.post('/project/new/import',
                          upload_files=[('import', 'map.geojson', 'blah')],
                          headers=headers,
                          params={
                              'form.submitted': True
                          },
                          status=200)

    def test_project_new_import_invalid_json_bis(self):
        headers = self.login_as_admin()
        self.testapp.post('/project/new/import',
                          upload_files=[('import', 'map.geojson', '{"type":"FeatureCollection","features":[{"type":"Feature","properties":{},"geometry":{"type":"LineString","coordinates":[[-5.625,39.232253141714885],[-2.63671875,40.78054143186031]]}}]}')],  # noqa
                          headers=headers,
                          params={
                              'form.submitted': True
                          },
                          status=200)

    def test_project_new_import_no_feature(self):
        headers = self.login_as_admin()
        self.testapp.post('/project/new/import',
                          upload_files=[('import', 'map.geojson', '{"type":"FeatureCollection","features":[]}')],  # noqa
                          headers=headers,
                          params={
                              'form.submitted': True
                          },
                          status=200)

    def test_project_new_import_submitted(self):
        from osmtm.models import DBSession, Project
        headers = self.login_as_admin()
        self.testapp.post('/project/new/import',
                          upload_files=[('import', 'map.geojson', '{"type":"FeatureCollection","features":[{"type":"Feature","properties":{},"geometry":{"type":"Polygon","coordinates":[[[4.39453125,19.559790136497398],[4.04296875,21.37124437061832],[7.6025390625,22.917922936146045],[8.96484375,20.05593126519445],[5.625,18.93746442964186],[4.39453125,19.559790136497398]]]}},{"type":"Feature","properties":{},"geometry":{"type":"Polygon","coordinates":[[[1.3623046875,17.09879223767869],[3.0322265625,18.687878686034196],[6.0205078125,18.271086109608877],[6.2841796875,16.972741019999035],[5.3173828125,16.509832826905846],[4.482421875,17.056784609942554],[2.900390625,16.088042220148807],[1.3623046875,17.09879223767869]]]}},{"type":"Feature","properties":{},"geometry":{"type":"Polygon","coordinates":[[[1.0986328125,19.849393958422805],[1.7578125,21.53484700204879],[3.7353515625,20.46818922264095],[3.33984375,18.979025953255267],[0.439453125,19.394067895396628],[1.0986328125,19.849393958422805]]]}}]}')],  # noqa
                          headers=headers,
                          params={
                              'form.submitted': True
                          },
                          status=302)

        project = DBSession.query(Project).order_by(Project.id.desc()).first()
        self.assertEqual(len(project.tasks), 3)

    def test_project_edit_forbidden(self):
        headers = self.login_as_user1()
        self.testapp.get('/project/999/edit', headers=headers, status=403)

    def test_project_edit_not_submitted(self):
        headers = self.login_as_admin()
        project_id = self.create_project()
        self.testapp.get('/project/%d/edit' % project_id, headers=headers,
                         status=200)

    def test_project_edit_submitted(self):
        headers = self.login_as_admin()
        headers['Accept-Language'] = 'fr'
        project_id = self.create_project()
        res = self.testapp.get('/project/%d/edit' % project_id,
                               headers=headers,
                               params={
                                   'form.submitted': True,
                                   'imagery': 'imagery_bar',
                                   'license_id': 1,
                                   'name_fr': 'the_name_in_french',
                                   'priority': 2
                               },
                               status=302)

        res2 = res.follow(headers=headers, status=200)
        self.assertTrue('the_name_in_french' in res2.body)

    def test_project_tasks_json(self):
        project_id = 1
        res = self.testapp.get('/project/%d/tasks.json' % project_id,
                               status=200)
        self.assertEqual(len(res.json['features']), 6)

    def test_project_check_for_updates(self):
        project_id = self.create_project()
        res = self.testapp.get('/project/%d/check_for_updates' % project_id,
                               params={
                                   'interval': 1000
                               },
                               status=200)
        self.assertFalse(res.json['update'])

        headers_user1 = self.login_as_user1()
        res = self.testapp.get('/project/%d/task/3/lock' % project_id,
                               status=200,
                               headers=headers_user1,
                               xhr=True)
        res = self.testapp.get('/project/%d/check_for_updates' % project_id,
                               params={
                                   'interval': 1000
                               },
                               status=200)
        self.assertTrue(res.json['update'])
        self.assertEqual(len(res.json['updated']), 1)

    def test_project_user_add__not_allowed(self):
        project_id = self.create_project()

        headers = self.login_as_user1()
        self.testapp.put('/project/%d/user/foo' % project_id,
                         headers=headers, status=403)

    def test_project_user_add(self):
        from osmtm.models import Project, DBSession
        project_id = self.create_project()

        headers = self.login_as_admin()
        self.testapp.put('/project/%d/user/user1' % project_id,
                         headers=headers, status=200)
        project = DBSession.query(Project).get(project_id)
        self.assertEqual(len(project.allowed_users), 1)

    def test_project_user_delete__not_allowed(self):
        project_id = self.create_project()

        headers = self.login_as_user1()
        self.testapp.delete('/project/%d/user/foo' % project_id,
                            headers=headers, status=403)

    def test_project_user_delete(self):
        import transaction
        from . import USER1_ID
        from osmtm.models import User, Project, DBSession
        project_id = self.create_project()

        project = DBSession.query(Project).get(project_id)
        user1 = DBSession.query(User).get(USER1_ID)
        project.allowed_users.append(user1)
        DBSession.add(project)
        DBSession.flush()
        transaction.commit()

        headers = self.login_as_admin()
        self.testapp.delete('/project/%d/user/%d' % (project_id, USER1_ID),
                            headers=headers, status=200)

        project = DBSession.query(Project).get(project_id)
        self.assertEqual(len(project.allowed_users), 0)

    def test_project__private_not_allowed(self):
        import transaction
        from osmtm.models import Project, DBSession
        project_id = self.create_project()

        project = DBSession.query(Project).get(project_id)
        project.private = True
        DBSession.add(project)
        DBSession.flush()
        transaction.commit()
        self.testapp.get('/project/%d' % project_id, status=403)

        headers_user1 = self.login_as_user1()
        self.testapp.get('/project/%d' % project_id,
                         status=403,
                         headers=headers_user1)

    def test_home__private_not_allowed(self):
        import transaction
        from . import USER1_ID
        from osmtm.models import User, Project, DBSession
        project_id = self.create_project()

        project = DBSession.query(Project).get(project_id)
        project.name = u"private_project"
        project.private = True
        DBSession.add(project)
        DBSession.flush()
        transaction.commit()

        res = self.testapp.get('/', status=200)
        self.assertFalse("private_project" in res.body)

        res = self.testapp.get('/', status=200,
                               params={
                                   'search': 'private'
                               })
        self.assertFalse("private_project" in res.body)

        headers_user1 = self.login_as_user1()
        res = self.testapp.get('/', status=200, headers=headers_user1)
        self.assertFalse("private_project" in res.body)

        user1 = DBSession.query(User).get(USER1_ID)
        project = DBSession.query(Project).get(project_id)
        project.allowed_users.append(user1)
        DBSession.add(project)
        DBSession.flush()
        transaction.commit()

        res = self.testapp.get('/', status=200, headers=headers_user1)
        self.assertTrue("private_project" in res.body)
