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

    def test_project_new__logged_as_project_manager(self):
        headers = self.login_as_project_manager()
        self.testapp.get('/project/new', headers=headers, status=200)

    def test_project_new_grid__invalid_json(self):
        headers = self.login_as_admin()
        self.testapp.get('/project/new/grid', headers=headers,
                         params={
                             'form.submitted': True,
                             'geometry': 'blah',  # noqa
                         },
                         status=302)

    def test_project_new_grid(self):
        from osmtm.models import DBSession, Project
        headers = self.login_as_admin()
        self.testapp.get('/project/new/grid', headers=headers,
                         params={
                             'form.submitted': True,
                             'geometry': '{"type":"FeatureCollection","features":[{"type":"Feature","geometry":{"type":"Polygon","coordinates":[[[2.28515625,46.37725420510028],[3.076171875,45.9511496866914],[3.69140625,46.52863469527167],[2.28515625,46.37725420510028]]]}}]}',  # noqa
                             'tile_size': -2
                         },
                         status=302)

        project = DBSession.query(Project).order_by(Project.id.desc()).first()
        self.assertEqual(len(project.tasks), 4)

    def test_project_grid_simulate(self):
        headers = self.login_as_admin()
        res = self.testapp.get('/project/grid_simulate', headers=headers,
                params={
                    'form.submitted': True,
                    'geometry': '{"type":"FeatureCollection","features":[{"type":"Feature","geometry":{"type":"Polygon","coordinates":[[[2.28515625,46.37725420510028],[3.076171875,45.9511496866914],[3.69140625,46.52863469527167],[2.28515625,46.37725420510028]]]}}]}',  # noqa
                    'tile_size': -2
                    },
                xhr=True,
                status=200
        )

        count = len(res.json['features'][0]['geometry']['coordinates'])
        self.assertEqual(count, 4)

    def test_project_new_arbitrary__invalid_json(self):
        headers = self.login_as_admin()
        self.testapp.post('/project/new/arbitrary',
                          headers=headers,
                          params={
                              'form.submitted': True,
                              'geometry': 'blah'
                          },
                          status=302)

    def test_project_new_arbitrary__invalid_json_bis(self):
        headers = self.login_as_admin()
        self.testapp.post('/project/new/arbitrary',
                          headers=headers,
                          params={
                              'form.submitted': True,
                              'geometry': '{"type":"FeatureCollection","features":[{"type":"Feature","properties":{},"geometry":{"type":"LineString","coordinates":[[-5.625,39.232253141714885],[-2.63671875,40.78054143186031]]}}]}'  # noqa
                          },
                          status=302)

    def test_project_new_arbitrary__no_feature(self):
        headers = self.login_as_admin()
        self.testapp.post('/project/new/arbitrary',
                          headers=headers,
                          params={
                              'form.submitted': True,
                              'geometry': '{"type":"FeatureCollection","features":[]}'  # noqa
                          },
                          status=302)

    def test_project_new_arbitrary(self):
        from osmtm.models import DBSession, Project
        headers = self.login_as_admin()
        self.testapp.post('/project/new/arbitrary',
                          headers=headers,
                          params={
                              'form.submitted': True,
                              'geometry': '{"type":"FeatureCollection","features":[{"type":"Feature","properties":{},"geometry":{"type":"Polygon","coordinates":[[[4.39453125,19.559790136497398],[4.04296875,21.37124437061832],[7.6025390625,22.917922936146045],[8.96484375,20.05593126519445],[5.625,18.93746442964186],[4.39453125,19.559790136497398]]]}},{"type":"Feature","properties":{},"geometry":{"type":"Polygon","coordinates":[[[1.3623046875,17.09879223767869],[3.0322265625,18.687878686034196],[6.0205078125,18.271086109608877],[6.2841796875,16.972741019999035],[5.3173828125,16.509832826905846],[4.482421875,17.056784609942554],[2.900390625,16.088042220148807],[1.3623046875,17.09879223767869]]]}},{"type":"Feature","properties":{},"geometry":{"type":"Polygon","coordinates":[[[1.0986328125,19.849393958422805],[1.7578125,21.53484700204879],[3.7353515625,20.46818922264095],[3.33984375,18.979025953255267],[0.439453125,19.394067895396628],[1.0986328125,19.849393958422805]]]}}]}'  # noqa
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

    def test_project_edit_not_submitted_priority_areas(self):
        import transaction
        headers = self.login_as_admin()
        project_id = self.create_project()

        from osmtm.models import Project, PriorityArea, DBSession
        project = DBSession.query(Project).get(project_id)

        import shapely
        import geoalchemy2
        shape = shapely.geometry.Polygon(
            [(7.23, 41.25), (7.23, 41.12), (7.41, 41.20)])
        geometry = geoalchemy2.shape.from_shape(shape, 4326)
        priority_area = PriorityArea(geometry)
        project.priority_areas.append(priority_area)
        DBSession.add(project)
        DBSession.flush()
        transaction.commit()

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
                                   'priority': 2,
                                   'status': 2,
                               },
                               status=302)

        res2 = res.follow(headers=headers, status=200)
        self.assertTrue('the_name_in_french' in res2.body)

    def test_project_edit__submitted_private(self):
        headers = self.login_as_admin()
        project_id = self.create_project()
        self.testapp.get('/project/%d/edit' % project_id,
                         headers=headers,
                         params={
                             'form.submitted': True,
                             'license_id': 1,
                             'priority': 2,
                             'status': 2,
                             'private': 'on',
                         },
                         status=302)

        from osmtm.models import Project, DBSession
        project = DBSession.query(Project).get(project_id)
        self.assertTrue(project.private)

    def test_project_edit__submitted_josm_preset(self):
        headers = self.login_as_admin()
        project_id = self.create_project()
        self.testapp.post('/project/%d/edit' % project_id,
                          headers=headers,
                          upload_files=[('josm_preset', 'preset.xml', 'blah')],
                          params={
                              'form.submitted': True,
                              'license_id': 1,
                              'priority': 2,
                              'status': 2,
                          },
                          status=302)

        from osmtm.models import Project, DBSession
        project = DBSession.query(Project).get(project_id)
        self.assertEqual(project.josm_preset, 'blah')

    def test_project_edit__submitted_due_date(self):
        headers = self.login_as_admin()
        project_id = self.create_project()
        date_str = '1/1/2150'
        self.testapp.post('/project/%d/edit' % project_id,
                          headers=headers,
                          upload_files=[('josm_preset', 'preset.xml', 'blah')],
                          params={
                              'form.submitted': True,
                              'license_id': 1,
                              'priority': 2,
                              'status': 2,
                              'due_date': date_str
                          },
                          status=302)

        from osmtm.models import Project, DBSession
        project = DBSession.query(Project).get(project_id)
        import datetime
        date = datetime.datetime.strptime(date_str, "%m/%d/%Y")
        self.assertEqual(project.due_date, date)

    def test_project_edit__submitted_priority_areas(self):
        headers = self.login_as_admin()
        project_id = self.create_project()
        self.testapp.post('/project/%d/edit' % project_id,
                          headers=headers,
                          params={
                              'form.submitted': True,
                              'priority': 2,
                              'status': 2,
                              'priority_areas': '{"type":"FeatureCollection","features":[{"geometry":{"type":"Polygon","coordinates":[[[85.31424522399902,27.70260377553105],[85.31424522399902,27.70419959861825],[85.31639099121094,27.70419959861825],[85.31639099121094,27.70260377553105],[85.31424522399902,27.70260377553105]]]},"type":"Feature","id":null,"properties":{}}]}'  # noqa
                          },
                          status=302)

        from osmtm.models import Project, DBSession
        project = DBSession.query(Project).get(project_id)
        self.assertEqual(len(project.priority_areas), 1)

        self.testapp.post('/project/%d/edit' % project_id,
                          headers=headers,
                          params={
                              'form.submitted': True,
                              'priority': 2,
                              'status': 2,
                              'priority_areas': '{"type":"FeatureCollection","features":[{"geometry":{"type":"Polygon","coordinates":[[[85.31,27.702],[85.31,27.7],[85.31,27.704],[85.31,27.702],[85.31,27.702]]]},"type":"Feature","id":null,"properties":{}}, {"geometry":{"type":"Polygon","coordinates":[[[85.31,27.702],[85.31,27.7],[85.31,27.704],[85.31,27.702],[85.31,27.702]]]},"type":"Feature","id":null,"properties":{}}]}'  # noqa
                          },
                          status=302)

        from osmtm.models import Project, DBSession
        project = DBSession.query(Project).get(project_id)
        self.assertEqual(len(project.priority_areas), 2)

        self.testapp.post('/project/%d/edit' % project_id,
                          headers=headers,
                          params={
                              'form.submitted': True,
                              'priority': 2,
                              'status': 2,
                              'priority_areas': '{"type":"FeatureCollection","features":[{"geometry":{"type":"Polygon","coordinates":[[[85.3,27.702],[85.31,27.7],[85.31,27.704],[85.31,27.702],[85.3,27.702]]]},"type":"Feature","id":null,"properties":{}}, {"geometry":{"type":"Polygon","coordinates":[[[85.31,27.702],[85.31,27.7],[85.31,27.704],[85.31,27.702],[85.31,27.702]]]},"type":"Feature","id":null,"properties":{}}]}'  # noqa
                          },
                          status=302)

        from osmtm.models import Project, DBSession
        project = DBSession.query(Project).get(project_id)
        self.assertEqual(len(project.priority_areas), 2)

    def test_project_priority_areas(self):
        import transaction
        project_id = self.create_project()

        from osmtm.models import Project, PriorityArea, DBSession
        project = DBSession.query(Project).get(project_id)

        import shapely
        import geoalchemy2
        shape = shapely.geometry.Polygon(
            [(7.23, 41.25), (7.23, 41.12), (7.41, 41.20)])
        geometry = geoalchemy2.shape.from_shape(shape, 4326)
        priority_area = PriorityArea(geometry)
        project.priority_areas.append(priority_area)
        DBSession.add(project)
        DBSession.flush()
        transaction.commit()

        self.testapp.get('/project/%d' % project_id, status=200)

    def test_project_tasks_json(self):
        project_id = 1
        res = self.testapp.get('/project/%d/tasks.json' % project_id,
                               status=200)
        self.assertEqual(len(res.json['features']), 6)

    def test_project_check_for_updates(self):
        import time
        project_id = self.create_project()
        time.sleep(1)
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
        res = self.testapp.get('/project/%d/task/3/done' % project_id,
                               status=200,
                               headers=headers_user1,
                               xhr=True)

        res = self.testapp.get('/project/%d/check_for_updates' % project_id,
                               params={
                                   'interval': 1000
                               },
                               status=200)
        self.assertTrue(res.json['update'])
        self.assertEqual(len(res.json['updated']), 3)

    def test_project_check_for_updates_2(self):
        import time
        project_id = self.create_project()
        time.sleep(1)
        res = self.testapp.get('/project/%d/check_for_updates' % project_id,
                               params={
                                   'interval': 1000
                               },
                               status=200)
        self.assertFalse(res.json['update'])

        headers_user1 = self.login_as_user1()
        res = self.testapp.get('/project/%d/task/4/lock' % project_id,
                               status=200,
                               headers=headers_user1,
                               xhr=True)
        res = self.testapp.get('/project/%d/task/4/split' % project_id,
                               status=200,
                               headers=headers_user1,
                               xhr=True)

        res = self.testapp.get('/project/%d/check_for_updates' % project_id,
                               params={
                                   'interval': 1000
                               },
                               status=200)
        self.assertTrue(res.json['update'])
        self.assertEqual(len(res.json['updated']), 7)

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

    def test_project_preset(self):
        import transaction
        from osmtm.models import Project, DBSession
        project_id = self.create_project()

        project = DBSession.query(Project).get(project_id)
        project.josm_preset = u'blah'
        DBSession.add(project)
        DBSession.flush()
        transaction.commit()

        res = self.testapp.get('/project/%d/preset' % project_id, status=200)
        self.assertTrue('blah' in res)

    def test_project_contributors(self):
        project_id = self.create_project()

        headers = self.login_as_user1()
        self.testapp.get('/project/%d/task/1/lock' % project_id,
                         headers=headers,
                         xhr=True)
        self.testapp.get('/project/%d/task/1/done' % project_id,
                         headers=headers,
                         xhr=True)

        res = self.testapp.get('/project/%d/contributors' % project_id,
                               status=200, xhr=True)
        self.assertTrue('user1' in res)

        # assign task to user 2
        headers = self.login_as_project_manager()
        self.testapp.get('/project/%d/task/1/user/user2' % project_id,
                         headers=headers,
                         status=200,
                         xhr=True)
        res = self.testapp.get('/project/%d/contributors' % project_id,
                               status=200, xhr=True)
        self.assertTrue('user2' in res)

    def test_project_stats(self):
        project_id = self.create_project()

        headers = self.login_as_user1()
        self.testapp.get('/project/%d/task/1/lock' % project_id,
                         headers=headers,
                         xhr=True)
        self.testapp.get('/project/%d/task/1/done' % project_id,
                         headers=headers,
                         xhr=True)
        self.testapp.get('/project/%d/task/1/lock' % project_id,
                         headers=headers,
                         xhr=True)
        self.testapp.get('/project/%d/task/1/validate' % project_id,
                         headers=headers,
                         params={
                             'comment': u'a comment',
                             'invalidate': True
                         },
                         xhr=True)

        self.testapp.get('/project/%d/task/2/lock' % project_id,
                         headers=headers,
                         xhr=True)
        self.testapp.get('/project/%d/task/2/done' % project_id,
                         headers=headers,
                         xhr=True)
        self.testapp.get('/project/%d/task/2/lock' % project_id,
                         headers=headers,
                         xhr=True)
        self.testapp.get('/project/%d/task/2/validate' % project_id,
                         headers=headers,
                         params={
                             'validate': True
                         },
                         xhr=True)
        self.testapp.get('/project/%d/task/2/lock' % project_id,
                         headers=headers,
                         xhr=True)
        self.testapp.get('/project/%d/task/2/validate' % project_id,
                         headers=headers,
                         params={
                             'comment': u'a comment',
                             'invalidate': True
                         },
                         xhr=True)

        self.testapp.get('/project/%d/stats' % project_id,
                         status=200, xhr=True)

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
        project.status = Project.status_published
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
        project.status = project.status_published
        project.allowed_users.append(user1)
        DBSession.add(project)
        DBSession.flush()
        transaction.commit()

        res = self.testapp.get('/', status=200, headers=headers_user1)
        self.assertTrue("private_project" in res.body)

    def test_home__my_projects(self):
        import transaction
        from osmtm.models import Project, DBSession
        project_id = self.create_project()

        project = DBSession.query(Project).get(project_id)
        name = "project_not_worked_on_by_user"
        project.name = u"" + name
        project.status = Project.status_published
        DBSession.add(project)
        DBSession.flush()
        transaction.commit()

        headers = self.login_as_user1()
        res = self.testapp.get('/', status=200, headers=headers)
        self.assertTrue(name in res.body)

        res = self.testapp.get('/', status=200, headers=headers,
                               params={
                                   'my_projects': 'on'
                               })
        self.assertFalse(name in res.body)

        self.testapp.get('/project/%d/task/1/lock' % project_id, status=200,
                         headers=headers,
                         xhr=True)

        res = self.testapp.get('/', status=200, headers=headers,
                               params={
                                   'my': 'on'
                               })
        self.assertTrue(name in res.body)

    def test_project_publish__not_allowed(self):
        project_id = self.create_project()

        headers = self.login_as_user1()
        self.testapp.get('/project/%d/publish' % project_id, headers=headers,
                         status=403)

    def test_project_publish(self):
        project_id = self.create_project()

        headers = self.login_as_project_manager()
        self.testapp.get('/project/%d/publish' % project_id, headers=headers,
                         status=302)

    def test_project_users(self):
        project_id = self.create_project()

        res = self.testapp.get('/project/%d/users' % project_id,
                               status=200, xhr=True)
        self.assertEqual(len(res.json), 4)

        res = self.testapp.get('/project/%d/users?q=pro' % project_id,
                               status=200, xhr=True)
        self.assertEqual(len(res.json), 1)

        # assign task to user 1
        headers = self.login_as_project_manager()
        self.testapp.get('/project/%d/task/1/user/user1' % project_id,
                         headers=headers,
                         status=200,
                         xhr=True)
        res = self.testapp.get('/project/%d/users' % project_id,
                               status=200, xhr=True)
        self.assertEqual(res.json[0], u'user1')

    def test_project_users__private_project(self):
        import transaction
        from osmtm.models import Project, DBSession
        project_id = self.create_project()
        project = DBSession.query(Project).get(project_id)
        project.name = u'private_project'
        project.private = True
        DBSession.add(project)
        DBSession.flush()
        transaction.commit()

        # access forbidden if not allowed user or project_manager
        res = self.testapp.get('/project/%d/users' % project_id,
                               status=403, xhr=True)

        headers = self.login_as_project_manager()
        res = self.testapp.get('/project/%d/users' % project_id,
                               headers=headers,
                               status=200, xhr=True)
        self.assertEqual(len(res.json), 0)

        # add a user to allowed_users
        self.testapp.put('/project/%d/user/user1' % project_id,
                         headers=headers, status=200)
        res = self.testapp.get('/project/%d/users' % project_id,
                               headers=headers,
                               status=200, xhr=True)
        self.assertEqual(len(res.json), 1)

    def test_project_check_expiration(self):
        import transaction
        from osmtm.models import Project, DBSession
        project_id = self.create_project()

        project = DBSession.query(Project).get(project_id)

        import datetime
        now = datetime.datetime.now()
        project.due_date = now - datetime.timedelta(hours=5)
        DBSession.add(project)
        DBSession.flush()
        transaction.commit()

        self.testapp.get('/', status=200)
        project = DBSession.query(Project).get(project_id)
        self.assertEqual(project.status, Project.status_archived)
