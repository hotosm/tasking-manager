import unittest

from server.services.messaging.smtp_service import SMTPService


class TestStatsService(unittest.TestCase):

    def test_send_mail(self):

        SMTPService.send_mail()
