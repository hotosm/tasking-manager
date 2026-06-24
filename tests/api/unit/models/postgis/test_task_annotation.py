import pytest
import json
from backend.models.postgis.task_annotation import TaskAnnotation
from tests.api.helpers.test_helpers import create_canned_project

@pytest.mark.anyio
class TestTaskAnnotation:
    @pytest.fixture(autouse=True)
    async def setup_db(self, db_connection_fixture, request):
        request.cls.db = db_connection_fixture
        
        # 1. Helper para inicializar mapping_levels, user, organisation, project y 4 tasks
        # Esto garantiza que todas las FKs y geometrías sean válidas
        request.cls.project, request.cls.test_user, request.cls.project_id = await create_canned_project(self.db)
        # Usaremos la tarea con ID 1 generada por el helper
        request.cls.task_id = 1

    async def test_get_task_annotation(self):
        """Test retrieving a specific task annotation."""
        # Insertamos anotación mediante SQL para validar el método estático de recuperación
        await self.db.execute(
            """
            INSERT INTO task_annotations (task_id, project_id, annotation_type, properties, updated_timestamp)
            VALUES (:task_id, :project_id, :type, :props, CURRENT_TIMESTAMP)
            """,
            {
                "task_id": self.task_id,
                "project_id": self.project_id,
                "type": "ml_prediction",
                "props": json.dumps({"confidence": 0.95})
            }
        )
        
        record = await TaskAnnotation.get_task_annotation(self.task_id, self.project_id, "ml_prediction", self.db)
        
        assert record is not None
        assert record["annotation_type"] == "ml_prediction"
        # Validamos que el JSON se recupere correctamente
        props = record["properties"]
        if isinstance(props, str):
            props = json.loads(props)
        assert props["confidence"] == 0.95

    async def test_get_dto(self):
        """Test DTO conversion."""
        annotation = TaskAnnotation(
            task_id=self.task_id,
            project_id=self.project_id,
            annotation_type="ml_prediction",
            properties={"confidence": 0.95},
            annotation_source="AI",
            annotation_markdown="Predicted building"
        )
        dto = annotation.get_dto()
        
        assert dto.task_id == self.task_id
        assert dto.annotation_type == "ml_prediction"
        assert dto.annotation_source == "AI"
        assert dto.annotation_markdown == "Predicted building"

    async def test_get_task_annotations_by_project_id_type(self):
        """Test retrieving annotations by project and type."""
        await self.db.execute(
            """
            INSERT INTO task_annotations (task_id, project_id, annotation_type, properties, updated_timestamp)
            VALUES (:task_id, :project_id, :type, :props, CURRENT_TIMESTAMP)
            """,
            {
                "task_id": self.task_id,
                "project_id": self.project_id,
                "type": "ml_prediction",
                "props": json.dumps({"confidence": 0.95})
            }
        )
        
        dto = await TaskAnnotation.get_task_annotations_by_project_id_type(self.project_id, "ml_prediction", self.db)
        
        assert dto.project_id == self.project_id
        assert len(dto.tasks) == 1
        assert dto.tasks[0].task_id == self.task_id

    async def test_get_task_annotations_by_project_id(self):
        """Test retrieving all annotations for a project."""
        await self.db.execute(
            """
            INSERT INTO task_annotations (task_id, project_id, annotation_type, properties, updated_timestamp)
            VALUES (:task_id, :project_id, :type, :props, CURRENT_TIMESTAMP)
            """,
            {
                "task_id": self.task_id,
                "project_id": self.project_id,
                "type": "ml_prediction",
                "props": json.dumps({"confidence": 0.95})
            }
        )
        
        dto = await TaskAnnotation.get_task_annotations_by_project_id(self.project_id, self.db)
        
        assert dto.project_id == self.project_id
        assert len(dto.tasks) == 1
        assert dto.tasks[0].annotation_type == "ml_prediction"
