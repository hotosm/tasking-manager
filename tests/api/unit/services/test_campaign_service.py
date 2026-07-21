import pytest
import uuid
from unittest.mock import patch, MagicMock, AsyncMock
from backend.services.campaign_service import CampaignService, NotFound
from backend.models.dtos.campaign_dto import NewCampaignDTO, CampaignProjectDTO, CampaignDTO
from backend.models.dtos.message_dto import MessageDTO
from tests.api.helpers.test_helpers import create_canned_campaign, create_canned_organisation, create_canned_user, create_canned_project

@pytest.mark.anyio
class TestCampaignService:
    @pytest.fixture(autouse=True)
    async def setup_test_data(self, db_connection_fixture, request):
        request.cls.db = db_connection_fixture
        
        # 1. Setup de datos con helper oficial
        # Esto crea MappingLevels, Usuario y Org (ID 23)
        proj_obj, user_obj, project_id = await create_canned_project(self.db)
        request.cls.user = user_obj
        request.cls.project_id = project_id
        
        # 2. Campaña base para los tests
        request.cls.campaign = await create_canned_campaign(self.db)

    async def test_create_campaign_with_organisations(self):
        """Valida creación y vínculo con org usando nombre dinámico."""
        unique_name = f"Campaign-{uuid.uuid4()}"
        dto = NewCampaignDTO(
            name=unique_name,
            organisations=[23] # ID asegurado por create_canned_project
        )
        await self.db.execute("SELECT setval('campaigns_id_seq', (SELECT MAX(id) FROM campaigns))")
        
        campaign_id = await CampaignService.create_campaign(dto, self.db)
        assert campaign_id is not None
        
        exists = await CampaignService.campaign_organisation_exists(campaign_id, 23, self.db)
        assert exists is True

    @patch("backend.services.campaign_service.MessageService")
    @patch("backend.services.campaign_service.UserService")
    async def test_send_message_to_all_campaign_contributors(self, mock_user_service, mock_msg_service):
        """Test que valida el envío masivo usando AsyncMocks."""
        # SOLUCIÓN: Usar AsyncMock para funciones awaitables del backend
        mock_user_service.is_user_an_admin = AsyncMock(return_value=True)
        mock_user_service.get_user_by_id = AsyncMock(return_value=MagicMock(username="admin"))
        
        with patch("backend.services.campaign_service.db_connection.database.connection") as mock_conn:
            mock_conn.return_value.__aenter__.return_value = self.db
            
            # Vincular proyecto a la campaña para que existan contribuyentes
            await self.db.execute(
                "INSERT INTO campaign_projects (campaign_id, project_id) VALUES (:c, :p)",
                {"c": self.campaign.id, "p": self.project_id}
            )
            
            message_dto = MessageDTO(
                subject="Bulk Subject", 
                message="Bulk Message", 
                from_user_id=self.user.id 
            )
            
            await CampaignService.send_message_to_all_campaign_contributors(
                self.campaign.id, self.campaign.name, message_dto, self.user.id
            )
            
            # Ahora el mock debe haber sido llamado correctamente
            assert mock_msg_service._push_messages.called is True

    async def test_create_campaign_project_happy_path(self):
        # Asegurar snake_case para Pydantic v2
        dto = CampaignProjectDTO(project_id=self.project_id, campaign_id=self.campaign.id)
        await CampaignService.create_campaign_project(dto, self.db)
        
        count = await self.db.fetch_val(
            "SELECT COUNT(*) FROM campaign_projects WHERE project_id = :pid AND campaign_id = :cid",
            {"pid": self.project_id, "cid": self.campaign.id}
        )
        assert count == 1
