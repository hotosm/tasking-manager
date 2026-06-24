import pytest
import json

from backend.models.postgis.task_annotation import TaskAnnotation
from backend.models.postgis.project import Project
from backend.models.postgis.task import Task
from backend.models.postgis.user import User

@pytest.mark.anyio
class TestTaskAnnotation:
    @pytest.fixture(autouse=True)
    async def setup_db(self, db_connection_fixture, request):
        request.cls.db = db_connection_fixture
        
        # Setup user
        await self.db.execute(
            """
            INSERT INTO users (
                id, username, mapping_level, role,
                tasks_mapped, tasks_validated, tasks_invalidated,
                default_editor, mentions_notifications,
                projects_comments_notifications, projects_notifications,
                tasks_notifications, task_validation_notification,
                task_invalidation_notification, tasks_comments_notifications,
                teams_announcement_notifications
            ) VALUES (
                :id, :username, :mapping_level, :role,
                :tasks_mapped, :tasks_validated, :tasks_invalidated,
                :default_editor, :mentions_notifications,
                :projects_comments_notifications, :projects_notifications,
                :tasks_notifications, :task_validation_notification,
                :task_invalidation_notification, :tasks_comments_notifications,
                :teams_announcement_notifications
            )
            """,
            {
                "id": 999, "username": "annotation_user", "mapping_level": 1, "role": 1,
                "tasks_mapped": 0, "tasks_validated": 0, "tasks_invalidated": 0,
                "default_editor": "ID", "mentions_notifications": True,
                "projects_comments_notifications": False, "projects_notifications": True,
                "tasks_notifications": True, "task_validation_notification": True,
                "task_invalidation_notification": True, "tasks_comments_notifications": False,
                "teams_announcement_notifications": True,
            }
        )
        
        # Setup project
        await self.db.execute(
            "INSERT INTO projects (id, status, author_id) VALUES (:id, :status, :author_id)",
            {"id": 999, "status": 0, "author_id": 999}
        )
        
        # Setup task
        # Bypassing the Task model methods since they might require more setup
        await self.db.execute(
            "INSERT INTO tasks (id, project_id, task_status) VALUES (:id, :project_id, :status)",
            {"id": 999, "project_id": 999, "status": 0}
        )

    async def teardown_method(self):
        # Cleanup
        await self.db.execute("DELETE FROM task_annotations WHERE project_id = 999")
        await self.db.execute("DELETE FROM tasks WHERE project_id = 999")
        await self.db.execute("DELETE FROM projects WHERE id = 999")
        await self.db.execute("DELETE FROM users WHERE id = 999")

    async def test_get_task_annotation(self):
        """Test retrieving a specific task annotation."""
        # Insert annotation
        await self.db.execute(
            """
            INSERT INTO task_annotations (task_id, project_id, annotation_type, properties)
            VALUES (:task_id, :project_id, :type, :props)
            """,
            {
                "task_id": 999,
                "project_id": 999,
                "type": "ml_prediction",
                "props": json.dumps({"confidence": 0.95})
            }
        )
        
        record = await TaskAnnotation.get_task_annotation(999, 999, "ml_prediction", self.db)
        
        assert record is not None
        assert record["annotation_type"] == "ml_prediction"
        assert record["properties"]["confidence"] == 0.95

    async def test_get_dto(self):
        """Test DTO conversion."""
        annotation = TaskAnnotation(
            task_id=999,
            project_id=999,
            annotation_type="ml_prediction",
            properties={"confidence": 0.95},
            annotation_source="AI",
            annotation_markdown="Predicted building"
        )
        dto = annotation.get_dto()
        
        assert dto.task_id == 999
        assert dto.annotation_type == "ml_prediction"
        assert dto.annotation_source == "AI"
        assert dto.annotation_markdown == "Predicted building"

    async def test_get_task_annotations_by_project_id_type(self):
        """Test retrieving annotations by project and type."""
        await self.db.execute(
            """
            INSERT INTO task_annotations (task_id, project_id, annotation_type, properties)
            VALUES (:task_id, :project_id, :type, :props)
            """,
            {
                "task_id": 999,
                "project_id": 999,
                "type": "ml_prediction",
                "props": json.dumps({"confidence": 0.95})
            }
        )
        
        dto = await TaskAnnotation.get_task_annotations_by_project_id_type(999, "ml_prediction", self.db)
        
        assert dto.project_id == 999
        assert len(dto.tasks) == 1
        assert dto.tasks[0].task_id == 999

    async def test_get_task_annotations_by_project_id(self):
        """Test retrieving all annotations for a project."""
        await self.db.execute(
            """
            INSERT INTO task_annotations (task_id, project_id, annotation_type, properties)
            VALUES (:task_id, :project_id, :type, :props)
            """,
            {
                "task_id": 999,
                "project_id": 999,
                "type": "ml_prediction",
                "props": json.dumps({"confidence": 0.95})
            }
        )
        
        dto = await TaskAnnotation.get_task_annotations_by_project_id(999, self.db)
        
        assert dto.project_id == 999
        assert len(dto.tasks) == 1
        assert dto.tasks[0].annotation_type == "ml_prediction"
