import os
import unittest
from server import create_app
from server.models.postgis.user import User
from server.services.users.user_service import (
    UserValidatorRoleRequestService,
    UserService,
)
from server.models.dtos.user_dto import UserValidatorRoleRequestDTO
from server.models.postgis.message import Message
from server.models.postgis.statuses import UserValidatorRoleRequestStatus, UserRole
from server.models.postgis.utils import timestamp


class TestMappingService(unittest.TestCase):

    skip_tests = False
    test_project = None
    test_user = None

    @classmethod
    def setUpClass(cls):
        env = os.getenv("CI", "false")

        # Firewall rules mean we can't hit Postgres from CI so we have to skip them in the CI build
        if env == "true":
            cls.skip_tests = True

    def setUp(self):
        if self.skip_tests:
            return

        self.app = create_app()
        self.ctx = self.app.app_context()
        self.ctx.push()

        mapper_user = User(id=1, username="mapper_user", role=UserRole.MAPPER.value)
        mapper_user.create()
        self.mapper_user = mapper_user

        admin_user = User(id=2, username="admin_user", role=UserRole.ADMIN.value)
        admin_user.create()
        self.admin_user = admin_user

    def tearDown(self):
        if self.skip_tests:
            return

        # Delete notification messages.
        Message.query.filter(
            Message.from_user_id.in_((self.mapper_user.id, self.admin_user.id))
        ).delete(synchronize_session=False)
        self.mapper_user.delete()
        self.admin_user.delete()
        self.ctx.pop()

    def test_validation_role_request(self):
        if self.skip_tests:
            return

        # A mapper makes a request to upgrade to validator.
        dto = UserValidatorRoleRequestDTO()
        dto.requester_user_id = self.mapper_user.id
        dto.reason = "Because i wanted to"
        dto.validate()

        dto = UserValidatorRoleRequestService.create(dto)

        # But received a deny status
        dto.response_user_id = self.admin_user.id
        dto.status = UserValidatorRoleRequestStatus.DENY.name
        dto.updated_date = timestamp()
        dto.validate()

        UserValidatorRoleRequestService.update(dto)

        # Check from the database
        id = dto.id
        model = UserValidatorRoleRequestService.get_by_id(dto.id)
        self.assertEqual(model.status, UserValidatorRoleRequestStatus.DENY.value)

        # So, apply again
        new_data = {
            "requester_user_id": self.mapper_user.id,
            "reason": "Please...",
            "reviewed_howto": True,
            "read_learnosm": True,
            "read_code_conduct": True,
            "agreed_interactions": True,
            "agreed_osmdata": True,
        }
        dto = UserValidatorRoleRequestDTO(new_data)
        dto.validate()

        dto = UserValidatorRoleRequestService.create(dto)

        # But this time is accepted.
        dto.response_user_id = self.admin_user.id
        dto.status = UserValidatorRoleRequestStatus.ACCEPT.name
        dto.updated_date = timestamp()
        dto.validate()
        dto = UserValidatorRoleRequestService.update(dto)

        # Verify that status changed to validator when accepted.
        user = UserService.get_user_by_id(dto.requester_user_id)
        self.assertEqual(user.role, UserRole.VALIDATOR.value)
        id_2 = dto.id
        model = UserValidatorRoleRequestService.get_by_id(id_2)
        self.assertEqual(model.status, UserValidatorRoleRequestStatus.ACCEPT.value)

        # Test deletion
        UserValidatorRoleRequestService.delete(id)
        UserValidatorRoleRequestService.delete(id_2)
