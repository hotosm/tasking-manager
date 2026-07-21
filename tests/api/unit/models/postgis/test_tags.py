import pytest
from backend.models.postgis.tags import Tags

@pytest.mark.anyio
class TestTags:
    @pytest.fixture(autouse=True)
    async def setup_db(self, db_connection_fixture, request):
        request.cls.db = db_connection_fixture

    async def teardown_method(self):
        # Cleanup
        await self.db.execute("DELETE FROM tags")

    async def test_upsert_organisation_tag(self):
        """Test inserting and retrieving an organisation tag."""
        # Insert
        tag1 = await Tags.upsert_organisation_tag("Org1", self.db)
        assert tag1 == "Org1"
        
        # Upsert (already exists)
        tag2 = await Tags.upsert_organisation_tag("Org1", self.db)
        assert tag2 == "Org1"
        
        # Check count
        result = await self.db.fetch_val("SELECT COUNT(*) FROM tags WHERE organisations = 'Org1'")
        assert result == 1

    async def test_upsert_campaign_tag(self):
        """Test inserting and retrieving a campaign tag."""
        # Insert
        tag1 = await Tags.upsert_campaign_tag("Camp1", self.db)
        assert tag1 == "Camp1"
        
        # Upsert
        tag2 = await Tags.upsert_campaign_tag("Camp1", self.db)
        assert tag2 == "Camp1"
        
        # Check count
        result = await self.db.fetch_val("SELECT COUNT(*) FROM tags WHERE campaigns = 'Camp1'")
        assert result == 1

    async def test_get_all_organisations(self):
        """Test retrieving all organisation tags."""
        await Tags.upsert_organisation_tag("Org1", self.db)
        await Tags.upsert_organisation_tag("Org2", self.db)
        
        dto = await Tags.get_all_organisations(self.db)
        
        assert "Org1" in dto.tags
        assert "Org2" in dto.tags
        assert len(dto.tags) == 2

    async def test_get_all_campaigns(self):
        """Test retrieving all campaign tags."""
        await Tags.upsert_campaign_tag("Camp1", self.db)
        await Tags.upsert_campaign_tag("Camp2", self.db)
        
        dto = await Tags.get_all_campaigns(self.db)
        
        assert "Camp1" in dto.tags
        assert "Camp2" in dto.tags
        assert len(dto.tags) == 2
