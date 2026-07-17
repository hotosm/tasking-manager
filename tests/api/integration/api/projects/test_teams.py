import pytest
from httpx import AsyncClient

from backend.models.postgis.statuses import TeamMemberFunctions, TeamRoles
from backend.services.team_service import TeamService
from tests.api.helpers.test_helpers import (
    add_user_to_team,
    assign_team_to_project,
    create_canned_project,
    create_canned_team,
    create_canned_user,
    generate_encoded_token,
    return_canned_user,
)


@pytest.mark.anyio
class TestProjectTeamsAPI:
    @pytest.fixture(autouse=True)
    async def _setup(self, db_connection_fixture):
        self.db = db_connection_fixture

        # Proyecto base para asociarlo con equipos.
        self.test_project, self.test_author, self.test_project_id = (
            await create_canned_project(self.db)
        )

        # Equipo base para probar la relación proyecto-equipo.
        self.test_team = await create_canned_team(self.db)
        self.test_team_id = self.test_team.id

        # El autor también será manager del equipo para poder asignarlo.
        await add_user_to_team(
            self.test_team,
            self.test_author,
            TeamMemberFunctions.MANAGER.value,
            True,
            self.db,
        )
        
        self.author_token = generate_encoded_token(self.test_author.id)
        
        # Usuario normal para probar errores de permisos.
        self.test_user = await return_canned_user(
            self.db,
            username="project_team_regular_user",
            id=33333333,
        )
        self.test_user = await create_canned_user(self.db, self.test_user)
        self.user_token = generate_encoded_token(self.test_user.id)

    async def test_assign_team_to_project_returns_201(self, client: AsyncClient):
        # El autor del proyecto y manager del equipo puede asignarlo.
        response = await client.post(
            f"/api/v2/projects/{self.test_project_id}/teams/{self.test_team_id}/",
            json={"role": "MAPPER"},
            headers={"Authorization": f"Token {self.author_token}"},
        )

        assert response.status_code == 201
        assert response.json() == {
            "Success": (
                f"Team {self.test_team_id} assigned to project "
                f"{self.test_project_id} with role MAPPER"
            )
        }

    async def test_get_project_teams_returns_assigned_team(
        self, client: AsyncClient
    ):
        # Se crea una relación directa para validar el listado del endpoint.
        await assign_team_to_project(
            self.test_project_id,
            self.test_team_id,
            TeamRoles.MAPPER.value,
            self.db,
        )

        response = await client.get(
            f"/api/v2/projects/{self.test_project_id}/teams/",
            headers={"Authorization": f"Token {self.author_token}"},
        )

        assert response.status_code == 200

        body = response.json()
        assert len(body["teams"]) == 1
        assert body["teams"][0]["teamId"] == self.test_team_id

    async def test_patch_project_team_updates_role(self, client: AsyncClient):
        # Primero se asigna el equipo y luego se cambia su rol en el proyecto.
        await assign_team_to_project(
            self.test_project_id,
            self.test_team_id,
            TeamRoles.MAPPER.value,
            self.db,
        )

        response = await client.patch(
            f"/api/v2/projects/{self.test_team_id}/projects/{self.test_project_id}/",
            json={"role": "VALIDATOR"},
            headers={"Authorization": f"Token {self.author_token}"},
        )

        assert response.status_code == 201
        assert response.json() == {"Status": "Team role updated successfully."}

        teams_dto = await TeamService.get_project_teams_as_dto(
            self.test_project_id,
            self.db,
        )

        assert len(teams_dto.teams) == 1
        assert teams_dto.teams[0].team_id == self.test_team_id
        assert teams_dto.teams[0].role == str(TeamRoles.VALIDATOR.value)

    async def test_delete_project_team_removes_assignment(
        self, client: AsyncClient
    ):
        # Se elimina la relación y se verifica que el proyecto quede sin equipos.
        await assign_team_to_project(
            self.test_project_id,
            self.test_team_id,
            TeamRoles.MAPPER.value,
            self.db,
        )

        response = await client.delete(
            f"/api/v2/projects/{self.test_team_id}/projects/{self.test_project_id}/",
            headers={"Authorization": f"Token {self.author_token}"},
        )

        assert response.status_code == 200
        assert response.json() == {"Success": True}

        teams_dto = await TeamService.get_project_teams_as_dto(
            self.test_project_id,
            self.db,
        )

        assert teams_dto.teams == []

    async def test_get_project_teams_returns_403_if_not_logged_in(
        self, client: AsyncClient
    ):
        # Sin token no se puede consultar los equipos del proyecto.
        response = await client.get(
            f"/api/v2/projects/{self.test_project_id}/teams/"
        )

        assert response.status_code == 403

    async def test_assign_team_to_project_returns_403_if_not_logged_in(
        self, client: AsyncClient
    ):
        # Sin autenticación no se debe permitir asignar equipos.
        response = await client.post(
            f"/api/v2/projects/{self.test_project_id}/teams/{self.test_team_id}/",
            json={"role": "MAPPER"},
        )

        assert response.status_code == 403

    async def test_assign_team_to_project_returns_403_if_user_is_not_project_manager(
        self, client: AsyncClient
    ):
        # El usuario normal no tiene permisos sobre el proyecto.
        response = await client.post(
            f"/api/v2/projects/{self.test_project_id}/teams/{self.test_team_id}/",
            json={"role": "MAPPER"},
            headers={"Authorization": f"Token {self.user_token}"},
        )

        assert response.status_code == 403
        assert response.json()["SubCode"] == "UserPermissionError"

    async def test_delete_project_team_returns_404_if_team_is_not_linked(
        self, client: AsyncClient
    ):
        # No se puede quitar un equipo que nunca fue asociado al proyecto.
        response = await client.delete(
            f"/api/v2/projects/{self.test_team_id}/projects/{self.test_project_id}/",
            headers={"Authorization": f"Token {self.author_token}"},
        )

        assert response.status_code == 404

    async def test_delete_project_team_returns_404_if_project_does_not_exist(
        self, client: AsyncClient
    ):
        # Valida el error cuando se intenta modificar un proyecto inexistente.
        response = await client.delete(
            f"/api/v2/projects/{self.test_team_id}/projects/999999/",
            headers={"Authorization": f"Token {self.author_token}"},
        )

        assert response.status_code == 404