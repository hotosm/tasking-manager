import pytest
from datetime import datetime, timezone
from backend.models.postgis.project_partner import ProjectPartnership, ProjectPartnershipHistory
from tests.api.helpers.test_helpers import create_canned_project

@pytest.mark.anyio
class TestProjectPartnership:
    @pytest.fixture(autouse=True)
    async def setup_db(self, db_connection_fixture, request):
        request.cls.db = db_connection_fixture
        
        # 1. Usar helper para crear Proyecto, Usuario (autor) y Niveles de Mapeo
        # Esto soluciona el ForeignKeyViolationError y los errores de geometría
        request.cls.test_project, request.cls.test_user, request.cls.project_id = await create_canned_project(self.db)
        
        # 2. Setup test partner manual (es una tabla simple sin dependencias complejas)
        partner_query = """
            INSERT INTO partners (name, primary_hashtag) 
            VALUES (:name, :hashtag) 
            RETURNING id
        """
        partner_id = await self.db.fetch_val(
            partner_query, 
            {"name": "Test Partner", "hashtag": "#test"}
        )
        request.cls.partner_id = partner_id

    async def test_create_partnership(self):
        """Test creating a project partnership."""
        partnership = ProjectPartnership(
            project_id=self.project_id,
            partner_id=self.partner_id,
            started_on=datetime.now(timezone.utc)
        )
        partnership_id = await partnership.create(self.db)
        
        assert partnership_id is not None
        
        fetched = await ProjectPartnership.get_by_id(partnership_id, self.db)
        assert fetched is not None
        assert fetched["project_id"] == self.project_id
        assert fetched["partner_id"] == self.partner_id

    async def test_save_partnership(self):
        """Test updating a project partnership."""
        partnership_obj = ProjectPartnership(
            project_id=self.project_id,
            partner_id=self.partner_id,
            started_on=datetime.now(timezone.utc)
        )
        partnership_id = await partnership_obj.create(self.db)
        
        # Creamos una instancia nueva simulando la carga desde DB
        partnership = ProjectPartnership()
        partnership.id = partnership_id
        partnership.project_id = self.project_id
        partnership.partner_id = self.partner_id
        partnership.started_on = partnership_obj.started_on
        
        # Update ended_on
        ended_on = datetime.now(timezone.utc)
        partnership.ended_on = ended_on
        await partnership.save(self.db)
        
        fetched = await ProjectPartnership.get_by_id(partnership_id, self.db)
        assert fetched["ended_on"] is not None

    async def test_delete_partnership(self):
        """Test deleting a project partnership."""
        partnership_obj = ProjectPartnership(
            project_id=self.project_id,
            partner_id=self.partner_id,
            started_on=datetime.now(timezone.utc)
        )
        partnership_id = await partnership_obj.create(self.db)
        
        partnership = ProjectPartnership()
        partnership.id = partnership_id
        
        await partnership.delete(self.db)
        
        fetched = await ProjectPartnership.get_by_id(partnership_id, self.db)
        assert fetched is None

    async def test_history_create(self):
        """Test creating a partnership history record."""
        # El modelo ProjectPartnershipHistory requiere un partnership_id válido
        partnership = ProjectPartnership(
            project_id=self.project_id,
            partner_id=self.partner_id,
            started_on=datetime.now(timezone.utc)
        )
        partnership_id = await partnership.create(self.db)

        history = ProjectPartnershipHistory()
        history.project_id = self.project_id
        history.partner_id = self.partner_id
        history.partnership_id = partnership_id
        history.action = 0 # CREATE
        history.started_on_new = datetime.now(timezone.utc)
        
        history_id = await history.create(self.db)
        assert history_id is not None
