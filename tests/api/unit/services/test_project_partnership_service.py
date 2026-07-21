import pytest
from datetime import datetime, timedelta
from backend.services.project_partnership_service import ProjectPartnershipService, NotFound, BadRequest
from tests.api.helpers.test_helpers import create_canned_project

@pytest.mark.anyio
class TestProjectPartnershipService:
    @pytest.fixture(autouse=True)
    async def setup_test_data(self, db_connection_fixture, request):
        request.cls.db = db_connection_fixture
        # Preparar proyecto y partner base
        proj, user, pid = await create_canned_project(self.db)
        request.cls.project_id = pid
        
        # Crear un partner manual para las pruebas
        await self.db.execute(
            "INSERT INTO partners (id, name, primary_hashtag) VALUES (10, 'Test Partner', '#test')",
        )
        request.cls.partner_id = 10

    async def test_get_partnership_raises_not_found(self):
        with pytest.raises(NotFound):
            await ProjectPartnershipService.get_partnership_as_dto(999, self.db)

    async def test_create_partnership_invalid_dates_raises_error(self):
        """Valida que la fecha de inicio no puede ser posterior a la de fin."""
        start = datetime.utcnow()
        end = start - timedelta(days=1)
        
        with pytest.raises(BadRequest, match="INVALID_TIME_RANGE"):
            await ProjectPartnershipService.create_partnership(
                self.db, self.project_id, self.partner_id, start, end
            )

    async def test_create_partnership_happy_path(self):
        """Valida la creación exitosa y el registro en el historial."""
        start = datetime.utcnow()
        
        partnership_id = await ProjectPartnershipService.create_partnership(
            self.db, self.project_id, self.partner_id, start, None
        )
        
        assert partnership_id is not None
        # Verificar historial (Action 0 = CREATE)
        history = await self.db.fetch_one(
            "SELECT action FROM project_partnerships_history WHERE partnership_id = :id",
            {"id": partnership_id}
        )
        assert history["action"] == 0

    async def test_update_partnership_time_range_success(self):
        """Valida la actualización de fechas y el registro del cambio."""
        start = datetime.utcnow()
        pid = await ProjectPartnershipService.create_partnership(
            self.db, self.project_id, self.partner_id, start, None
        )
        
        new_end = start + timedelta(days=10)
        await ProjectPartnershipService.update_partnership_time_range(
            self.db, pid, start, new_end
        )
        
        updated = await ProjectPartnershipService.get_partnership_as_dto(pid, self.db)
        assert updated.ended_on is not None
        # Verificar historial de actualización (Action 2 = UPDATE)
        history = await self.db.fetch_val(
            "SELECT COUNT(*) FROM project_partnerships_history WHERE partnership_id = :id AND action = 2",
            {"id": pid}
        )
        assert history == 1

    async def test_delete_partnership_cleanup(self):
        """Valida el borrado lógico/histórico y físico del vínculo."""
        start = datetime.utcnow()
        pid = await ProjectPartnershipService.create_partnership(
            self.db, self.project_id, self.partner_id, start, None
        )
        
        await ProjectPartnershipService.delete_partnership(pid, self.db)
        
        # Verificar que ya no existe el vínculo
        with pytest.raises(NotFound):
            await ProjectPartnershipService.get_partnership_as_dto(pid, self.db)
            
        # Verificar historial de borrado (Action 1 = DELETE)
        del_history = await self.db.fetch_one(
            "SELECT action FROM project_partnerships_history WHERE project_id = :pid AND partner_id = :ptid ORDER BY id DESC",
            {"pid": self.project_id, "ptid": self.partner_id}
        )
        assert del_history["action"] == 1

    async def test_get_partnerships_by_project_returns_list(self):
        """Valida la recuperación de todos los partners de un proyecto."""
        await ProjectPartnershipService.create_partnership(
            self.db, self.project_id, self.partner_id, datetime.utcnow(), None
        )
        
        results = await ProjectPartnershipService.get_partnerships_by_project(self.project_id, self.db)
        assert len(results) == 1
        assert results[0].partner_id == self.partner_id
