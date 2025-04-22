import pytest

from backend.models.dtos.banner_dto import BannerDTO
from backend.models.postgis.banner import Banner

TEST_USERNAME = "test_user"
TEST_USER_ID = 1


@pytest.mark.anyio
class TestBanner:
    @pytest.fixture(autouse=True)
    async def setup_test_data(self, db_connection_fixture, request):
        """Setup test user before each test."""
        assert db_connection_fixture is not None, "Database connection is not available"
        request.cls.db = db_connection_fixture
        request.cls.message = "Test message"
        request.cls.visible = True

    async def create_banner(self):
        banner = Banner()
        banner.message = self.message
        banner.visible = self.visible
        await banner.create(self.db)

    async def test_create_banner(self):
        """Test creating a banner."""
        await self.create_banner()

        banner = await Banner.get(self.db)

        assert banner is not None
        assert banner["message"] == "Test message"
        assert banner["visible"] is True

    async def test_get_banner_creates_one_if_none(self):
        """Test retrieving a banner."""

        fetched_banner = await Banner.get(self.db)

        assert fetched_banner is not None
        assert fetched_banner.message == "Welcome to the API"
        assert fetched_banner.visible is True

    async def test_update_banner_from_dto(self):
        """Test updating a banner using DTO."""
        banner = Banner(message="Old message", visible=False)
        await banner.create(self.db)

        banner_record = await Banner.get(self.db)
        banner = Banner(**banner_record)

        banner_dto = BannerDTO(message="Updated message", visible=True)
        await banner.update_from_dto(self.db, banner_dto)

        updated_banner = await Banner.get(self.db)

        assert updated_banner.message == "Updated message"
        assert updated_banner.visible is True

    async def test_to_html(self):
        """Test converting banner message to HTML."""
        banner = Banner(message="Test message", visible=True)
        await banner.create(self.db)
        banner_record = await Banner.get(self.db)
        banner = Banner(**banner_record)
        html = banner.to_html(f"### {banner.message}")
        assert html == "<h3>Test message</h3>"
