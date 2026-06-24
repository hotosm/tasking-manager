import pytest
from fastapi import HTTPException
from backend.services.interests_service import InterestService, NotFound
from backend.models.dtos.interests_dto import InterestDTO
from tests.api.helpers.test_helpers import create_canned_user, create_canned_project, create_canned_interest

@pytest.mark.anyio
class TestInterestService:
    @pytest.fixture(autouse=True)
    async def setup_test_data(self, db_connection_fixture, request):
        request.cls.db = db_connection_fixture
        request.cls.test_user = await create_canned_user(self.db)
        # Crear un interés base
        request.cls.interest = await create_canned_interest(self.db, interest_id=1, name="Test Interest")

    async def test_get_interest_raises_not_found(self):
        with pytest.raises(NotFound):
            await InterestService.get(999, self.db)

    async def test_update_interest_raises_not_found(self):
        dto = InterestDTO(name="Updated")
        with pytest.raises(NotFound):
            await InterestService.update(999, dto, self.db)

    async def test_delete_interest_associated_with_user_raises_error(self):
        """Valida que no se puede eliminar un interés si un usuario lo tiene asignado."""
        await self.db.execute(
            "INSERT INTO user_interests (user_id, interest_id) VALUES (:uid, :iid)",
            {"uid": self.test_user.id, "iid": self.interest.id}
        )
        
        with pytest.raises(HTTPException) as exc:
            await InterestService.delete(self.interest.id, self.db)
        assert "associated with a user" in exc.value.detail

    async def test_delete_interest_associated_with_project_raises_error(self):
        """Valida que no se puede eliminar un interés si un proyecto lo tiene asignado."""
        proj, user, project_id = await create_canned_project(self.db)
        await self.db.execute(
            "INSERT INTO project_interests (project_id, interest_id) VALUES (:pid, :iid)",
            {"pid": project_id, "iid": self.interest.id}
        )
        
        with pytest.raises(HTTPException) as exc:
            await InterestService.delete(self.interest.id, self.db)
        assert "associated with a project" in exc.value.detail

    async def test_create_or_update_user_interests_syncs_correctly(self):
        """Valida la sincronización de intereses de un usuario (borrado e inserción)."""
        int2 = await create_canned_interest(self.db, interest_id=2, name="Second")
        
        # Act
        await InterestService.create_or_update_user_interests(self.test_user.id, [2], self.db)
        
        # Assert
        result = await InterestService.get_user_interests(self.test_user.id, self.db)
        assert len(result.interests) == 1
        assert result.interests[0].name == "Second"

    async def test_compute_contributions_rate_empty_history(self):
        """Valida que el cálculo de tasa retorne lista vacía si el usuario no tiene historial."""
        res = await InterestService.compute_contributions_rate(self.test_user.id, self.db)
        assert len(res.rates) == 0

    async def test_compute_contributions_rate_with_history(self):
        """Valida el cálculo de tasa de contribución basada en intereses de proyectos mapeados."""
        proj, user, project_id = await create_canned_project(self.db)
        # Vincular proyecto con el interés
        await self.db.execute(
            "INSERT INTO project_interests (project_id, interest_id) VALUES (:pid, :iid)",
            {"pid": project_id, "iid": self.interest.id}
        )
        # Insertar historial de mapeo para el usuario en ese proyecto
        await self.db.execute(
            "INSERT INTO task_history (project_id, task_id, user_id, action) VALUES (:pid, 1, :uid, 'STATE_CHANGE')",
            {"pid": project_id, "uid": self.test_user.id}
        )
        
        res = await InterestService.compute_contributions_rate(self.test_user.id, self.db)
        assert len(res.rates) == 1
        assert res.rates[0].name == "Test Interest"
        assert res.rates[0].rate == 1.0
