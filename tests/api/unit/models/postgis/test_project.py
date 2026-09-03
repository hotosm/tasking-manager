from unittest.mock import AsyncMock, patch

import pytest
from pg_nearest_city import Location

from backend.config import settings
from backend.exceptions import NotFound
from backend.models.dtos.project_dto import DraftProjectDTO
from backend.models.postgis.project import Project
from backend.models.postgis.project_info import ProjectInfo
from backend.services.organisation_service import OrganisationService
from tests.api.helpers.test_helpers import (
    create_canned_organisation,
    create_canned_project,
    create_canned_user,
    return_canned_draft_project_json,
)


@pytest.mark.anyio
class TestProject:
    @pytest.fixture(autouse=True)
    async def setup_test_data(self, db_connection_fixture, request):
        """Setup test database fixture."""
        assert db_connection_fixture is not None, "Database connection is not available"
        request.cls.db = db_connection_fixture

    async def test_clone_project_raises_error_if_project_not_found(self):
        """Test cloning a non-existent project raises NotFound error."""
        # Arrange
        Project.get = AsyncMock(return_value=None)

        # Act / Assert
        with pytest.raises(NotFound):
            await Project.clone(12, 777777, self.db, False, "OSM")

    async def test_clone_project_creates_copy_of_orig_project(self):
        """Test cloning a project creates an identical copy."""
        # Arrange
        orig_project, author, project_id = await create_canned_project(self.db)

        orig_project_info = await ProjectInfo.get_dto_for_locale(
            self.db, project_id, orig_project.default_locale
        )
        # Act
        new_proj = await Project.clone(project_id, author.id, self.db, False, "OSM")
        new_proj_info = await ProjectInfo.get_dto_for_locale(
            self.db, new_proj.id, new_proj.default_locale
        )

        # Assert
        assert new_proj is not None
        assert new_proj.author_id == orig_project.author_id
        assert new_proj_info.name == orig_project_info.name

    async def test_create_draft_project(self):
        """Test creating a draft project from a DTO."""
        # Arrange
        draft_project_dto = DraftProjectDTO(**return_canned_draft_project_json())
        test_user = await create_canned_user(self.db)
        test_org = await create_canned_organisation(self.db)
        org_record = await OrganisationService.get_organisation_by_id(
            test_org.id, self.db
        )
        draft_project_dto.user_id = test_user.id
        draft_project_dto.organisation = org_record
        draft_project = Project()
        # Act
        draft_project.create_draft_project(draft_project_dto)

    async def test_set_default_changeset_comment(self):
        """Test setting the default changeset comment."""
        # Arrange
        test_project = Project()
        expected_comment = settings.DEFAULT_CHANGESET_COMMENT
        expected_comment = f"{expected_comment}-{test_project.id}"
        # Act
        test_project.set_default_changeset_comment()
        # Assert
        assert test_project.changeset_comment == expected_comment

    async def test_set_country_info(self):
        """Test setting the country info for a project from the nearest city lookup."""
        # Arrange
        test_project, _author_id, project_id = await create_canned_project(self.db)
        mock_location = Location(
            city="London",
            country="GBR",
            lat=51.5,
            lon=-0.1,
            country_alpha3="GBR",
            country_name="United Kingdom",
        )
        with patch(
            "backend.models.postgis.project.AsyncNearestCity"
        ) as mock_geocoder_cls:
            mock_geocoder = mock_geocoder_cls.return_value
            mock_geocoder.__aenter__ = AsyncMock(return_value=mock_geocoder)
            mock_geocoder.__aexit__ = AsyncMock(return_value=False)
            mock_geocoder.query = AsyncMock(return_value=mock_location)
            # Act
            await test_project.set_country_info()
        # Assert
        assert test_project.country == ["United Kingdom"]

    async def test_set_country_info_leaves_country_unset_on_lookup_failure(self):
        """Test a failed nearest city lookup doesn't blow up project creation."""
        # Arrange
        test_project, _author_id, project_id = await create_canned_project(self.db)
        with patch(
            "backend.models.postgis.project.AsyncNearestCity"
        ) as mock_geocoder_cls:
            mock_geocoder = mock_geocoder_cls.return_value
            mock_geocoder.__aenter__ = AsyncMock(return_value=mock_geocoder)
            mock_geocoder.__aexit__ = AsyncMock(return_value=False)
            mock_geocoder.query = AsyncMock(side_effect=RuntimeError("db not ready"))
            # Act
            await test_project.set_country_info()
        # Assert
        assert not test_project.country
