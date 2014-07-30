from . import BaseTestCase


class TestTaskFunctional(BaseTestCase):

    def test_task(self):
        self.testapp.get('/project/1/task/1', status=200, xhr=True)

    def test_task__not_found(self):
        self.testapp.get('/project/1/task/99', status=404, xhr=True)

    def test_task__loggedin(self):
        headers = self.login_as_user1()
        self.testapp.get('/project/1/task/1', status=200,
                         headers=headers,
                         xhr=True)

    def test_task_empty(self):
        self.testapp.get('/project/1/task/empty', status=200, xhr=True)

    def test_task_empty__loggedin(self):
        headers = self.login_as_user1()
        self.testapp.get('/project/1/task/empty', status=200,
                         headers=headers, xhr=True)

    def test_task_done__not_loggedin(self):
        self.testapp.get('/project/1/task/1/done', status=401, xhr=True)

    def test_task_done__not_locked(self):
        headers = self.login_as_user1()
        self.testapp.get('/project/1/task/1/done', status=403,
                         headers=headers,
                         xhr=True)

    def test_task_done__locked(self):
        headers = self.login_as_user1()
        self.testapp.get('/project/1/task/2/lock', status=200,
                         headers=headers,
                         xhr=True)
        self.testapp.get('/project/1/task/2/done', status=200,
                         headers=headers,
                         xhr=True)

    def test_task_lock__not_loggedin(self):
        self.testapp.get('/project/1/task/3/lock', status=401, xhr=True)

    def test_task_done__comment(self):
        headers = self.login_as_user1()
        self.testapp.get('/project/1/task/4/lock', status=200,
                         headers=headers,
                         xhr=True)
        self.testapp.get('/project/1/task/4/done', status=200,
                         headers=headers,
                         params={
                             'comment': 'some_comment'
                         },
                         xhr=True)

    def test_task_lock(self):
        headers_user1 = self.login_as_user1()
        res = self.testapp.get('/project/1/task/3/lock', status=200,
                               headers=headers_user1,
                               xhr=True)
        self.assertTrue(res.json['success'])

        headers_user2 = self.login_as_user2()
        res = self.testapp.get('/project/1/task/3/lock', status=200,
                               headers=headers_user2,
                               xhr=True)
        # already locked by user1
        self.assertFalse(res.json['success'])

        # unlock the tile for later tests
        self.testapp.get('/project/1/task/3/unlock',
                         headers=headers_user1,
                         xhr=True)

    def test_task_lock__other_task_locked(self):
        headers = self.login_as_user1()
        headers_user1 = self.login_as_user1()
        self.testapp.get('/project/1/task/3/lock', status=200,
                         headers=headers_user1,
                         xhr=True)
        self.testapp.get('/project/1/task/4/lock', status=400,
                         headers=headers,
                         xhr=True)

        # unlock the tile for later tests
        self.testapp.get('/project/1/task/3/unlock',
                         headers=headers_user1,
                         xhr=True)

    def test_task_unlock(self):
        headers = self.login_as_user1()
        self.testapp.get('/project/1/task/3/lock', status=200,
                         headers=headers,
                         xhr=True)
        res = self.testapp.get('/project/1/task/3/unlock', status=200,
                               headers=headers,
                               xhr=True)
        self.assertTrue(res.json['success'])

    def test_task_unlock__comment(self):
        headers = self.login_as_user1()
        self.testapp.get('/project/1/task/3/lock', status=200,
                         headers=headers,
                         xhr=True)
        res = self.testapp.get('/project/1/task/3/unlock', status=200,
                               headers=headers,
                               params={
                                   'comment': 'some_comment'
                               },
                               xhr=True)
        self.assertTrue(res.json['success'])

    def test_task_comment(self):
        headers = self.login_as_user1()
        res = self.testapp.get('/project/1/task/3/comment', status=200,
                               headers=headers,
                               params={
                                   'comment': 'some_comment'
                               },
                               xhr=True)
        self.assertTrue(res.json['success'])

    def test_task_invalidate(self):
        headers = self.login_as_user1()
        self.testapp.get('/project/1/task/5/lock',
                         headers=headers,
                         xhr=True)
        self.testapp.get('/project/1/task/5/done', status=200,
                         headers=headers,
                         xhr=True)

        headers = self.login_as_user2()
        self.testapp.get('/project/1/task/5/lock',
                         headers=headers,
                         xhr=True)
        self.testapp.get('/project/1/task/5/validate', status=200,
                         params={
                             'comment': 'a comment',
                             'invalidate': True
                         },
                         headers=headers,
                         xhr=True)

    def test_task_validate(self):
        headers = self.login_as_user1()
        self.testapp.get('/project/1/task/7/lock',
                         headers=headers,
                         xhr=True)
        self.testapp.get('/project/1/task/7/done', status=200,
                         headers=headers,
                         xhr=True)

        headers = self.login_as_user2()
        self.testapp.get('/project/1/task/7/lock',
                         headers=headers,
                         xhr=True)
        self.testapp.get('/project/1/task/7/validate', status=200,
                         params={'validate': True},
                         headers=headers,
                         xhr=True)

    def test_task_split(self):
        headers = self.login_as_user1()
        self.testapp.get('/project/1/task/6/lock',
                         headers=headers,
                         xhr=True)

        self.testapp.get('/project/1/task/6/split', status=200,
                         headers=headers,
                         xhr=True)

        self.testapp.get('/project/1/task/10/lock',
                         headers=headers,
                         xhr=True)

        self.testapp.get('/project/1/task/10/split', status=200,
                         headers=headers,
                         xhr=True)

        self.testapp.get('/project/1/task/14/lock',
                         headers=headers,
                         xhr=True)

        # can't split more than twice
        self.testapp.get('/project/1/task/14/split', status=400,
                         headers=headers,
                         xhr=True)

        # unlock the tile for later tests
        self.testapp.get('/project/1/task/14/unlock',
                         headers=headers,
                         xhr=True)

        # task has been removed
        self.testapp.get('/project/1/task/6', status=404, xhr=True)

    def test_task_random(self):
        headers = self.login_as_user1()
        res = self.testapp.get('/project/1/random', status=200,
                               headers=headers,
                               xhr=True)
        self.assertTrue(res.json['success'])

    def test_task_random__bordering_busy_tasks(self):
        import geoalchemy2
        import shapely
        import transaction
        from osmtm.models import Task, TaskLock, Area, Project, User, DBSession

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

        user2 = DBSession.query(User).filter(User.id == self.user2_id).one()
        task = DBSession.query(Task).filter(Task.project_id == project_id) \
            .first()
        task.locks.append(TaskLock(user=user2, lock=True))
        DBSession.add(task)

        transaction.commit()

        headers = self.login_as_user1()
        res = self.testapp.get('/project/%d/random' % project_id, status=200,
                               headers=headers,
                               xhr=True)
        self.assertTrue(res.json['success'])

    def test_task_random__priority_areas(self):
        import geoalchemy2
        import shapely
        import transaction
        from osmtm.models import (
            Task, TaskLock, Area, Project, PriorityArea, User, DBSession,
        )

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

        shape = shapely.geometry.Polygon(
            [(7.23, 41.25), (7.23, 41.12), (7.24, 41.25)])
        geometry = geoalchemy2.shape.from_shape(shape, 4326)
        project.priority_areas.append(PriorityArea(geometry))

        transaction.commit()

        # priority only
        headers = self.login_as_user1()
        res = self.testapp.get('/project/%d/random' % project_id, status=200,
                               headers=headers,
                               xhr=True)
        self.assertTrue(res.json['success'])

        # priority + busy task
        user2 = DBSession.query(User).filter(User.id == self.user2_id).one()
        task = DBSession.query(Task).filter(Task.project_id == project_id) \
            .first()
        task.locks.append(TaskLock(user=user2, lock=True))
        DBSession.add(task)

        transaction.commit()

        headers = self.login_as_user1()
        res = self.testapp.get('/project/%d/random' % project_id, status=200,
                               headers=headers,
                               xhr=True)
        self.assertTrue(res.json['success'])

    def test_task_random__none_available(self):
        import geoalchemy2
        import shapely
        import transaction
        from osmtm.models import Area, Project, TaskState, DBSession

        shape = shapely.geometry.Polygon(
            [(7.23, 41.25), (7.23, 41.12), (7.41, 41.20)])
        geometry = geoalchemy2.shape.from_shape(shape, 4326)
        area = Area(geometry)
        project = Project(u'test project')
        project.area = area
        project.auto_fill(10)

        DBSession.add(project)
        DBSession.flush()
        project_id = project.id

        for task in project.tasks:
            task.states.append(TaskState(state=TaskState.state_done))
            DBSession.add(task)

        transaction.commit()

        headers = self.login_as_user1()
        res = self.testapp.get('/project/%d/random' % project_id, status=200,
                               headers=headers,
                               xhr=True)
        self.assertFalse(res.json['success'])

    def test_task_gpx(self):
        self.testapp.get('/project/1/task/1.gpx', status=200)

    def test_task_assign__unauthorized(self):
        headers = self.login_as_user1()
        self.testapp.get('/project/1/task/1/user/user2',
                         headers=headers,
                         status=403,
                         xhr=True)

    def test_task_assign__locked(self):
        headers = self.login_as_project_manager()
        self.testapp.get('/project/1/task/2/lock',
                         headers=headers,
                         xhr=True)
        self.testapp.get('/project/1/task/2/user/user2',
                         headers=headers,
                         status=400,
                         xhr=True)
        self.testapp.get('/project/1/task/2/unlock',
                         headers=headers,
                         xhr=True)

    def test_task_assign(self):
        headers = self.login_as_project_manager()
        # assign task to user 1
        self.testapp.get('/project/1/task/1/user/user1',
                         headers=headers,
                         status=200,
                         xhr=True)

        # re-assign it to user 2
        self.testapp.get('/project/1/task/1/user/user2',
                         headers=headers,
                         status=200,
                         xhr=True)

    def test_task_assign_delete(self):
        from osmtm.models import Task, DBSession

        headers = self.login_as_project_manager()
        # assign task to user 1
        self.testapp.delete('/project/1/task/1/user',
                            headers=headers,
                            status=200,
                            xhr=True)

        task = DBSession.query(Task).get((1, 1))
        self.assertEqual(task.assigned_to_id, None)

    def test_task_xhr__assigned(self):
        headers = self.login_as_project_manager()
        # assign task to user 1
        self.testapp.get('/project/1/task/1/user/user1',
                         headers=headers,
                         status=200,
                         xhr=True)

        # user 2 cannot lock the task assigned to user 1
        headers = self.login_as_user2()
        res = self.testapp.get('/project/1/task/1/lock',
                               headers=headers,
                               status=400,
                               xhr=True)
        self.assertFalse(res.json['success'])

        # user 1 can lock the task assigned to him
        headers = self.login_as_user1()
        res = self.testapp.get('/project/1/task/1/lock',
                               headers=headers,
                               status=200,
                               xhr=True)
        self.assertTrue(res.json['success'])
        self.testapp.get('/project/1/task/1/unlock',
                         headers=headers,
                         xhr=True)

    def test_task_osm(self):
        self.testapp.get('/project/1/task/1.osm', status=200)

    def test_task_difficulty(self):
        from osmtm.models import Task, DBSession
        headers = self.login_as_project_manager()
        self.testapp.put('/project/1/task/1/difficulty/3',
                         headers=headers,
                         status=200,
                         xhr=True)

        task = DBSession.query(Task).get((1, 1))
        self.assertEqual(task.difficulty, task.difficulty_hard)

    def test_task_difficulty_delete(self):
        from osmtm.models import Task, DBSession

        import transaction
        task = DBSession.query(Task).get((1, 1))
        task.difficulty = task.difficulty_easy
        DBSession.add(task)
        DBSession.flush()
        transaction.commit()

        task = DBSession.query(Task).get((1, 1))
        self.assertEqual(task.difficulty, task.difficulty_easy)

        headers = self.login_as_project_manager()
        # assign task to user 1
        self.testapp.delete('/project/1/task/1/difficulty',
                            headers=headers,
                            status=200,
                            xhr=True)

        task = DBSession.query(Task).get((1, 1))
        self.assertEqual(task.difficulty, None)
