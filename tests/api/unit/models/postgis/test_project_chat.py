import pytest
from datetime import datetime
from backend.models.dtos.message_dto import ChatMessageDTO
from backend.models.postgis.project_chat import ProjectChat
from tests.api.helpers.test_helpers import create_canned_project

@pytest.mark.anyio
class TestProjectChat:
    @pytest.fixture(autouse=True)
    async def setup_db(self, db_connection_fixture, request):
        request.cls.db = db_connection_fixture
        
        # Setup del entorno (MappingLevels, User, Org, Project, Tasks)
        request.cls.project, request.cls.test_user, request.cls.project_id = await create_canned_project(self.db)
        request.cls.user_id = self.test_user.id

    async def test_create_from_dto_sanitization(self):
        """Test creación con Markdown y validación de saneamiento HTML."""
        dto = ChatMessageDTO(
            message="Hello ~~world~~! **Bold**. <script>alert('xss')</script> http://test.com",
            project_id=self.project_id,
            user_id=self.user_id,
            timestamp=datetime.utcnow(), # Corrección: Naive datetime para evitar DataError
            username=self.test_user.username
        )
        
        response_dto = await ProjectChat.create_from_dto(dto, self.db)
        
        assert response_dto.id is not None
        # 1. Valida Markdown: ~~world~~ -> <del>world</del>
        assert "<del>world</del>" in response_dto.message
        # 2. Valida Saneamiento: <script> debe ser removido o escapado
        assert "<script>" not in response_dto.message
        # 3. Valida Linkify: URL debe ser convertida en <a>
        assert 'href="http://test.com"' in response_dto.message

    async def test_get_messages_ordering_and_pagination(self):
        """Test recuperación con orden descendente y paginación."""
        # Insertar 2 mensajes con timestamps diferentes
        for msg in ["Old message", "New message"]:
            dto = ChatMessageDTO(
                message=msg,
                project_id=self.project_id,
                user_id=self.user_id,
                timestamp=datetime.utcnow(),
                username=self.test_user.username
            )
            await ProjectChat.create_from_dto(dto, self.db)
        
        # Recuperar página 1
        messages_dto = await ProjectChat.get_messages(
            project_id=self.project_id, 
            db=self.db, 
            page=1, 
            per_page=10
        )
        
        assert messages_dto.pagination.total == 2
        assert len(messages_dto.chat) == 2
        # El más nuevo ("New message") debe ser el primero (index 0)
        assert "New message" in messages_dto.chat[0].message
        assert "Old message" in messages_dto.chat[1].message

    async def test_get_messages_empty_returns_empty_dto(self):
        """Test comportamiento cuando no hay mensajes."""
        messages_dto = await ProjectChat.get_messages(
            project_id=self.project_id, 
            db=self.db, 
            page=1, 
            per_page=10
        )
        
        # Según implementación, devuelve un DTO con chat=[] y pagination=None
        assert messages_dto.chat == []
        assert messages_dto.pagination is None

    async def test_create_from_dto_with_complex_markdown(self):
        """Incrementa cobertura probando tablas y listas (extensiones de markdown)."""
        complex_msg = "| Col1 | Col2 |\n|------|------|\n| Val1 | Val2 |\n\n* Item 1"
        dto = ChatMessageDTO(
            message=complex_msg,
            project_id=self.project_id,
            user_id=self.user_id,
            timestamp=datetime.utcnow(),
            username=self.test_user.username
        )
        
        response = await ProjectChat.create_from_dto(dto, self.db)
        assert "<table>" in response.message
        assert "<li>Item 1</li>" in response.message
