from unittest.mock import AsyncMock

import pytest
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
        """Test setting the country info for a project."""
        # Arrange
        test_project, _author_id, project_id = await create_canned_project(self.db)
        # Act
        test_project.set_country_info()
        # Assert
        assert test_project.country is not None
        assert len(test_project.country) > 0, "Nominatim may have given a bad response"
        assert test_project.country == ["United Kingdom"]


    async def test_exists_raises_not_found_if_invalid_id(self):
        """Valida que exists lance NotFound si el ID no existe."""
        with pytest.raises(NotFound):
            await Project.exists(999999, self.db)

    async def test_favorite_lifecycle(self):
        """Valida el ciclo de vida de marcar un proyecto como favorito."""
        project, author, project_id = await create_canned_project(self.db)
        
        # 1. Marcar como favorito
        await Project.favorite(project_id, author.id, self.db)
        assert await Project.is_favorited(project_id, author.id, self.db) is True
        
        # 2. Quitar de favoritos
        await Project.unfavorite(project_id, author.id, self.db)
        assert await Project.is_favorited(project_id, author.id, self.db) is False

    async def test_set_as_featured_lifecycle(self):
        """Valida la lógica de destacar proyectos y errores de duplicidad."""
        project, author, project_id = await create_canned_project(self.db)
        project_obj = await Project.get(project_id, self.db)
        
        # 1. Destacar
        await project_obj.set_as_featured(self.db)
        updated = await Project.get(project_id, self.db)
        assert updated.featured is True
        
        # 2. Error al destacar proyecto ya destacado
        with pytest.raises(ValueError, match="AlreadyFeatured"):
            await updated.set_as_featured(self.db)
            
        # 3. Quitar destacado
        await updated.unset_as_featured(self.db)
        assert (await Project.get(project_id, self.db)).featured is False

    async def test_calculate_tasks_percent_completion_logic(self):
        """Valida específicamente el cálculo de completitud del proyecto (puntos x2)."""
        # 10 tareas totales. 2 mapeadas, 4 validadas. 0 bad imagery.
        # Puntos: (2 + (4*2)) = 10. Total posible: (10*2) = 20. Resultado: 50%
        res = Project.calculate_tasks_percent("project_completion", 2, 4, 10, 0)
        assert res == 50

    async def test_get_all_countries_returns_unique_tags(self):
        """Valida que se recuperen etiquetas de países de forma única y ordenada."""
        project, author, project_id = await create_canned_project(self.db)
        await self.db.execute(
            "UPDATE projects SET country = :countries WHERE id = :id",
            {"countries": ["Bolivia", "Peru"], "id": project_id}
        )
        
        dto = await Project.get_all_countries(self.db)
        assert "Bolivia" in dto.tags
        assert "Peru" in dto.tags

    async def test_get_project_total_contributions_excludes_comments(self):
        """Valida que el conteo de contribuciones ignore las acciones de tipo comentario."""
        project, author, project_id = await create_canned_project(self.db)
        
        # Acción válida (Mapeo)
        await self.db.execute(
            "INSERT INTO task_history (project_id, task_id, user_id, action, action_date) VALUES (:pid, 1, :uid, 'STATE_CHANGE')",
            {"pid": project_id, "uid": author.id}
        )
        # Acción inválida (Comentario) de otro usuario
        await self.db.execute(
            "INSERT INTO task_history (project_id, task_id, user_id, action, action_date) VALUES (:pid, 1, 999, 'COMMENT')",
            {"pid": project_id}
        )
        
        count = await Project.get_project_total_contributions(project_id, self.db)
        assert count == 1 # Solo el autor cuenta como contribuyente real

    async def test_clear_existing_priority_areas_removes_physical_records(self):
        """Valida la limpieza física de geometrías de prioridad al actualizar."""
        project, author, project_id = await create_canned_project(self.db)
        # Crear área de prioridad manual
        pa_id = await self.db.fetch_val("INSERT INTO priority_areas (geometry) \
            VALUES (ST_GeomFromText('POLYGON((0 0, 0 1, 1 1, 1 0, 0 0))', 4326)) RETURNING id")
        await self.db.execute("INSERT INTO project_priority_areas (project_id, priority_area_id) VALUES (:pid, :paid)",
            {"pid": project_id, "paid": pa_id})
            
        # Limpiar
        await Project.clear_existing_priority_areas(self.db, project_id)
        
        # Verificar que se borró el vínculo y el área física
        link_exists = await self.db.fetch_val("SELECT COUNT(*) FROM project_priority_areas WHERE project_id = :pid", {"pid": project_id})
        area_exists = await self.db.fetch_val("SELECT COUNT(*) FROM priority_areas WHERE id = :paid", {"paid": pa_id})
        assert link_exists == 0
        assert area_exists == 0
