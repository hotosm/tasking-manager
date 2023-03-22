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
        cls.app.config.update({"TESTING": True})
        cls.db = db
        cls.db.app = cls.app
        with cls.app.app_context():
            cls.db.create_all()

    @classmethod
    def tearDownClass(cls):
        with cls.app.app_context():
            db.session.remove()
            cls.db.drop_all()
            if cls.app in cls.db.engines:
                cls.db.engines[cls.app].dispose()
            if None in cls.db.engines:
                cls.db.engines[None].dispose()
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
