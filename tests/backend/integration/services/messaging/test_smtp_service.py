import os
from urllib.parse import urlparse, parse_qs

from backend.services.messaging.smtp_service import SMTPService
from tests.backend.base import BaseTestCase


class TestStatsService(BaseTestCase):
    def test_send_verification_mail(self):

        if os.getenv("TM_SMTP_HOST") is None:
            return  # If SMTP not setup there's no value attempting the integration tests

        self.assertTrue(
            SMTPService.send_verification_email("hot-test@mailinator.com", "mrtest")
        )

    def test_send_alert(self):

        if os.getenv("TM_SMTP_HOST") is None:
            return  # If SMTP not setup there's no value attempting the integration tests

        self.assertTrue(
            SMTPService.send_email_alert("hot-test@mailinator.com", "Iain Hunter", True)
        )

    def test_send_alert_message_limits(self):

        if os.getenv("TM_SMTP_HOST") is None:
            return  # If SMTP not setup there's no value attempting the integration tests

        for x in range(0, 50):
            self.assertTrue(
                SMTPService.send_email_alert(
                    "hot-test@mailinator.com", "Iain Hunter", True
                )
            )

    def test_alert_not_sent_if_email_not_supplied(self):
        self.assertFalse(SMTPService.send_email_alert("", "Iain Hunter", True))

    def test_does_not_send_if_user_not_verified(self):
        self.assertFalse(
            SMTPService.send_email_alert(
                "hot-test@mailinator.com", "Iain Hunter", False
            )
        )

    def test_does_send_if_user_verified(self):
        self.assertTrue(
            SMTPService.send_email_alert("hot-test@mailinator.com", "Iain Hunter", True)
        )
        self.assertFalse(
            SMTPService.send_email_alert("", "Iain Hunter", 1, "test", "testing")
        )

    def test_email_verification_url_generated_correctly(self):
        # Arrange
        test_user = "mrtest"

        # Act
        url = SMTPService._generate_email_verification_url("test@test.com", test_user)

        parsed_url = urlparse(url)
        query = parse_qs(parsed_url.query)

        self.assertEqual(parsed_url.path, "/verify-email/")
        self.assertEqual(query["username"], [test_user])
        self.assertTrue(
            query["token"]
        )  # Token random every time so just check we have something
