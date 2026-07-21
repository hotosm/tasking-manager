import pytest
from unittest.mock import AsyncMock, patch, MagicMock

from backend.services.messaging.smtp_service import SMTPService, html_to_text

@pytest.mark.anyio
class TestSMTPService:
    def test_html_to_text(self):
        """Test conversion of HTML to plain text."""
        html = "<html><body><h1>Hello</h1><p>This is a <b>test</b>.</p><br/></body></html>"
        text = html_to_text(html)
        assert "Hello\nThis is a test." in text

    @patch("backend.services.messaging.smtp_service.SMTPService._send_message")
    @patch("backend.services.messaging.smtp_service.get_template")
    async def test_send_verification_email(self, mock_get_template, mock_send_message):
        """Test sending verification email."""
        mock_get_template.return_value = "<html>Template</html>"
        
        result = await SMTPService.send_verification_email("test@example.com", "testuser")
        
        assert result is True
        mock_get_template.assert_called_once()
        mock_send_message.assert_called_once_with("test@example.com", "Confirm your email address", "<html>Template</html>")

    @patch("backend.services.messaging.smtp_service.SMTPService._send_message")
    @patch("backend.services.messaging.smtp_service.get_template")
    async def test_send_welcome_email(self, mock_get_template, mock_send_message):
        """Test sending welcome email."""
        mock_get_template.return_value = "<html>Welcome</html>"
        
        result = await SMTPService.send_welcome_email("test@example.com", "testuser")
        
        assert result is True
        mock_send_message.assert_called_once_with("test@example.com", "Welcome to Tasking Manager", "<html>Welcome</html>")

    @patch("backend.services.messaging.smtp_service.SMTPService._send_message")
    async def test_send_contact_admin_email(self, mock_send_message):
        """Test sending contact admin email."""
        data = {
            "name": "Test User",
            "email": "test@example.com",
            "content": "Need help"
        }
        
        with patch("backend.services.messaging.smtp_service.settings") as mock_settings:
            mock_settings.EMAIL_CONTACT_ADDRESS = "admin@example.com"
            await SMTPService.send_contact_admin_email(data)
            
            mock_send_message.assert_called_once()
            args, _ = mock_send_message.call_args
            assert args[0] == "admin@example.com"
            assert args[1] == "New contact from Test User"

    @patch("backend.services.messaging.smtp_service.SMTPService._send_message")
    @patch("backend.services.messaging.smtp_service.get_template")
    async def test_send_email_alert(self, mock_get_template, mock_send_message):
        """Test sending email alert for a new message."""
        mock_get_template.return_value = "<html>Alert</html>"
        
        result = await SMTPService.send_email_alert(
            to_address="test@example.com",
            username="testuser",
            user_email_verified=True,
            message_id=1,
            from_username="sender",
            project_id=1,
            task_id=1,
            subject="New Message",
            content="Hello",
            message_type=1,
            project_name="Test Project"
        )
        
        assert result is True
        mock_send_message.assert_called_once_with("test@example.com", "New Message", "<html>Alert</html>")

    async def test_send_email_alert_unverified(self):
        """Test email alert is not sent if email is unverified."""
        result = await SMTPService.send_email_alert(
            to_address="test@example.com",
            username="testuser",
            user_email_verified=False,
            message_id=1,
            from_username="sender",
            project_id=1,
            task_id=1,
            subject="New Message",
            content="Hello",
            message_type=1,
            project_name="Test Project"
        )
        
        assert result is False