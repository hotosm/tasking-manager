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
        db.session.remove()
        cls.db.drop_all()
        cls.db.get_engine(cls.app).dispose()
        super(BaseTestCase, cls).tearDownClass()

    def setUp(self):
        super(BaseTestCase, self).setUp()
        self.client = self.app.test_client()
        self.app_context = self.app.app_context()
        self.app_context.push()
        self.db.session.begin(subtransactions=True)
        clean_db(self.db)

    def tearDown(self):
        super(BaseTestCase, self).tearDown()
        self.db.session.rollback()
        self.db.session.close()
        self.app_context.pop()
