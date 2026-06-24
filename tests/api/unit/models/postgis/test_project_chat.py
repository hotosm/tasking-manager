import pytest
from datetime import datetime, timezone
from backend.models.dtos.message_dto import ChatMessageDTO
from backend.models.postgis.project_chat import ProjectChat
from tests.api.helpers.test_helpers import create_canned_project, create_canned_user

@pytest.mark.anyio
class TestProjectChat:
    @pytest.fixture(autouse=True)
    async def setup_db(self, db_connection_fixture, request):
        request.cls.db = db_connection_fixture
        
        # 1. Usamos helpers para crear el escenario completo (Usuario, Organización, Proyecto y Geometrías)
        # Esto evita errores de columnas inexistentes o restricciones de integridad (FK/NotNull)
        request.cls.test_project, request.cls.test_user, request.cls.project_id = await create_canned_project(self.db)
        request.cls.user_id = self.test_user.id

    async def test_create_from_dto(self):
        """Test creating a chat message from a DTO."""
        dto = ChatMessageDTO(
            message="Hello, ~~world~~! This is **bold**.",
            project_id=self.project_id,
            user_id=self.user_id,
            timestamp=datetime.now(timezone.utc),
            username=self.test_user.username # El DTO requiere el username según implementación
        )
        
        response_dto = await ProjectChat.create_from_dto(dto, self.db)
        
        assert response_dto.id is not None
        assert response_dto.username == self.test_user.username
        # Verificamos que el Markdown se procesó a HTML
        assert "<strong>bold</strong>" in response_dto.message
        assert "<del>world</del>" in response_dto.message

    async def test_get_messages(self):
        """Test retrieving messages for a project."""
        dto = ChatMessageDTO(
            message="First message",
            project_id=self.project_id,
            user_id=self.user_id,
            timestamp=datetime.now(timezone.utc),
            username=self.test_user.username
        )
        await ProjectChat.create_from_dto(dto, self.db)
        
        dto2 = ChatMessageDTO(
            message="Second message",
            project_id=self.project_id,
            user_id=self.user_id,
            timestamp=datetime.now(timezone.utc),
            username=self.test_user.username
        )
        await ProjectChat.create_from_dto(dto2, self.db)
        
        messages_dto = await ProjectChat.get_messages(
            project_id=self.project_id, 
            db=self.db, 
            page=1, 
            per_page=10
        )
        
        assert messages_dto.pagination.total == 2
        assert len(messages_dto.chat) == 2
        # El orden en get_messages es DESC (más reciente primero)
        assert "Second message" in messages_dto.chat[0].message
        assert "First message" in messages_dto.chat[1].message

    async def test_get_messages_empty(self):
        """Test retrieving messages when there are none."""
        messages_dto = await ProjectChat.get_messages(
            project_id=self.project_id, 
            db=self.db, 
            page=1, 
            per_page=10
        )
        
        # Si no hay mensajes, el DTO de chat debe estar vacío
        assert messages_dto.chat == []
        assert messages_dto.pagination is None
