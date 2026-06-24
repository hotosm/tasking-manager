import pytest
from backend.models.postgis.team import Team, TeamMembers
from backend.models.postgis.statuses import TeamMemberFunctions, TeamJoinMethod, TeamVisibility
from backend.models.dtos.team_dto import TeamDTO, TeamMembersDTO
from backend.exceptions import NotFound
from tests.api.helpers.test_helpers import create_canned_team, create_canned_user, create_canned_project

@pytest.mark.anyio
class TestTeam:
    @pytest.fixture(autouse=True)
    async def setup_test_data(self, db_connection_fixture, request):
        request.cls.db = db_connection_fixture
        request.cls.test_user = await create_canned_user(self.db)
        request.cls.test_team = await create_canned_team(self.db)

    async def test_get_team_by_name_returns_team(self):
        """Valida la recuperación de un equipo por su nombre único."""
        team = await Team.get_team_by_name(self.test_team.name, self.db)
        assert team is not None
        assert team["id"] == self.test_team.id

    async def test_can_be_deleted_returns_true_if_no_projects(self):
        """Valida que un equipo sin proyectos asociados puede ser eliminado."""
        assert await Team.can_be_deleted(self.test_team.id, self.db) is True

    async def test_can_be_deleted_returns_false_if_associated_with_project(self):
        """Valida que un equipo vinculado a un proyecto no puede ser eliminado."""
        proj, user, project_id = await create_canned_project(self.db)
        await self.db.execute(
            "INSERT INTO project_teams (project_id, team_id, role) VALUES (:pid, :tid, 0)",
            {"pid": project_id, "tid": self.test_team.id}
        )
        assert await Team.can_be_deleted(self.test_team.id, self.db) is False

    async def test_delete_team_removes_members_and_team(self):
        """Valida la eliminación física del equipo y sus relaciones de membresía."""
        # Agregar un miembro
        await self.db.execute(
            "INSERT INTO team_members (team_id, user_id, function, active, join_request_notifications) VALUES (:tid, :uid, 2, true)",
            {"tid": self.test_team.id, "uid": self.test_user.id}
        )
        
        team_obj = await Team.get(self.test_team.id, self.db)
        # El modelo requiere el objeto cargado para el método de instancia delete
        # Nota: Team.get en team.py usa select(Team), implementamos la lógica de borrado directo
        await Team(**dict(team_obj)).delete(self.db)
        
        # Verificar que no existen miembros ni el equipo
        member_count = await self.db.fetch_val("SELECT COUNT(*) FROM team_members WHERE team_id = :id", {"id": self.test_team.id})
        team_exists = await self.db.fetch_val("SELECT COUNT(*) FROM teams WHERE id = :id", {"id": self.test_team.id})
        assert member_count == 0
        assert team_exists == 0

    async def test_get_members_count_by_role(self):
        """Valida el conteo correcto de miembros según su función (Manager vs Member)."""
        # Insertar un Manager
        await self.db.execute(
            "INSERT INTO team_members (team_id, user_id, function, active, join_request_notifications) VALUES (:tid, :uid, :func, true)",
            {"tid": self.test_team.id, "uid": self.test_user.id, "func": TeamMemberFunctions.MANAGER.value}
        )
        
        count = await Team.get_members_count_by_role(self.db, self.test_team.id, TeamMemberFunctions.MANAGER)
        assert count == 1
        
        count_members = await Team.get_members_count_by_role(self.db, self.test_team.id, TeamMemberFunctions.MEMBER)
        assert count_members == 0

    async def test_update_team_members_sync_logic(self):
        """Valida la sincronización de miembros: añade nuevos y elimina los que no están en el DTO."""
        # 1. Miembro actual
        await self.db.execute(
            "INSERT INTO team_members (team_id, user_id, function, active, join_request_notifications) VALUES (:tid, :uid, 2, true)",
            {"tid": self.test_team.id, "uid": self.test_user.id}
        )
        
        # 2. Preparar DTO con un miembro DIFERENTE (debe borrar al anterior y agregar al nuevo)
        new_user = await create_canned_user(self.db, id=999, username="new_member")
        member_dto = TeamMembersDTO(username=new_user.username, function="MEMBER", active=True)
        team_dto = TeamDTO(teamId=self.test_team.id, members=[member_dto])
        
        team_record = await Team.get(self.test_team.id, self.db)
        await Team.update_team_members(Team(**dict(team_record)), team_dto, self.db)
        
        # 3. Verificar
        old_member_exists = await self.db.fetch_val("SELECT COUNT(*) FROM team_members WHERE user_id = :id", {"id": self.test_user.id})
        new_member_exists = await self.db.fetch_val("SELECT COUNT(*) FROM team_members WHERE user_id = :id", {"id": new_user.id})
        assert old_member_exists == 0
        assert new_member_exists == 1
