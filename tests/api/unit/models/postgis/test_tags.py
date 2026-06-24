import pytest
from backend.models.postgis.tags import Tags

@pytest.mark.anyio
class TestTags:
    @pytest.fixture(autouse=True)
    async def setup_test_data(self, db_connection_fixture, request):
        request.cls.db = db_connection_fixture

    async def test_upsert_organisation_tag_creates_new_tag(self):
        """Validar que se crea una etiqueta si no existe."""
        tag_name = "HOT-OSM"
        
        # Act
        result = await Tags.upsert_organisation_tag(tag_name, self.db)
        
        # Assert
        assert result == tag_name
        query = "SELECT organisations FROM tags WHERE organisations = :tag"
        db_tag = await self.db.fetch_one(query, {"tag": tag_name})
        assert db_tag["organisations"] == tag_name

    async def test_upsert_organisation_tag_returns_existing_tag(self):
        """Validar que no se duplican etiquetas existentes."""
        tag_name = "Red Cross"
        await self.db.execute("INSERT INTO tags (organisations) VALUES (:tag)", {"tag": tag_name})
        
        # Act
        result = await Tags.upsert_organisation_tag(tag_name, self.db)
        
        # Assert
        assert result == tag_name
        count = await self.db.fetch_val("SELECT COUNT(*) FROM tags WHERE organisations = :tag", {"tag": tag_name})
        assert count == 1

    async def test_get_all_organisations_returns_only_org_tags(self):
        """Validar que solo se listan etiquetas de organización."""
        await self.db.execute("INSERT INTO tags (organisations) VALUES ('Org1')")
        await self.db.execute("INSERT INTO tags (campaigns) VALUES ('Camp1')")
        
        # Act
        dto = await Tags.get_all_organisations(self.db)
        
        # Assert
        assert "Org1" in dto.tags
        assert "Camp1" not in dto.tags

    async def test_upsert_campaign_tag_creates_new_tag(self):
        """Validar la creación de etiquetas de campaña."""
        tag_name = "Malaria Elimination"
        
        # Act
        result = await Tags.upsert_campaign_tag(tag_name, self.db)
        
        # Assert
        assert result == tag_name
        db_tag = await self.db.fetch_one("SELECT campaigns FROM tags WHERE campaigns = :tag", {"tag": tag_name})
        assert db_tag["campaigns"] == tag_name
