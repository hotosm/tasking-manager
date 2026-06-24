import pytest
from backend.services.grid.split_service import SplitService, SplitServiceError
from backend.models.dtos.grid_dto import SplitTaskDTO
from tests.api.helpers.test_helpers import create_canned_project, create_canned_user, return_canned_user

@pytest.mark.anyio
class TestSplitService:
    @pytest.fixture(autouse=True)
    async def setup_test_data(self, db_connection_fixture, request):
        request.cls.db = db_connection_fixture
        # Inicializa entorno completo
        proj, user, pid = await create_canned_project(self.db)
        request.cls.test_user = user
        request.cls.project_id = pid

    async def test_split_task_raises_error_if_not_locked(self):
        """Valida que falle si la tarea no está bloqueada."""
        # Tarea 2 está READY (0) por defecto
        dto = SplitTaskDTO(userId=self.test_user.id, projectId=self.project_id, taskId=2)
        with pytest.raises(SplitServiceError, match="LockToSplit"):
            await SplitService.split_task(dto, self.db)

    async def test_split_task_raises_error_if_owned_by_another_user(self):
        """Valida protección de bloqueo contra otros usuarios."""
        # SOLUCIÓN: Crear al usuario 999 para cumplir con la FK
        other_user_obj = await return_canned_user(self.db, username="other", id=999)
        await create_canned_user(self.db, other_user_obj)
        
        await self.db.execute(
            "UPDATE tasks SET task_status = 1, locked_by = 999 WHERE id = 2 AND project_id = :pid",
            {"pid": self.project_id}
        )
        dto = SplitTaskDTO(userId=self.test_user.id, projectId=self.project_id, taskId=2)
        with pytest.raises(SplitServiceError, match="SplitOtherUserTask"):
            await SplitService.split_task(dto, self.db)

    async def test_split_task_raises_error_if_too_small(self):
        """Valida límite de profundidad de división (zoom 18)."""
        await self.db.execute(
            "UPDATE tasks SET task_status = 1, locked_by = :uid, zoom = 18 WHERE id = 1 AND project_id = :pid",
            {"uid": self.test_user.id, "pid": self.project_id}
        )
        dto = SplitTaskDTO(userId=self.test_user.id, projectId=self.project_id, taskId=1)
        with pytest.raises(SplitServiceError, match="SmallToSplit"):
            await SplitService.split_task(dto, self.db)

    async def test_split_task_geometric_branch_happy_path(self):
        """Valida división geométrica (cuando no es un Tile de OSM perfecto)."""
        # SOLUCIÓN: Ponemos x,y,zoom en NULL para disparar la división geométrica pura
        # Esto evita el SplitGeoJsonError de falta de intersección
        await self.db.execute(
            "UPDATE tasks SET task_status = 1, locked_by = :uid, x=NULL, y=NULL, zoom=NULL \
             WHERE id = 1 AND project_id = :pid",
            {"uid": self.test_user.id, "pid": self.project_id}
        )
        dto = SplitTaskDTO(userId=self.test_user.id, projectId=self.project_id, taskId=1)
        
        result = await SplitService.split_task(dto, self.db)
        
        assert len(result.tasks) == 4
        assert all(t.task_status == "READY" for t in result.tasks)
        # La tarea original (ID 1) debe haber sido eliminada
        task_1_exists = await self.db.fetch_val("SELECT COUNT(*) FROM tasks WHERE id = 1 AND project_id = :pid", {"pid": self.project_id})
        assert task_1_exists == 0

    async def test_delete_task_and_related_records_cleanup(self):
        """Valida limpieza profunda de tablas relacionadas al dividir."""
        # Insertar anotación y mensaje para validar cascada manual en el servicio
        await self.db.execute(
            "INSERT INTO task_annotations (task_id, project_id, annotation_type, properties, updated_timestamp) \
             VALUES (1, :pid, 'test', '{}', CURRENT_TIMESTAMP)", {"pid": self.project_id}
        )
        
        await SplitService.delete_task_and_related_records(1, self.project_id, self.db)
        
        # Validar que no queda rastro
        annot_count = await self.db.fetch_val("SELECT COUNT(*) FROM task_annotations WHERE task_id = 1")
        task_count = await self.db.fetch_val("SELECT COUNT(*) FROM tasks WHERE id = 1")
        assert annot_count == 0
        assert task_count == 0
