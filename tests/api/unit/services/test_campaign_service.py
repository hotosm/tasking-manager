import pytest
from backend.services.campaign_service import CampaignService, NotFound
from backend.models.dtos.campaign_dto import NewCampaignDTO, CampaignProjectDTO, CampaignDTO
from backend.services.organisation_service import OrganisationService
from tests.api.helpers.test_helpers import create_canned_campaign, create_canned_project

@pytest.mark.anyio
class TestCampaignService:
    @pytest.fixture(autouse=True)
    async def setup_test_data(self, db_connection_fixture, request):
        request.cls.db = db_connection_fixture
        
        # 1. Crear proyecto primero. 
        # Esto crea automáticamente los MappingLevels, el Usuario y la Organización (ID 23).
        proj, user, pid = await create_canned_project(self.db)
        request.cls.project_id = pid
        
        # 2. Recuperar la organización ya creada en lugar de intentar insertarla de nuevo
        # Evita el UniqueViolationError en organisations_pkey
        request.cls.test_org = await OrganisationService.get_organisation_by_id(23, self.db)
        
        # 3. Crear campaña base para las pruebas
        request.cls.campaign = await create_canned_campaign(self.db)

    async def test_get_campaign_by_name_returns_dto(self):
        """Valida la recuperación de campaña por nombre."""
        result = await CampaignService.get_campaign_by_name(self.campaign.name, self.db)
        assert result.id == self.campaign.id

    async def test_get_campaign_by_name_raises_not_found(self):
        with pytest.raises(NotFound):
            await CampaignService.get_campaign_by_name("NonExistent", self.db)

    async def test_create_campaign_with_organisations(self):
        """Valida la creación de campaña y su vinculación automática con organizaciones."""
        dto = NewCampaignDTO(
            name="New Unique Campaign",
            organisations=[23] # Usamos el ID de la organización creada en el setup
        )
        
        campaign_id = await CampaignService.create_campaign(dto, self.db)
        assert campaign_id is not None
        
        # Verificar vínculo con organización
        exists = await CampaignService.campaign_organisation_exists(campaign_id, 23, self.db)
        assert exists is True

    async def test_delete_campaign_removes_associations(self):
        """Valida que al borrar la campaña se limpien los vínculos con organizaciones."""
        await CampaignService.create_campaign_organisation(23, self.campaign.id, self.db)
        
        await CampaignService.delete_campaign(self.campaign.id, self.db)
        
        # Verificar que la asociación ya no existe
        count = await self.db.fetch_val(
            "SELECT COUNT(*) FROM campaign_organisations WHERE campaign_id = :id",
            {"id": self.campaign.id}
        )
        assert count == 0

    async def test_delete_project_campaign_raises_error_if_not_linked(self):
        """Valida que falle el intento de desvincular una campaña no asociada al proyecto."""
        # Aseguramos que NO esté vinculada primero
        await self.db.execute("DELETE FROM campaign_projects WHERE project_id = :pid", {"pid": self.project_id})
        
        with pytest.raises(NotFound, match="PROJECT_CAMPAIGN_NOT_FOUND"):
            await CampaignService.delete_project_campaign(self.project_id, self.campaign.id, self.db)

    async def test_create_campaign_project_happy_path(self):
        """Valida la vinculación manual de una campaña con un proyecto."""
        dto = CampaignProjectDTO(projectId=self.project_id, campaignId=self.campaign.id)
        
        await CampaignService.create_campaign_project(dto, self.db)
        
        # Verificar en DB
        count = await self.db.fetch_val(
            "SELECT COUNT(*) FROM campaign_projects WHERE project_id = :pid AND campaign_id = :cid",
            {"pid": self.project_id, "cid": self.campaign.id}
        )
        assert count == 1

    async def test_update_campaign_success(self):
        """Valida la actualización de los metadatos de la campaña."""
        update_dto = CampaignDTO(name="Updated Name", description="New Desc")
        
        await CampaignService.update_campaign(update_dto, self.campaign.id, self.db)
        
        updated = await CampaignService.get_campaign(self.campaign.id, self.db)
        assert updated.name == "Updated Name"
        assert updated.description == "New Desc"

    async def test_delete_organisation_campaign_raises_error_if_not_associated(self):
        """Valida que falle el intento de desvincular una campaña no asociada a la organización."""
        # Limpiar cualquier asociación previa accidental
        await self.db.execute("DELETE FROM campaign_organisations WHERE organisation_id = 23")
        
        with pytest.raises(NotFound, match="ORGANISATION_CAMPAIGN_NOT_FOUND"):
            await CampaignService.delete_organisation_campaign(23, self.campaign.id, self.db)
