import pytest
from datetime import datetime, timezone

from backend.models.postgis.project_partner import ProjectPartnership, ProjectPartnershipHistory
from backend.models.postgis.project import Project
from backend.models.postgis.partner import Partner

@pytest.mark.anyio
class TestProjectPartnership:
    @pytest.fixture(autouse=True)
    async def setup_db(self, db_connection_fixture, request):
        request.cls.db = db_connection_fixture
        
        # Setup test partner
        await self.db.execute(
            "INSERT INTO partners (id, name, primary_hashtag) VALUES (:id, :name, :hashtag)",
            {"id": 999, "name": "Test Partner", "hashtag": "#test"}
        )
        
        # Setup test user for author
        await self.db.execute(
            """
            INSERT INTO users (
                id, username, mapping_level, role,
                tasks_mapped, tasks_validated, tasks_invalidated,
                default_editor, mentions_notifications,
                projects_comments_notifications, projects_notifications,
                tasks_notifications, task_validation_notification,
                task_invalidation_notification, tasks_comments_notifications,
                teams_announcement_notifications
            ) VALUES (
                :id, :username, :mapping_level, :role,
                :tasks_mapped, :tasks_validated, :tasks_invalidated,
                :default_editor, :mentions_notifications,
                :projects_comments_notifications, :projects_notifications,
                :tasks_notifications, :task_validation_notification,
                :task_invalidation_notification, :tasks_comments_notifications,
                :teams_announcement_notifications
            ) ON CONFLICT DO NOTHING
            """,
            {
                "id": 1, "username": "admin", "mapping_level": 1, "role": 1,
                "tasks_mapped": 0, "tasks_validated": 0, "tasks_invalidated": 0,
                "default_editor": "ID", "mentions_notifications": True,
                "projects_comments_notifications": False, "projects_notifications": True,
                "tasks_notifications": True, "task_validation_notification": True,
                "task_invalidation_notification": True, "tasks_comments_notifications": False,
                "teams_announcement_notifications": True,
            }
        )
        
        # Setup test project
        await self.db.execute(
            "INSERT INTO projects (id, status, author_id) VALUES (:id, :status, :author_id)",
            {"id": 999, "status": 0, "author_id": 1}
        )

    async def teardown_method(self):
        # Cleanup
        await self.db.execute("DELETE FROM project_partnerships_history WHERE project_id = 999")
        await self.db.execute("DELETE FROM project_partnerships WHERE project_id = 999")
        await self.db.execute("DELETE FROM projects WHERE id = 999")
        await self.db.execute("DELETE FROM partners WHERE id = 999")

    async def test_create_partnership(self):
        """Test creating a project partnership."""
        partnership = ProjectPartnership(
            project_id=999,
            partner_id=999,
            started_on=datetime.now(timezone.utc)
        )
        partnership_id = await partnership.create(self.db)
        
        assert partnership_id is not None
        
        fetched = await ProjectPartnership.get_by_id(partnership_id, self.db)
        assert fetched is not None
        assert fetched["project_id"] == 999
        assert fetched["partner_id"] == 999

    async def test_save_partnership(self):
        """Test updating a project partnership."""
        partnership = ProjectPartnership(
            project_id=999,
            partner_id=999,
            started_on=datetime.now(timezone.utc)
        )
        partnership_id = await partnership.create(self.db)
        partnership.id = partnership_id
        
        # Update ended_on
        ended_on = datetime.now(timezone.utc)
        partnership.ended_on = ended_on
        await partnership.save(self.db)
        
        fetched = await ProjectPartnership.get_by_id(partnership_id, self.db)
        assert fetched["ended_on"] is not None

    async def test_delete_partnership(self):
        """Test deleting a project partnership."""
        partnership = ProjectPartnership(
            project_id=999,
            partner_id=999,
            started_on=datetime.now(timezone.utc)
        )
        partnership_id = await partnership.create(self.db)
        partnership.id = partnership_id
        
        await partnership.delete(self.db)
        
        fetched = await ProjectPartnership.get_by_id(partnership_id, self.db)
        assert fetched is None

    async def test_history_create(self):
        """Test creating a partnership history record."""
        history = ProjectPartnershipHistory(
            project_id=999,
            partner_id=999,
            action=1,
            started_on_new=datetime.now(timezone.utc)
        )
        history_id = await history.create(self.db)
        assert history_id is not None
