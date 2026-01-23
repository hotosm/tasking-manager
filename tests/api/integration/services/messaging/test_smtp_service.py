import os
from urllib.parse import urlparse, parse_qs
from types import SimpleNamespace
from unittest.mock import patch, AsyncMock, MagicMock

import pytest

from backend.models.postgis.message import Message
from backend.models.postgis.statuses import EncouragingEmailType
from backend.services.messaging.smtp_service import SMTPService
from backend.services.users.user_service import UserService
from tests.api.helpers.test_helpers import return_canned_user, create_canned_user
from backend.config import test_settings as settings


@pytest.mark.anyio
class TestSMTPService:
    @pytest.fixture(autouse=True)
    async def _setup(self, db_connection_fixture):
        # DB fixture / app context assumed provided by db_connection_fixture
        self.db = db_connection_fixture

        # default test values (copied from your original)
        self.to_address = "hot-test@mailinator.com"
        self.to_username = "Iain Hunter"
        self.from_username = "Aadesh Baral"
        self.message_id = 1
        self.project_id = 1
        self.project_name = "test_project"
        self.task_id = 1
        self.subject = "test subject"
        self.content = "test content"
        self.message_type = "test"

        # a persisted canned user for tests that need one
        canned = await return_canned_user(
            username="test_user", id=111111111, db=self.db
        )
        self.test_user = await create_canned_user(self.db, canned)

    async def test_send_verification_mail(self):
        if os.getenv("TM_SMTP_HOST") is None:
            return  # skip integration attempt if SMTP not configured
        assert SMTPService.send_verification_email("hot-test@mailinator.com", "mrtest")

    async def test_send_alert(self):
        if os.getenv("TM_SMTP_HOST") is None:
            return
        sent_alert = SMTPService.send_email_alert(
            to_address=self.to_address,
            username=self.to_username,
            user_email_verified=True,
            message_id=self.message_id,
            from_username=self.from_username,
            project_id=self.project_id,
            project_name=self.project_name,
            task_id=self.task_id,
            subject=self.subject,
            content=self.content,
            message_type=self.message_type,
        )
        assert sent_alert

    async def test_send_alert_message_limits(self):
        if os.getenv("TM_SMTP_HOST") is None:
            return
        for _ in range(10):
            sent_alert = SMTPService.send_email_alert(
                to_address=self.to_address,
                username=self.to_username,
                user_email_verified=True,
                message_id=self.message_id,
                from_username=self.from_username,
                project_id=self.project_id,
                project_name=self.project_name,
                task_id=self.task_id,
                subject=self.subject,
                content=self.content,
                message_type=self.message_type,
            )
            assert sent_alert

    async def test_alert_not_sent_if_email_not_supplied(self):
        if os.getenv("TM_SMTP_HOST") is None:
            return
        sent_alert = await SMTPService.send_email_alert(
            to_address="",
            username=self.to_username,
            user_email_verified=True,
            message_id=self.message_id,
            from_username=self.from_username,
            project_id=self.project_id,
            project_name=self.project_name,
            task_id=self.task_id,
            subject=self.subject,
            content=self.content,
            message_type=self.message_type,
        )
        assert not sent_alert

    async def test_does_not_send_if_user_not_verified(self):
        sent_alert = await SMTPService.send_email_alert(
            to_address=self.to_address,
            username=self.to_username,
            user_email_verified=False,
            message_id=self.message_id,
            from_username=self.from_username,
            project_id=self.project_id,
            project_name=self.project_name,
            task_id=self.task_id,
            subject=self.subject,
            content=self.content,
            message_type=self.message_type,
        )
        assert not sent_alert

    @patch.object(SMTPService, "_send_message", new_callable=AsyncMock)
    async def test_does_send_if_user_verified(self, mock_send_message):
        mock_send_message.return_value = None
        sent_alert = SMTPService.send_email_alert(
            to_address=self.to_address,
            username=self.to_username,
            user_email_verified=True,
            message_id=self.message_id,
            from_username=self.from_username,
            project_id=self.project_id,
            project_name=self.project_name,
            task_id=self.task_id,
            subject=self.subject,
            content=self.content,
            message_type=self.message_type,
        )
        assert sent_alert

    async def test_email_verification_url_generated_correctly(self):
        test_user = "mrtest"
        url = SMTPService._generate_email_verification_url("test@test.com", test_user)
        parsed_url = urlparse(url)
        query = parse_qs(parsed_url.query)

        assert parsed_url.path == "/verify-email/"
        assert query["username"] == [test_user]
        assert query.get("token")  # token must exist

    async def test_send_message_sends_mail_if_sender_is_defined(self):
        original_sender = settings.MAIL_DEFAULT_SENDER
        settings.MAIL_DEFAULT_SENDER = MagicMock()

        try:
            # should not raise
            await SMTPService._send_message(
                self.to_address, self.subject, self.content, self.content
            )
        finally:
            settings.MAIL_DEFAULT_SENDER = original_sender

    @patch(
        "backend.services.messaging.smtp_service.settings.MAIL_DEFAULT_SENDER",
        None,
    )
    async def test_send_message_raises_error_if_sender_not_defined(self):
        with pytest.raises(ValueError):
            await SMTPService._send_message(
                self.to_address,
                self.subject,
                self.content,
                self.content,
            )

    @patch.object(SMTPService, "_send_message", new_callable=AsyncMock)
    @patch.object(UserService, "get_user_by_id", new_callable=AsyncMock)
    @patch.object(Message, "get_all_contributors", new_callable=AsyncMock)
    async def test_send_email_to_contributors_on_project_progress(
        self, mock_get_all_contributors, mock_get_user_by_id, mock_send_message
    ):
        # Arrange: return a list of contributor ids (plain ints)
        mock_get_all_contributors.return_value = [123456]

        # create a simple user-like object with the fields the service expects
        test_user = SimpleNamespace(
            username="contrib_user",
            email_address=self.to_address,
            is_email_verified=False,
            projects_notifications=True,
        )

        mock_get_user_by_id.return_value = test_user

        # 1) Email NOT sent if email not verified
        await SMTPService.send_email_to_contributors_on_project_progress(
            EncouragingEmailType.PROJECT_PROGRESS.value, 1, "test", 50
        )
        mock_send_message.assert_not_called()

        # 2) Email NOT sent if notifications disabled
        test_user.is_email_verified = True
        test_user.projects_notifications = False
        await SMTPService.send_email_to_contributors_on_project_progress(
            EncouragingEmailType.PROJECT_PROGRESS.value, 1, "test", 50
        )
        mock_send_message.assert_not_called()

        # 3) Email IS sent when verified + notifications enabled
        test_user.projects_notifications = True
        await SMTPService.send_email_to_contributors_on_project_progress(
            EncouragingEmailType.PROJECT_PROGRESS.value, 1, "test", 50
        )

        # Assert the async send was awaited at least once
        mock_send_message.assert_awaited()
        # (optional extra strictness)
        assert mock_send_message.await_count == 1
