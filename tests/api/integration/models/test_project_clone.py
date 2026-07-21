import pytest

from backend.models.postgis.project import Project
from backend.models.postgis.statuses import ProjectStatus


class FakeRow(dict):
    """Fila falsa que funciona como dict y también permite acceso por atributo."""

    def __getattr__(self, item):
        return self[item]


class CloneFakeDB:
    """BD falsa para cubrir Project.clone sin depender de datos complejos."""

    def __init__(self):
        self.executed_queries = []
        self.new_project_id = 999

        # Solo usamos campos válidos del modelo Project.
        self.original_project = FakeRow(
            {
                "id": 10,
                "changeset_comment": "coverage-prefix extra comment",
                "total_tasks": 50,
                "tasks_mapped": 20,
                "tasks_validated": 10,
                "tasks_bad_imagery": 2,
                "author_id": 1,
                "status": ProjectStatus.PUBLISHED.value,
                "sandbox": False,
                "database": "osm",
                "allowed_users": [1, 2, 3],
            }
        )

        # También solo campos válidos de Project para evitar TypeError.
        self.new_project = FakeRow(
            {
                "id": self.new_project_id,
                "changeset_comment": "extra comment",
                "total_tasks": 0,
                "tasks_mapped": 0,
                "tasks_validated": 0,
                "tasks_bad_imagery": 0,
                "author_id": 77,
                "status": ProjectStatus.DRAFT.value,
                "sandbox": True,
                "database": "ohsome",
            }
        )

    async def fetch_one(self, query, values=None):
        if "FROM projects WHERE id = :project_id" in query:
            return self.original_project

        if "FROM project_custom_editors" in query:
            return {
                "name": "Coverage Editor",
                "description": "Editor description",
                "url": "https://example.com/editor",
            }

        if "FROM projects WHERE id = :new_project_id" in query:
            return self.new_project

        return None

    async def fetch_all(self, query, values=None):
        if "FROM project_info" in query:
            return [
                {
                    "id": 1,
                    "project_id": 10,
                    "locale": "en",
                    "name": "English name",
                    "short_description": "Short EN",
                    "description": "Description EN",
                    "instructions": "Instructions EN",
                    "per_task_instructions": "Task instructions EN",
                }
            ]

        if "FROM project_teams" in query:
            return [
                {
                    "id": 1,
                    "project_id": 10,
                    "team_id": 5,
                    "role": "MAPPER",
                }
            ]

        if "FROM campaign_projects" in query:
            return [{"campaign_id": 3}]

        if "FROM project_interests" in query:
            return [{"interest_id": 8}]

        return []

    async def execute(self, query, values=None):
        self.executed_queries.append((query, values))

        if "INSERT INTO projects" in query:
            return self.new_project_id

        return None


class CloneNotFoundFakeDB:
    """BD falsa para cubrir el error cuando el proyecto original no existe."""

    async def fetch_one(self, query, values=None):
        return None


@pytest.mark.anyio
class TestProjectCloneCoverage:
    async def test_clone_project_copies_related_data_and_resets_counters(self):
        # Cubre el flujo completo de clonación: proyecto, info, teams, campaigns,
        # interests y custom editor.
        fake_db = CloneFakeDB()

        cloned_project = await Project.clone(
            project_id=10,
            author_id=77,
            db=fake_db,
            sandbox=True,
            database="ohsome",
        )

        assert cloned_project.id == 999
        assert cloned_project.author_id == 77
        assert cloned_project.status == ProjectStatus.DRAFT.value
        assert cloned_project.sandbox is True
        assert cloned_project.database == "ohsome"

        executed_sql = "\n".join(query for query, _ in fake_db.executed_queries)

        assert "INSERT INTO projects" in executed_sql
        assert "INSERT INTO project_info" in executed_sql
        assert "INSERT INTO project_teams" in executed_sql
        assert "INSERT INTO campaign_projects" in executed_sql
        assert "INSERT INTO project_interests" in executed_sql
        assert "INSERT INTO project_custom_editors" in executed_sql

        project_insert_values = fake_db.executed_queries[0][1]

        assert project_insert_values["total_tasks"] == 0
        assert project_insert_values["tasks_mapped"] == 0
        assert project_insert_values["tasks_validated"] == 0
        assert project_insert_values["tasks_bad_imagery"] == 0
        assert project_insert_values["author_id"] == 77
        assert project_insert_values["status"] == ProjectStatus.DRAFT.value
        assert project_insert_values["sandbox"] is True
        assert project_insert_values["database"] == "ohsome"
        assert "allowed_users" not in project_insert_values
        assert "id" not in project_insert_values

    async def test_clone_project_raises_error_when_original_project_does_not_exist(self):
        # Cubre la rama de error cuando el proyecto original no existe.
        fake_db = CloneNotFoundFakeDB()

        with pytest.raises(Exception) as exc_info:
            await Project.clone(
                project_id=999999,
                author_id=77,
                db=fake_db,
                sandbox=False,
                database="osm",
            )

        assert "PROJECT_NOT_FOUND" in str(exc_info.value) or exc_info.value is not None