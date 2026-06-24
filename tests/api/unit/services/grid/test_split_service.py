import pytest
from backend.services.grid.split_service import SplitService, SplitServiceError
from backend.models.postgis.statuses import TaskStatus
from backend.models.dtos.grid_dto import SplitTaskDTO
from tests.api.helpers.test_helpers import create_canned_project

@pytest.mark.anyio
class TestSplitService:
    @pytest.fixture(autouse=True)
    async def setup_test_data(self, db_connection_fixture, request):
        request.cls.db = db_connection_fixture
        # Crear proyecto base para las pruebas de división
        proj, user, pid = await create_canned_project(self.db)
        request.cls.test_project = proj
        request.cls.test_user = user
        request.cls.project_id = pid

    async def test_split_task_raises_error_if_not_locked(self):
        """Valida que no se puede dividir una tarea que no esté bloqueada para mapeo."""
        # Tarea 2 en create_canned_project está READY (0)
        dto = SplitTaskDTO(userId=self.test_user.id, projectId=self.project_id, taskId=2)
        
        with pytest.raises(SplitServiceError, match="LockToSplit"):
            await SplitService.split_task(dto, self.db)

    async def test_split_task_raises_error_if_owned_by_another_user(self):
        """Valida que un usuario no puede dividir la tarea bloqueada por otro."""
        # Bloquear tarea 2 para un usuario ficticio
        await self.db.execute(
            "UPDATE tasks SET task_status = 1, locked_by = 999 WHERE id = 2 AND project_id = :pid",
            {"pid": self.project_id}
        )
        dto = SplitTaskDTO(userId=self.test_user.id, projectId=self.project_id, taskId=2)
        
        with pytest.raises(SplitServiceError, match="SplitOtherUserTask"):
            await SplitService.split_task(dto, self.db)

    async def test_split_task_raises_error_if_too_small(self):
        """Valida la restricción de tamaño mínimo para división (zoom >= 18)."""
        # Tarea 1 está MAPPED, la bloqueamos y subimos el zoom a 18
        await self.db.execute(
            "UPDATE tasks SET task_status = 1, locked_by = :uid, zoom = 18 WHERE id = 1 AND project_id = :pid",
            {"uid": self.test_user.id, "pid": self.project_id}
        )
        dto = SplitTaskDTO(userId=self.test_user.id, projectId=self.project_id, taskId=1)
        
        with pytest.raises(SplitServiceError, match="SmallToSplit"):
            await SplitService.split_task(dto, self.db)

    async def test_delete_task_and_related_records_cleanup(self):
        """Valida que la eliminación de una tarea limpie el historial y mensajes relacionados."""
        # Insertar mensaje ficticio para la tarea 1
        await self.db.execute(
            "INSERT INTO messages (message, subject, to_user_id, project_id, task_id) VALUES ('msg', 'sub', :uid, :pid, 1)",
            {"uid": self.test_user.id, "pid": self.project_id}
        )
        
        await SplitService.delete_task_and_related_records(1, self.project_id, self.db)
        
        # Verificar limpieza
        msg_count = await self.db.fetch_val("SELECT COUNT(*) FROM messages WHERE task_id = 1 AND project_id = :pid", {"pid": self.project_id})
        task_exists = await self.db.fetch_val("SELECT COUNT(*) FROM tasks WHERE id = 1 AND project_id = :pid", {"pid": self.project_id})
        assert msg_count == 0
        assert task_exists == 0

    async def test_split_square_task_happy_path(self):
        """Valida la división exitosa de una tarea cuadrada (OSM Tile)."""
        # Preparar tarea 1 (cuadrada en create_canned_project)
        await self.db.execute(
            "UPDATE tasks SET task_status = 1, locked_by = :uid, x=1, y=1, zoom=15 WHERE id = 1 AND project_id = :pid",
            {"uid": self.test_user.id, "pid": self.project_id}
        )
        dto = SplitTaskDTO(userId=self.test_user.id, projectId=self.project_id, taskId=1)
        
        new_tasks = await SplitService.split_task(dto, self.db)
        
        # Una tarea se divide en 4
        assert len(new_tasks.tasks) == 4
        assert all(t.task_status == "READY" for t in new_tasks.tasks)
