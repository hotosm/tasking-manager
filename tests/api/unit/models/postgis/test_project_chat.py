import pytest
from datetime import datetime, timezone

from backend.models.dtos.message_dto import ChatMessageDTO
from backend.models.postgis.project_chat import ProjectChat
from backend.models.postgis.project import Project
from backend.models.postgis.user import User

@pytest.mark.anyio
class TestProjectChat:
    @pytest.fixture(autouse=True)
    async def setup_db(self, db_connection_fixture, request):
        request.cls.db = db_connection_fixture
        
        # 1. Asegurar que exista el nivel de mapeo en 'mapping_levels' para evitar el ForeignKeyViolationError
        await self.db.execute(
            "INSERT INTO mapping_levels (level) VALUES (:level) ON CONFLICT DO NOTHING",
            {"level": 1}
        )
        
        # 2. Crear usuario usando el ORM para que herede todos los valores por defecto automáticamente
        user = User()
        user.id = 999
        user.username = "chat_user"
        user.mapping_level = 1
        user.role = 1
        user.tasks_mapped = 0
        user.tasks_validated = 0
        user.tasks_invalidated = 0
        user.default_editor = "iD Editor"
        
        # Obtenemos los campos y valores mapeados por SQLAlchemy para hacer el insert crudo de forma segura
        user_data = {c.key: getattr(user, c.key) for c in user.__table__.columns if getattr(user, c.key) is not None}
        
        columns = ", ".join(user_data.keys())
        placeholders = ", ".join([f":{key}" for key in user_data.keys()])
        
        await self.db.execute(
            f"INSERT INTO users ({columns}) VALUES ({placeholders})",
            user_data
        )
        
        # 3. Setup test project
        await self.db.execute(
            "INSERT INTO projects (id, status, author_id) VALUES (:id, :status, :author_id)",
            {"id": 999, "status": 0, "author_id": 999}
        )

    async def teardown_method(self):
        # Cleanup
        await self.db.execute("DELETE FROM project_chat WHERE project_id = 999")
        await self.db.execute("DELETE FROM projects WHERE id = 999")
        await self.db.execute("DELETE FROM users WHERE id = 999")

    async def test_create_from_dto(self):
        """Test creating a chat message from a DTO."""
        dto = ChatMessageDTO(
            message="Hello, ~~world~~! This is **bold** and *italic*.",
            project_id=999,
            user_id=999,
            timestamp=datetime.now(timezone.utc)
        )
        
        response_dto = await ProjectChat.create_from_dto(dto, self.db)
        
        assert response_dto.id is not None
        assert response_dto.username == "chat_user"
        assert "<strong>bold</strong>" in response_dto.message or "<b>bold</b>" in response_dto.message or "bold" in response_dto.message
        assert "<del>world</del>" in response_dto.message

    async def test_get_messages(self):
        """Test retrieving messages for a project."""
        dto = ChatMessageDTO(
            message="First message",
            project_id=999,
            user_id=999,
            timestamp=datetime.now(timezone.utc)
        )
        await ProjectChat.create_from_dto(dto, self.db)
        
        dto2 = ChatMessageDTO(
            message="Second message",
            project_id=999,
            user_id=999,
            timestamp=datetime.now(timezone.utc)
        )
        await ProjectChat.create_from_dto(dto2, self.db)
        
        messages_dto = await ProjectChat.get_messages(project_id=999, db=self.db, page=1, per_page=10)
        
        assert messages_dto.pagination.total == 2
        assert len(messages_dto.chat) == 2
        assert "Second message" in messages_dto.chat[0].message
        assert "First message" in messages_dto.chat[1].message

    async def test_get_messages_empty(self):
        """Test retrieving messages when there are none."""
        messages_dto = await ProjectChat.get_messages(project_id=999, db=self.db, page=1, per_page=10)
        
        assert messages_dto.pagination.total == 0
        assert len(messages_dto.chat) == 0