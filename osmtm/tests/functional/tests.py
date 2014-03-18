#class TestTaskNew(unittest.TestCase):

    #def setUp(self):
        #self.config = testing.setUp()
        #_registerRoutes(self.config)

    #def tearDown(self):
        #DBSession.remove()
        #testing.tearDown()

    #def test_it(self):
        #from .views.task import task_new

        #request = testing.DummyRequest()
        #response = task_new(request)

        #request = testing.DummyRequest()
        #request.matchdict = {'project': 1}
        #request.params = {
            #'form.submitted': True,
            #'short_description':u'NewTask',
            #'zoom': 13
        #}
        #response = task_new(request)
        #self.assertEqual(response.location, 'http://example.com/project/1/tasks/manage')

#class TestTaskProjectnik(unittest.TestCase):

    #def setUp(self):
        #self.config = testing.setUp()
        #_registerRoutes(self.config)

    #def tearDown(self):
        #DBSession.remove()
        #testing.tearDown()

    #def test_it(self):
        #from .views.task import task_projectnik

        #request = testing.DummyRequest()
        #request.matchdict = {
            #'project': 1,
            #'task': 1,
            #'x': 532,
            #'y': 383,
            #'z': 10,
            #'format': 'png'
        #}
        #response = task_projectnik(request)
        #import projectnik
        #self.assertEqual(isinstance(response[0], projectnik.Layer), True)

#class FunctionalTests(unittest.TestCase):

    #def setUp(self):
        #from osmtm import main
        #settings = {
            #'sqlalchemy.url': 'postgresql://www-data@localhost/osmtm_tests'
        #}
        #self.app = main({}, **settings)

        #from webtest import TestApp
        #self.testapp = TestApp(self.app)

    #def tearDown(self):
        #DBSession.remove()
        #testing.tearDown()

    #def test_home(self):
        #res = self.testapp.get('', status=200)
        #self.failUnless('one' in res.body)

    #def test_tasks(self):
        #task = DBSession.query(Task).get(1)
        #self.assertEqual(len(task.tiles), 6)

    #def test_tasks_manage(self):
        #res = self.testapp.get('/project/1/tasks/manage')
        #self.assertEqual(len(res.html.findAll('li', {'class': 'task'})), 1)

    #def test_task_projectnik(self):
        #res = self.testapp.get('/project/1/task/1/10/532/383.png')
        #self.assertTrue(res.content_type == 'image/png')

        #res = self.testapp.get('/project/1/task/1/10/532/383.json')
        #self.assertTrue('grid' in res.body)

        #res = self.testapp.get('/project/2/task/1/10/532/383.png', status=400)
