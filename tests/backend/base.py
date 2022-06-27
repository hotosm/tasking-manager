import unittest

from backend import create_app, db


def clean_db(db):
    for table in reversed(db.metadata.sorted_tables):
        db.session.execute(table.delete())


def add_trigger_for_text_searchable(db):
    # Add trigger to text_searchable field on project_info table
    # This trigger was manually added on migration script so it has to be added here
    db.engine.execute(
        """
            DROP TRIGGER IF EXISTS tsvectorupdate ON project_info;
            CREATE TRIGGER tsvectorupdate BEFORE INSERT OR UPDATE ON project_info FOR EACH ROW EXECUTE PROCEDURE
            tsvector_update_trigger(text_searchable, "pg_catalog.english", project_id_str, name,
            short_description, description)
            """
    )


class BaseTestCase(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        super(BaseTestCase, cls).setUpClass()
        cls.app = create_app("backend.config.TestEnvironmentConfig")
        cls.db = db
        cls.db.app = cls.app
        cls.db.session.close()
        cls.db.drop_all()
        cls.db.create_all()
        add_trigger_for_text_searchable(cls.db)

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
