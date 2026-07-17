import pytest
from backend.models.postgis.statuses import UserRole
from backend.services.organisation_service import NotFound, OrganisationService
from tests.api.helpers.test_helpers import (
    create_canned_organisation,
    create_canned_user,
    return_canned_organisation,
    return_canned_user,
)


@pytest.mark.anyio
class TestOrganisationService:
    @pytest.fixture(autouse=True)
    async def setup_test_data(self, db_connection_fixture, request):
        assert db_connection_fixture is not None, "Database connection is not available"

        request.cls.test_org = await create_canned_organisation(db_connection_fixture)
        request.cls.test_user = await create_canned_user(db_connection_fixture)
        request.cls.db = db_connection_fixture

        assert self.test_org is not None, "Failed to create test organisation"
        assert self.test_user is not None, "Failed to create test user"

    async def test_get_organisation_by_id_returns_organisation(self):
        # Act
        result_org = await OrganisationService.get_organisation_by_id(
            self.test_org.id, self.db
        )
        # Assert
        assert self.test_org.id == result_org.organisation_id
        assert self.test_org.name == result_org.name
        assert self.test_org.slug == result_org.slug

    async def test_get_organisation_by_id_raises_error_if_organisation_not_found(self):
        # Act/Assert
        with pytest.raises(NotFound):
            await OrganisationService.get_organisation_by_id(123, self.db)

    async def test_organisation_managed_by_user_as_dto(self):
        # Arrange
        self.test_org.managers = [self.test_user]

        # Act
        organisations_dto = (
            await OrganisationService.get_organisations_managed_by_user_as_dto(
                self.test_user.id, self.db
            )
        )

        # Assert
        assert organisations_dto.organisations == []

    async def test_organisation_managed_by_user(self):
        # Assign the user as a manager
        await self.db.execute(
            """
            INSERT INTO organisation_managers (organisation_id, user_id)
            VALUES (:organisation_id, :user_id)
            """,
            {"organisation_id": self.test_org.id, "user_id": self.test_user.id},
        )

        # Act
        organisations = await OrganisationService.get_organisations_managed_by_user(
            self.test_user.id, self.db
        )

        # Assert
        assert self.test_org.name == organisations[0].name

    async def test_organisation_managed_by_user_returns_all_organisations_for_admin(
        self,
    ):
        # Arrange
        admin_user = await return_canned_user(self.db)
        admin_user.role = UserRole.ADMIN.value
        await self.db.execute(
            """
            UPDATE users SET role = :role WHERE id = :user_id
            """,
            {"role": admin_user.role, "user_id": admin_user.id},
        )

        # Act
        organisations = await OrganisationService.get_organisations_managed_by_user(
            admin_user.id, self.db
        )

        # Assert
        assert self.test_org.name == organisations[0].name

    async def test_get_organisation_by_slug_returns_dto(self):
        """Valida la recuperación de una organización mediante su slug."""
        dto = await OrganisationService.get_organisation_by_slug_as_dto(
            self.test_org.slug, self.test_user.id, True, self.db
        )
        assert dto.organisation_id == self.test_org.id
        assert dto.name == self.test_org.name

    async def test_get_organisation_by_slug_raises_not_found(self):
        """Valida que se lance NotFound si el slug no existe."""
        with pytest.raises(NotFound):
            await OrganisationService.get_organisation_by_slug_as_dto(
                "non-existent-slug", 0, True, self.db
            )

    async def test_assert_validate_name_raises_error_if_name_exists(self):
        """Valida que falle la validación si el nombre ya está tomado por otra organización."""
        # Intentar validar el nombre de la organización actual contra un nuevo nombre que ya existe
        other_org = return_canned_organisation(org_id=100, org_name="Other Org", org_slug="other")
        await create_canned_organisation(self.db, other_org)
        
        from backend.services.organisation_service import OrganisationServiceError
        with pytest.raises(OrganisationServiceError, match="NameExists"):
            await OrganisationService.assert_validate_name(self.test_org, "Other Org", self.db)

    async def test_delete_organisation_with_projects_fails(self):
        """Valida que no se permita borrar una organización que tiene proyectos vinculados."""
        from backend.services.organisation_service import OrganisationServiceError
        from tests.api.helpers.test_helpers import create_canned_project
        
        # Vincular un proyecto a la organización de prueba
        proj, user, project_id = await create_canned_project(self.db)
        await self.db.execute(
            "UPDATE projects SET organisation_id = :org_id WHERE id = :pid",
            {"org_id": self.test_org.id, "pid": project_id}
        )
        
        with pytest.raises(OrganisationServiceError, match="has projects"):
            await OrganisationService.delete_organisation(self.test_org.id, self.db)

    async def test_can_user_manage_organisation_false_for_non_manager(self):
        """Valida que un usuario común no tenga permisos de gestión sobre la organización."""
        other_user = await return_canned_user(self.db, username="other", id=888)
        await create_canned_user(self.db, other_user)
        res = await OrganisationService.can_user_manage_organisation(self.test_org.id, other_user.id, self.db)
        assert res is False

    async def test_get_organisation_stats_returns_dto_with_counts(self):
        """Valida la generación de estadísticas (conteo de proyectos por estado)."""
        from tests.api.helpers.test_helpers import create_canned_project
        from backend.models.postgis.statuses import ProjectStatus
        
        # Crear un proyecto publicado para esta organización
        proj, user, project_id = await create_canned_project(self.db)
        await self.db.execute(
            "UPDATE projects SET organisation_id = :org_id, status = :status WHERE id = :pid",
            {"org_id": self.test_org.id, "status": ProjectStatus.PUBLISHED.value, "pid": project_id}
        )
        
        stats = await OrganisationService.get_organisation_stats(self.test_org.id, self.db)
        
        assert stats.projects.published == 1
        assert stats.active_tasks is not None
        assert stats.active_tasks.ready >= 0
