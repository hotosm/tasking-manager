import pytest
from datetime import datetime, timezone

from backend.models.postgis.release_version import ReleaseVersion

@pytest.mark.anyio
class TestReleaseVersion:
    @pytest.fixture(autouse=True)
    async def setup_db(self, db_connection_fixture, request):
        request.cls.db = db_connection_fixture

    async def teardown_method(self):
        # Cleanup
        await self.db.execute("DELETE FROM release_version")

    async def test_save_and_get(self):
        """Test saving and retrieving the release version."""
        now = datetime.now(timezone.utc).replace(tzinfo=None)
        release = ReleaseVersion(tag_name="v1.0.0", published_at=now)
        
        await release.save(self.db)
        
        fetched = await ReleaseVersion.get(self.db)
        
        assert fetched is not None
        assert fetched["tag_name"] == "v1.0.0"
        # We don't check exact time due to db truncation, just that it exists
        assert fetched["published_at"] is not None
