import pytest
from unittest.mock import patch, AsyncMock

from backend.models.postgis.message import Message
from backend.services.messaging.message_service import MessageService


MESSAGE_TYPES = "3,2,1"
TEST_USER_ID = 111111111


@pytest.mark.anyio
class TestMessagingService:
    @pytest.fixture(autouse=True)
    async def setup_test_data(self, db_connection_fixture, request):
        """Setup required test data"""
        assert db_connection_fixture is not None, "Database connection is not available"
        request.cls.db = db_connection_fixture

    async def test_message_service_generates_correct_task_link(self):
        # Act
        link = MessageService.get_task_link(1, 1, "http://test.com")

        # Assert
        assert (
            link
            == '<a style="" href="http://test.com/projects/1/tasks/?search=1">Task 1</a>'
        )

    async def test_message_service_generates_highlighted_task_link(self):
        # Act
        link = MessageService.get_task_link(1, 1, "example.com", highlight=True)

        # Assert
        assert (
            link
            == '<a style="color: #d73f3f" href="example.com/projects/1/tasks/?search=1">Task 1</a>'
        )

    async def test_message_service_generates_correct_chat_link(self):
        # Act
        link = MessageService.get_project_link(
            1, "TEST_PROJECT", "http://test.com", include_chat_section=True
        )

        assert (
            link
            == '<a style="" href="http://test.com/projects/1#questionsAndComments">TEST_PROJECT #1</a>'
        )

        link = MessageService.get_project_link(
            1, "TEST_PROJECT", "http://test.com", highlight=True
        )

        assert (
            link
            == '<a style="color: #d73f3f" href="http://test.com/projects/1">TEST_PROJECT #1</a>'
        )

    @patch.object(Message, "delete_multiple_messages")
    async def test_delete_multiple_messages(self, mock_delete_multiple_messages):
        """Test that the delete_multiple_messages method calls the model method"""
        # Configure the mock to be awaitable
        mock_delete_multiple_messages.return_value = AsyncMock()

        # Act
        await MessageService.delete_multiple_messages([1, 2, 3], 1, self.db)

        # Assert
        mock_delete_multiple_messages.assert_called_once()

    @patch.object(Message, "delete_all_messages")
    async def test_delete_all_messages(self, mock_delete_all_messages):
        """Test that the delete_all_messages method calls the model method"""
        # Configure the mock to be awaitable
        mock_delete_all_messages.return_value = AsyncMock()

        # Act
        await MessageService.delete_all_messages(1, self.db, MESSAGE_TYPES)

        # Assert
        message_type = list(map(int, list(MESSAGE_TYPES.split(","))))
        mock_delete_all_messages.assert_called_with(1, self.db, message_type)

    @patch.object(Message, "mark_multiple_messages_read")
    async def test_mark_multiple_messages_read(self, mock_mark_multiple_messages_read):
        """Test that the mark_multiple_messages_read method calls the model method"""
        # Configure the mock to be awaitable
        mock_mark_multiple_messages_read.return_value = AsyncMock()

        # Act
        await MessageService.mark_multiple_messages_read([1, 2, 3], 1, self.db)

        # Assert
        mock_mark_multiple_messages_read.assert_called_once()

    @patch.object(Message, "mark_all_messages_read")
    async def test_mark_all_messages_read(self, mock_mark_all_messages_read):
        """Test that the mark_all_messages_read method calls the model method"""
        # Configure the mock to be awaitable
        mock_mark_all_messages_read.return_value = AsyncMock()

        # Act
        await MessageService.mark_all_messages_read(1, self.db, MESSAGE_TYPES)

        # Assert
        message_type = list(map(int, list(MESSAGE_TYPES.split(","))))
        mock_mark_all_messages_read.assert_called_with(1, self.db, message_type)

    async def test_send_welcome_message_persists_system_message(self):
        """Valida que el mensaje de bienvenida se guarde en la tabla de mensajes."""
        from tests.api.helpers.test_helpers import create_canned_user
        user = await create_canned_user(self.db)
        
        await MessageService.send_welcome_message(user, self.db)
        
        count = await self.db.fetch_val(
            "SELECT COUNT(*) FROM messages WHERE to_user_id = :uid AND message_type = 1",
            {"uid": user.id}
        )
        assert count == 1

    async def test_has_user_new_messages_returns_correct_counts(self):
        """Valida la detección de mensajes no leídos para un usuario."""
        from tests.api.helpers.test_helpers import create_canned_user
        user = await create_canned_user(self.db, id=555, username="count_test")
        # Insertar notificación manual
        await self.db.execute(
            "INSERT INTO notifications (user_id, unread_count, date) VALUES (:uid, 5, CURRENT_TIMESTAMP)",
            {"uid": user.id}
        )
        # Insertar mensaje no leído manual
        await self.db.execute(
            "INSERT INTO messages (message, subject, to_user_id, read, date) VALUES ('m', 's', :uid, false, CURRENT_TIMESTAMP)",
            {"uid": user.id}
        )
        
        result = await MessageService.has_user_new_messages(user.id, self.db)
        assert result["newMessages"] is True
        assert result["unread"] >= 1

    async def test_resend_email_validation_raises_error_if_no_email(self):
        """Valida que falle el reenvío de verificación si el usuario no tiene email configurado."""
        from tests.api.helpers.test_helpers import create_canned_user
        user = await create_canned_user(self.db, id=444, username="no_email")
        # Forzar email null
        await self.db.execute("UPDATE users SET email_address = NULL WHERE id = 444")
        
        with pytest.raises(ValueError, match="EmailNotSet"):
            await MessageService.resend_email_validation(user.id, self.db)

    async def test_parse_message_for_username_extracts_correct_handles(self):
        """Valida el regex que identifica menciones en comentarios o chat."""
        comment = "Hi @test_user and [another_user]"
        # Simular que no hay menciones masivas (mappers, managers) para simplificar
        with patch.object(MessageService, "_parse_message_for_bulk_mentions", return_value=[]):
            usernames = await MessageService._parse_message_for_username(comment, 1, 1, self.db)
            
            assert "test_user" in usernames
            assert "another_user" in usernames
            assert len(usernames) == 2

    async def test_send_message_after_validation_ignores_self_validation(self):
        """Valida que no se envíe notificación si el validador es el mismo mapeador."""
        # Mismo ID para ambos roles
        await MessageService.send_message_after_validation(4, 100, 100, 1, 1, self.db)
        
        count = await self.db.fetch_val("SELECT COUNT(*) FROM messages WHERE to_user_id = 100")
        assert count == 0

    @patch("backend.services.messaging.message_service.SMTPService.send_email_alert", new_callable=AsyncMock)
    async def test_push_messages_checks_user_preferences(self, mock_email):
        """Valida que se respeten las preferencias de notificación del usuario."""
        from tests.api.helpers.test_helpers import create_canned_user
        from backend.models.postgis.message import Message
        
        user = await create_canned_user(self.db, id=111, username="pref_test")
        # Desactivar notificaciones de menciones
        await self.db.execute("UPDATE users SET mentions_notifications = False WHERE id = 111")
        
        msg = Message()
        msg.message_type = 3 # MENTION_NOTIFICATION
        msg.to_user_id = user.id
        
        # Act
        await MessageService._push_messages([{"message": msg, "user": user, "project_name": "P1"}], self.db)
        
        # Assert: No se debió llamar al servicio de email
        assert mock_email.called is False
