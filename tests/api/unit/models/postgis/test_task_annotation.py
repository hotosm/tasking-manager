import pytest
import json
from backend.models.postgis.task_annotation import TaskAnnotation
from tests.api.helpers.test_helpers import create_canned_project

@pytest.mark.anyio
class TestTaskAnnotation:
    @pytest.fixture(autouse=True)
    async def setup_db(self, db_connection_fixture, request):
        request.cls.db = db_connection_fixture
        # Setup completo: MappingLevels, User, Org, Project, Tasks
        request.cls.project, request.cls.test_user, request.cls.project_id = await create_canned_project(self.db)
        request.cls.task_id = 1

    async def test_task_annotation_constructor(self):
        """Test el constructor __init__ del modelo para cobertura total."""
        annotation = TaskAnnotation(
            task_id=self.task_id,
            project_id=self.project_id,
            annotation_type="test_type",
            properties={"key": "value"},
            annotation_source="Manual",
            annotation_markdown="### Markdown"
        )
        assert annotation.task_id == self.task_id
        assert annotation.annotation_type == "test_type"
        assert annotation.properties["key"] == "value"

    async def test_get_task_annotation(self):
        """Test recuperando una anotación específica."""
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
        # Manejo de Record de asyncpg
        props = record["properties"]
        if isinstance(props, str): props = json.loads(props)
        assert props["confidence"] == 0.95

    async def test_get_dto(self):
        """Test conversión a DTO."""
        annotation = TaskAnnotation(
            task_id=self.task_id,
            project_id=self.project_id,
            annotation_type="ml_prediction",
            properties={"confidence": 0.95}
        )
        dto = annotation.get_dto()
        assert dto.task_id == self.task_id
        assert dto.properties["confidence"] == 0.95

    async def test_get_task_annotations_by_project_id_type(self):
        """Test recuperación por proyecto y tipo."""
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
        assert len(dto.tasks) == 1
        assert dto.tasks[0].task_id == self.task_id

    async def test_get_task_annotations_by_project_id(self):
        """Test recuperación de todas las anotaciones de un proyecto."""
        # Insertar anotación con todos los campos requeridos
        await self.db.execute(
            """
            INSERT INTO task_annotations (task_id, project_id, annotation_type, properties, annotation_markdown, updated_timestamp)
            VALUES (:task_id, :project_id, :type, :props, :md, CURRENT_TIMESTAMP)
            """,
            {
                "task_id": self.task_id, 
                "project_id": self.project_id,
                "type": "test_all", 
                "props": json.dumps({"data": 1}),
                "md": "some markdown"
            }
        )
        
        dto = await TaskAnnotation.get_task_annotations_by_project_id(self.project_id, self.db)
        
        assert len(dto.tasks) >= 1
        # El backend corregido ya devuelve un dict en properties, no hace falta json.loads aquí
        assert dto.tasks[0].properties["data"] == 1
        assert dto.tasks[0].annotation_markdown == "some markdown"
