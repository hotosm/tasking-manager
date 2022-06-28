import unittest

from backend import create_app, db


def clean_db(db):
    for table in reversed(db.metadata.sorted_tables):
        db.session.execute(table.delete())


class BaseTestCase(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        super(BaseTestCase, cls).setUpClass()
        cls.app = create_app("backend.config.TestEnvironmentConfig")
        cls.db = db
        cls.db.app = cls.app
        cls.db.create_all()

    @classmethod
    def tearDownClass(cls):
        cls.db.drop_all()
        super(BaseTestCase, cls).tearDownClass()

    def setUp(self):
        super(BaseTestCase, self).setUp()
        self.client = self.app.test_client()
        self.app_context = self.app.app_context()
        self.app_context.push()
        clean_db(self.db)

    def tearDown(self):
        super(BaseTestCase, self).tearDown()
        self.db.session.rollback()
        self.app_context.pop()
