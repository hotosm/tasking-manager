import pytest
from unittest.mock import patch, AsyncMock, MagicMock
from datetime import datetime
from backend.models.postgis.message import Message, MessageType
from backend.services.messaging.message_service import MessageService
from tests.api.helpers.test_helpers import create_canned_user, return_canned_user, create_canned_project

MESSAGE_TYPES = "3,2,1"

@pytest.mark.anyio
class TestMessagingService:
    @pytest.fixture(autouse=True)
    async def setup_test_data(self, db_connection_fixture, request):
        request.cls.db = db_connection_fixture

    async def test_message_service_generates_correct_task_link(self):
        link = MessageService.get_task_link(1, 1, "http://test.com")
        assert 'href="http://test.com/projects/1/tasks/?search=1"' in link

    @patch.object(Message, "delete_multiple_messages", new_callable=AsyncMock)
    async def test_delete_multiple_messages_delegation(self, mock_del):
        await MessageService.delete_multiple_messages([1, 2], 1, self.db)
        mock_del.assert_called_once()

    async def test_send_welcome_message_persists_system_message(self):
        user_obj = await return_canned_user(self.db, username="welcome_test", id=888)
        user = await create_canned_user(self.db, user_obj)
        
        await MessageService.send_welcome_message(user, self.db)
        
        count = await self.db.fetch_val(
            "SELECT COUNT(*) FROM messages WHERE to_user_id = :uid AND message_type = 1",
            {"uid": user.id}
        )
        assert count == 1

    async def test_has_user_new_messages_returns_correct_counts(self):
        # Corregido: Uso correcto de helpers
        user_obj = await return_canned_user(self.db, username="count_test", id=555)
        user = await create_canned_user(self.db, user_obj)
        
        await self.db.execute(
            "INSERT INTO notifications (user_id, unread_count, date) VALUES (:uid, 1, :d)",
            {"uid": user.id, "d": datetime.utcnow()}
        )
        await self.db.execute(
            "INSERT INTO messages (message, subject, to_user_id, read, date) VALUES ('m', 's', :uid, false, :d)",
            {"uid": user.id, "d": datetime.utcnow()}
        )
        
        result = await MessageService.has_user_new_messages(user.id, self.db)
        assert result["newMessages"] is True
        assert result["unread"] >= 1

    async def test_resend_email_validation_raises_error_if_no_email(self):
        # Corregido: Uso correcto de helpers
        user_obj = await return_canned_user(self.db, id=444, username="no_email")
        user = await create_canned_user(self.db, user_obj)
        
        with pytest.raises(ValueError, match="EmailNotSet"):
            await MessageService.resend_email_validation(user.id, self.db)

    async def test_parse_message_for_username_extracts_correct_handles(self):
        comment = "Hi @test_user and [another_user]"
        with patch.object(MessageService, "_parse_message_for_bulk_mentions", return_value=[]):
            usernames = await MessageService._parse_message_for_username(comment, 1, 1, self.db)
            assert "test_user" in usernames
            assert "another_user" in usernames

    @patch("backend.services.messaging.message_service.SMTPService.send_email_alert", new_callable=AsyncMock)
    async def test_push_messages_checks_user_preferences(self, mock_email):
        user_obj = await return_canned_user(self.db, id=111, username="pref_test")
        user = await create_canned_user(self.db, user_obj)
        
        # 1. Actualizar Base de Datos
        await self.db.execute("UPDATE users SET mentions_notifications = False WHERE id = 111")
        # 2. Actualizar el objeto en memoria para que el servicio vea el cambio
        user.mentions_notifications = False 
        
        msg = Message()
        msg.message_type = 3 # MENTION_NOTIFICATION
        msg.to_user_id = user.id
        msg.from_user_id = user.id
        msg.id = 1
        msg.subject = "Test"
        msg.message = "Body"
        
        # Act
        await MessageService._push_messages([{"message": msg, "user": user, "project_name": "P1"}], self.db)
        
        # Assert: Ahora sí debe ser False, porque el servicio verá user.mentions_notifications como False
        assert mock_email.called is False

    async def test_parse_message_for_bulk_mentions_author(self):
        """Valida que #author sea identificado correctamente."""
        project, author, project_id = await create_canned_project(self.db)
        
        # Usar el prefijo # que es el formato esperado por el backend para menciones especiales
        message = "Calling the #author"
        usernames = await MessageService._parse_message_for_bulk_mentions(message, project_id, db=self.db)
        
        assert author.username in usernames
        assert len(usernames) == 1

    async def test_get_all_messages_pagination_logic(self):
        """Valida la recuperación de mensajes con filtros de estado."""
        user_obj = await return_canned_user(self.db, id=1010, username="msg_test")
        user = await create_canned_user(self.db, user_obj)
        
        # Insertar 1 leido, 1 no leido
        await self.db.execute(
            "INSERT INTO messages (message, subject, to_user_id, read, date) VALUES ('m1', 's1', :uid, true, :d)",
            {"uid": user.id, "d": datetime.utcnow()}
        )
        await self.db.execute(
            "INSERT INTO messages (message, subject, to_user_id, read, date) VALUES ('m2', 's2', :uid, false, :d)",
            {"uid": user.id, "d": datetime.utcnow()}
        )
        
        # Act: Pedir solo unread
        res = await MessageService.get_all_messages(self.db, user.id, "en", 1, status="unread")
        
        assert len(res.user_messages) == 1
        assert res.user_messages[0].subject == "s2"
        assert res.pagination.total == 1
