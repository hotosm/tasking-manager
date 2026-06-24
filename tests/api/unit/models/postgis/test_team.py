import pytest
from backend.models.postgis.team import Team, TeamMembers
from tests.api.helpers.test_helpers import create_canned_organisation, create_canned_user

@pytest.mark.anyio
class TestTeam:
    @pytest.fixture(autouse=True)
    async def setup_db(self, db_connection_fixture, request):
        request.cls.db = db_connection_fixture
        
        # 1. Usar helpers para inicializar Niveles de Mapeo, Organización y Usuario
        # Esto soluciona los errores de FK y garantiza un entorno válido
        request.cls.test_org = await create_canned_organisation(self.db)
        request.cls.test_user = await create_canned_user(self.db)

    async def test_create_team(self):
        """Test creating a team."""
        team = Team(
            organisation_id=self.test_org.id,
            name="Test Team",
            description="A test team",
            join_method=0,
            visibility=0
        )
        team_id = await team.create(self.db)
        
        assert team_id is not None
        
        fetched = await Team.get(team_id, self.db)
        assert fetched.name == "Test Team"
        assert fetched.organisation_id == self.test_org.id

    async def test_team_members(self):
        """Test creating and updating a team member."""
        team = Team(
            organisation_id=self.test_org.id,
            name="Member Test Team",
            join_method=0,
            visibility=0
        )
        team_id = await team.create(self.db)
        
        member = TeamMembers(
            team_id=team_id,
            user_id=self.test_user.id,
            function=1, # manager
            active=True,
            # ESENCIAL: Inicializar explícitamente para evitar el NotNullViolation en el update()
            join_request_notifications=False 
        )
        await member.create(self.db)
        
        fetched = await TeamMembers.get(team_id, self.test_user.id, self.db)
        assert fetched is not None
        assert fetched["function"] == 1
        assert fetched["active"] is True
        
        # Update
        member.function = 2 # member
        await member.update(self.db)
        
        fetched_updated = await TeamMembers.get(team_id, self.test_user.id, self.db)
        assert fetched_updated["function"] == 2
