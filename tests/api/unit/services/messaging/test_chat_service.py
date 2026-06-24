import pytest
from datetime import datetime
from unittest.mock import AsyncMock, patch, MagicMock

from backend.models.dtos.message_dto import ChatMessageDTO, ProjectChatDTO, ListChatMessageDTO, Pagination
from backend.services.messaging.chat_service import ChatService
from backend.exceptions import NotFound

@pytest.mark.anyio
class TestChatService:
    @pytest.fixture(autouse=True)
    def setup_mocks(self, request):
        request.cls.mock_db = AsyncMock()
        request.cls.mock_background_tasks = MagicMock()

    @patch("backend.services.messaging.chat_service.ProjectService")
    @patch("backend.services.messaging.chat_service.ProjectInfo")
    @patch("backend.services.messaging.chat_service.ProjectAdminService")
    @patch("backend.services.messaging.chat_service.ProjectChat")
    async def test_post_message_permitted(self, mock_project_chat, mock_admin, mock_project_info, mock_project_service):
        """Test posting a chat message when user is permitted."""
        # Setup mocks
        mock_project = MagicMock()
        mock_project.status = 1 # PUBLISHED
        mock_project.private = False
        mock_project_service.get_project_by_id = AsyncMock(return_value=mock_project)
        mock_project_info.get_dto_for_locale = AsyncMock(return_value=MagicMock(name="Test Project"))
        mock_admin.is_user_action_permitted_on_project = AsyncMock(return_value=True)
        
        # Simular creación exitosa
        mock_project_chat.create_from_dto = AsyncMock(return_value=MagicMock(message="Hello"))
        
        # CORRECCIÓN: Inicialización manual del DTO para evitar el TypeError del __init__
        mock_returned_dto = ProjectChatDTO()
        mock_returned_dto.chat = []
        mock_returned_dto.pagination = None
        mock_project_chat.get_messages = AsyncMock(return_value=mock_returned_dto)
        
        dto = ChatMessageDTO(message="Hello", project_id=1, user_id=1, timestamp=datetime.utcnow(), username="test")
        result = await ChatService.post_message(dto, 1, 1, self.mock_db, self.mock_background_tasks)
        
        assert result == mock_returned_dto
        self.mock_background_tasks.add_task.assert_called_once()

    @patch("backend.services.messaging.chat_service.ProjectService")
    @patch("backend.services.messaging.chat_service.ProjectInfo")
    @patch("backend.services.messaging.chat_service.ProjectAdminService")
    @patch("backend.services.messaging.chat_service.TeamService")
    async def test_post_message_private_forbidden(self, mock_team, mock_admin, mock_project_info, mock_project_service):
        """Test que falla si el proyecto es privado y el usuario no tiene acceso."""
        # Setup mock project
        mock_project = MagicMock()
        mock_project.id = 1
        mock_project.status = 1 # PUBLISHED
        mock_project.private = True 
        mock_project.default_locale = "en"
        mock_project_service.get_project_by_id = AsyncMock(return_value=mock_project)
        
        # Setup mock info (necesario porque el servicio lo llama antes de validar el acceso)
        mock_project_info.get_dto_for_locale = AsyncMock(return_value=MagicMock(name="Test"))
        
        # Forzamos que todas las validaciones de permiso devuelvan False
        mock_admin.is_user_action_permitted_on_project = AsyncMock(return_value=False)
        mock_team.check_team_membership = AsyncMock(return_value=False)
        
        # Simulamos que la tabla de usuarios permitidos está vacía (Record mockeado)
        self.mock_db.fetch_all.return_value = [] 
        
        dto = ChatMessageDTO(message="Hi", project_id=1, user_id=1, timestamp=datetime.utcnow(), username="t")
        
        # Ahora el match "UserNotPermitted" sí debería encontrar la excepción lanzada en el backend
        with pytest.raises(ValueError, match="UserNotPermitted"):
            await ChatService.post_message(dto, 1, 1, self.mock_db, self.mock_background_tasks)

    async def test_get_project_chat_by_id_not_found(self):
        with patch("backend.services.messaging.chat_service.ProjectService.exists", AsyncMock()):
            self.mock_db.fetch_one.return_value = None
            with pytest.raises(NotFound):
                await ChatService.get_project_chat_by_id(1, 99, self.mock_db)

    @patch("backend.services.messaging.chat_service.ProjectAdminService")
    async def test_delete_project_chat_by_id_forbidden(self, mock_admin):
        """Test que valida que un usuario no puede borrar mensajes ajenos."""
        with patch("backend.services.messaging.chat_service.ProjectService.exists", AsyncMock()):
            # El mensaje pertenece al usuario 2
            self.mock_db.fetch_one.return_value = {"user_id": 2}
            # El usuario que intenta borrar es el 1 y no es admin del proyecto
            mock_admin.is_user_action_permitted_on_project = AsyncMock(return_value=False)
            
            with pytest.raises(ValueError, match="DeletePermissionError"):
                await ChatService.delete_project_chat_by_id(1, 1, 1, self.mock_db)

    @patch("backend.services.messaging.chat_service.ProjectChat")
    async def test_get_messages_delegation(self, mock_project_chat):
        """Valida que el servicio delegue correctamente al modelo."""
        mock_project_chat.get_messages = AsyncMock(return_value=ProjectChatDTO())
        await ChatService.get_messages(1, self.mock_db, 1, 10)
        mock_project_chat.get_messages.assert_called_with(1, self.mock_db, 1, 10)
