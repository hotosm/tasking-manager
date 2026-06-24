import pytest
from datetime import datetime, timezone
from unittest.mock import AsyncMock, patch, MagicMock

from backend.models.dtos.message_dto import ChatMessageDTO, ProjectChatDTO, ListChatMessageDTO, Pagination
from backend.services.messaging.chat_service import ChatService
from backend.exceptions import NotFound

@pytest.mark.anyio
class TestChatService:
    @pytest.fixture
    def mock_db(self):
        return AsyncMock()

    @pytest.fixture
    def mock_background_tasks(self):
        return MagicMock()

    @patch("backend.services.messaging.chat_service.ProjectService")
    @patch("backend.services.messaging.chat_service.ProjectInfo")
    @patch("backend.services.messaging.chat_service.ProjectAdminService")
    @patch("backend.services.messaging.chat_service.ProjectChat")
    async def test_post_message_permitted(self, mock_project_chat, mock_admin, mock_project_info, mock_project_service, mock_db, mock_background_tasks):
        """Test posting a chat message when user is permitted."""
        # Setup mocks
        mock_project = MagicMock()
        mock_project.status = 1 # PUBLISHED
        mock_project.private = False
        mock_project.default_locale = "en"
        mock_project_service.get_project_by_id = AsyncMock(return_value=mock_project)
        
        mock_info_dto = MagicMock()
        mock_info_dto.name = "Test Project"
        # CORRECCIÓN: Se configura explícitamente como un método asíncrono
        mock_project_info.get_dto_for_locale = AsyncMock(return_value=mock_info_dto)
        
        mock_admin.is_user_action_permitted_on_project = AsyncMock(return_value=True)
        
        mock_chat_message = MagicMock()
        mock_chat_message.message = "Hello"
        mock_project_chat.create_from_dto = AsyncMock(return_value=mock_chat_message)
        
        list_dto = ListChatMessageDTO(id=1, message="Hello", picture_url="", timestamp=datetime.now(timezone.utc), username="user")
        mock_returned_dto = ProjectChatDTO(
            chat=[list_dto], 
            pagination=Pagination(hasNext=False, hasPrev=False, nextNum=None, page=1, pages=1, prevNum=None, perPage=5, total=1)
        )
        mock_project_chat.get_messages = AsyncMock(return_value=mock_returned_dto)
        
        dto = ChatMessageDTO(message="Hello", project_id=1, user_id=1, timestamp=datetime.now(timezone.utc), username="test")
        result = await ChatService.post_message(dto, 1, 1, mock_db, mock_background_tasks)
        
        assert result == mock_returned_dto
        mock_background_tasks.add_task.assert_called_once()
        mock_project_chat.create_from_dto.assert_called_once()

    @patch("backend.services.messaging.chat_service.ProjectService")
    @patch("backend.services.messaging.chat_service.ProjectInfo")
    @patch("backend.services.messaging.chat_service.ProjectAdminService")
    async def test_post_message_draft_not_permitted(self, mock_admin, mock_project_info, mock_project_service, mock_db, mock_background_tasks):
        """Test posting a chat message fails on DRAFT project if not permitted."""
        # Setup mocks
        mock_project = MagicMock()
        mock_project.status = 0 # DRAFT
        mock_project_service.get_project_by_id = AsyncMock(return_value=mock_project)
        
        mock_info_dto = MagicMock()
        # CORRECCIÓN: Aquí también debe ser un AsyncMock para soportar el await interno
        mock_project_info.get_dto_for_locale = AsyncMock(return_value=mock_info_dto)
        
        mock_admin.is_user_action_permitted_on_project = AsyncMock(return_value=False)
        
        dto = ChatMessageDTO(message="Hello", project_id=1, user_id=1, timestamp=datetime.now(timezone.utc), username="test")
        
        with pytest.raises(ValueError, match="UserNotPermitted"):
            await ChatService.post_message(dto, 1, 1, mock_db, mock_background_tasks)

    @patch("backend.services.messaging.chat_service.ProjectService")
    async def test_get_project_chat_by_id_found(self, mock_project_service, mock_db):
        """Test retrieving a specific chat message."""
        mock_project_service.exists = AsyncMock(return_value=True)
        mock_db.fetch_one.return_value = {"id": 1, "project_id": 1, "message": "Hi"}
        
        result = await ChatService.get_project_chat_by_id(1, 1, mock_db)
        
        assert result["id"] == 1
        assert result["message"] == "Hi"

    @patch("backend.services.messaging.chat_service.ProjectService")
    async def test_get_project_chat_by_id_not_found(self, mock_project_service, mock_db):
        """Test retrieving a chat message that doesn't exist."""
        mock_project_service.exists = AsyncMock(return_value=True)
        mock_db.fetch_one.return_value = None
        
        with pytest.raises(NotFound):
            await ChatService.get_project_chat_by_id(1, 1, mock_db)

    @patch("backend.services.messaging.chat_service.ProjectService")
    async def test_delete_project_chat_by_id_permitted(self, mock_project_service, mock_db):
        """Test deleting a chat message when permitted (own message)."""
        mock_project_service.exists = AsyncMock(return_value=True)
        mock_db.fetch_one.return_value = {"user_id": 1}
        
        await ChatService.delete_project_chat_by_id(1, 1, 1, mock_db)
        
        mock_db.execute.assert_called_once()