import pytest
from datetime import datetime, timedelta

from backend.models.postgis.statuses import ProjectStatus, TeamVisibility
from backend.services.organisation_service import OrganisationService, NotFound

from tests.api.helpers.test_helpers import (
    add_manager_to_organisation,
    create_canned_organisation,
    TEST_ORGANISATION_ID,
    TEST_USER_ID,
    create_canned_project,
    create_canned_team,
    create_canned_user,
    return_canned_team,
)


@pytest.mark.anyio
class TestOrganisationService:
    @pytest.fixture(autouse=True)
    async def _setup(self, db_connection_fixture):
        self.db = db_connection_fixture
        # persisted organisation for each test
        self.test_org = await create_canned_organisation(self.db)

        self.org_record = await OrganisationService.get_organisation_by_id(
            self.test_org.id, self.db
        )

    async def test_is_user_an_org_manager_raises_error_if_organisation_not_found(self):
        with pytest.raises(NotFound):
            await OrganisationService.is_user_an_org_manager(
                TEST_ORGANISATION_ID, TEST_USER_ID, self.db
            )

    async def test_is_user_an_org_manager_returns_false_if_user_not_manager(self):
        test_user = await create_canned_user(self.db)
        is_org_manager = await OrganisationService.is_user_an_org_manager(
            self.test_org.id, test_user.id, self.db
        )
        assert not is_org_manager

    async def test_is_user_an_org_manager_returns_true_if_user_is_manager(self):
        test_user = await create_canned_user(self.db)

        # Add manager to the organisation (helper used as originally)
        # If helper is async, it will await here; if it's sync, remove await.
        await add_manager_to_organisation(self.org_record, test_user, self.db)

        is_org_manager = await OrganisationService.is_user_an_org_manager(
            self.test_org.id, test_user.id, self.db
        )
        assert is_org_manager

    async def test_get_organisations_as_dto(self):
        # omit managers + omit stats
        orgs_dto = await OrganisationService.get_organisations_as_dto(
            manager_user_id=None,
            authenticated_user_id=False,
            omit_managers=True,
            omit_stats=True,
            db=self.db,
        )
        assert len(orgs_dto.organisations) == 1
        assert orgs_dto.organisations[0].organisation_id == self.test_org.id
        assert orgs_dto.organisations[0].name == self.test_org.name
        assert orgs_dto.organisations[0].stats is None
        with pytest.raises(AttributeError):
            assert orgs_dto.organisations[0].managers

        # create a project attached to the organisation to populate stats
        test_project, test_author, test_project_id = await create_canned_project(
            self.db
        )

        # Calculate yesterday starting from UTC now
        yesterday = datetime.utcnow() - timedelta(days=1)
        # Stats returns for current year projects only.
        await self.db.execute(
            "UPDATE projects SET status = :status, created = :created_at WHERE id = :id",
            {
                "status": ProjectStatus.DRAFT.value,
                "id": int(test_project_id),
                "created_at": yesterday,
            },
        )
        # request stats enabled
        orgs_dto = await OrganisationService.get_organisations_as_dto(
            manager_user_id=None,
            authenticated_user_id=False,
            omit_managers=True,
            omit_stats=False,
            db=self.db,
        )
        # Now the projects stats should show draft=1
        assert orgs_dto.organisations[0].stats.projects.draft == 1
        assert orgs_dto.organisations[0].stats.projects.archived == 0
        assert orgs_dto.organisations[0].stats.projects.published == 0

        # Add a manager and request managers to be included
        await add_manager_to_organisation(self.org_record, test_author, self.db)

        orgs_dto = await OrganisationService.get_organisations_as_dto(
            manager_user_id=None,
            authenticated_user_id=True,
            omit_managers=False,
            omit_stats=True,
            db=self.db,
        )

        assert len(orgs_dto.organisations[0].managers) == 1
        assert orgs_dto.organisations[0].managers[0].username == test_author.username

    async def test_get_organisation_stats(self):
        # create a published project attached to the org
        test_project, _author, test_project_id = await create_canned_project(self.db)
        yesterday = datetime.utcnow() - timedelta(days=1)

        await self.db.execute(
            "UPDATE projects SET status = :status, created = :created_at WHERE id = :id",
            {
                "status": ProjectStatus.PUBLISHED.value,
                "id": int(test_project_id),
                "created_at": yesterday,
            },
        )

        org_stats = await OrganisationService.get_organisation_stats(
            self.test_org.id, db=self.db
        )
        assert org_stats.projects.published == 1
        assert org_stats.projects.draft == 0
        assert org_stats.projects.archived == 0
        assert org_stats.active_tasks.mapped == 1
        assert org_stats.active_tasks.ready == 1
        assert org_stats.active_tasks.badimagery == 1
        assert org_stats.active_tasks.validated == 1
        assert org_stats.active_tasks.invalidated == 0

        test_project.created = datetime.strptime("2018/07/06", "%Y/%m/%d")
        two_years_ago = datetime.utcnow() - timedelta(days=730)

        await self.db.execute(
            "UPDATE projects SET status = :status, created = :created_at WHERE id = :id",
            {
                "status": ProjectStatus.PUBLISHED.value,
                "id": int(test_project_id),
                "created_at": two_years_ago,
            },
        )

        org_stats = await OrganisationService.get_organisation_stats(
            self.test_org.id, self.db, datetime.today().strftime("%Y")
        )

        assert org_stats.projects.published == 0
        assert org_stats.projects.draft == 0
        assert org_stats.projects.archived == 0
        assert org_stats.active_tasks.mapped == 0
        assert org_stats.active_tasks.ready == 0
        assert org_stats.active_tasks.badimagery == 0
        assert org_stats.active_tasks.validated == 0
        assert org_stats.active_tasks.invalidated == 0

    def assert_org_dto(self, org_dto):
        assert org_dto.organisation_id == self.test_org.id
        assert org_dto.name == self.test_org.name
        assert org_dto.description is None
        assert org_dto.url is None

    async def test_get_organisation_dto(self):
        # Prepare a user and two teams (one public, one private)
        test_user = await create_canned_user(self.db)

        test_team_1 = await return_canned_team(
            name="test_team_1", org_name=self.test_org.name, db=self.db
        )
        test_team_1 = await create_canned_team(self.db, test_team_1)
        await self.db.execute(
            "UPDATE teams SET visibility = :visibility WHERE id = :id",
            {"visibility": TeamVisibility.PUBLIC.value, "id": int(test_team_1.id)},
        )

        test_team_2 = await return_canned_team(
            name="test_team_2", org_name=self.test_org.name, db=self.db
        )
        test_team_2 = await create_canned_team(self.db, test_team_2)
        await self.db.execute(
            "UPDATE teams SET visibility = :visibility WHERE id = :id",
            {"visibility": TeamVisibility.PRIVATE.value, "id": int(test_team_2.id)},
        )

        # valid org, non-manager user
        org_dto = await OrganisationService.get_organisation_dto(
            self.org_record, test_user.id, abbreviated=False, db=self.db
        )
        self.assert_org_dto(org_dto)
        assert not org_dto.is_manager
        assert len(org_dto.teams) == 1
        assert org_dto.teams[0].team_id == test_team_1.id

        # abbreviated=True hides teams
        org_dto = await OrganisationService.get_organisation_dto(
            self.org_record, test_user.id, abbreviated=True, db=self.db
        )
        assert org_dto.organisation_id == self.test_org.id
        assert org_dto.name == self.test_org.name
        assert org_dto.description is None
        assert org_dto.url is None
        assert not org_dto.is_manager
        assert org_dto.teams is None

        # Make user a manager and verify they see both teams
        await add_manager_to_organisation(self.org_record, test_user, self.db)

        org_dto = await OrganisationService.get_organisation_dto(
            self.org_record, test_user.id, abbreviated=False, db=self.db
        )
        self.assert_org_dto(org_dto)
        assert org_dto.is_manager
        assert len(org_dto.teams) == 2
        assert org_dto.teams[0].team_id == test_team_1.id
        assert org_dto.teams[1].team_id == test_team_2.id

        # user id 0 => non-manager view, public teams only
        org_dto = await OrganisationService.get_organisation_dto(
            self.org_record, 0, abbreviated=False, db=self.db
        )
        self.assert_org_dto(org_dto)
        assert not org_dto.is_manager
        assert len(org_dto.teams) == 1
        assert org_dto.teams[0].team_id == test_team_1.id

        # invalid org -> NotFound
        with pytest.raises(NotFound):
            await OrganisationService.get_organisation_dto(
                None, test_user.id, abbreviated=False, db=self.db
            )
