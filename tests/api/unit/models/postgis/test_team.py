import pytest
from backend.models.postgis.team import Team, TeamMembers
from backend.models.postgis.organisation import Organisation
from backend.models.postgis.user import User

@pytest.mark.anyio
class TestTeam:
    @pytest.fixture(autouse=True)
    async def setup_db(self, db_connection_fixture, request):
        request.cls.db = db_connection_fixture
        
        # Setup organization
        await self.db.execute(
            "INSERT INTO organisations (id, name, slug, type) VALUES (:id, :name, :slug, :type)",
            {"id": 999, "name": "Test Org", "slug": "test-org", "type": 1}
        )
        
        # Setup user
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
            )
            """,
            {
                "id": 999, "username": "team_user", "mapping_level": 1, "role": 1,
                "tasks_mapped": 0, "tasks_validated": 0, "tasks_invalidated": 0,
                "default_editor": "ID", "mentions_notifications": True,
                "projects_comments_notifications": False, "projects_notifications": True,
                "tasks_notifications": True, "task_validation_notification": True,
                "task_invalidation_notification": True, "tasks_comments_notifications": False,
                "teams_announcement_notifications": True,
            }
        )

    async def teardown_method(self):
        # Cleanup
        await self.db.execute("DELETE FROM team_members WHERE user_id = 999")
        await self.db.execute("DELETE FROM teams WHERE name = 'Test Team'")
        await self.db.execute("DELETE FROM users WHERE id = 999")
        await self.db.execute("DELETE FROM organisations WHERE id = 999")

    async def test_create_team(self):
        """Test creating a team."""
        team = Team(
            organisation_id=999,
            name="Test Team",
            description="A test team",
            join_method=0,
            visibility=0
        )
        team_id = await team.create(self.db)
        
        assert team_id is not None
        
        fetched = await Team.get(team_id, self.db)
        assert fetched.name == "Test Team"
        assert fetched.organisation_id == 999

    async def test_team_members(self):
        """Test creating a team member."""
        team = Team(
            organisation_id=999,
            name="Test Team",
            description="A test team",
            join_method=0,
            visibility=0
        )
        team_id = await team.create(self.db)
        
        member = TeamMembers(
            team_id=team_id,
            user_id=999,
            function=1, # manager
            active=True
        )
        await member.create(self.db)
        
        fetched = await TeamMembers.get(team_id, 999, self.db)
        assert fetched is not None
        assert fetched["function"] == 1
        assert fetched["active"] is True
        
        # Update
        member.function = 2 # member
        await member.update(self.db)
        
        fetched_updated = await TeamMembers.get(team_id, 999, self.db)
        assert fetched_updated["function"] == 2
