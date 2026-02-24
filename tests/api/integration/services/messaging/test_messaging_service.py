from backend.services.organisation_service import OrganisationService
import pytest
from unittest.mock import patch, AsyncMock

from backend.models.dtos.message_dto import MessageDTO
from backend.services.messaging.message_service import MessageService
from backend.models.postgis.statuses import TaskStatus
from backend.models.postgis.message import MessageType, Message, NotFound
from backend.services.messaging.smtp_service import SMTPService
from tests.api.helpers.test_helpers import (  # use api helpers like in your other refactor
    add_manager_to_organisation,
    create_canned_organisation,
    return_canned_user,
    create_canned_project,
    create_canned_user,
)
from contextlib import asynccontextmanager


@pytest.mark.anyio
class TestMessageService:
    @pytest.fixture(autouse=True)
    async def _setup(self, db_connection_fixture):
        self.db = db_connection_fixture

        # create and persist test user
        canned = await return_canned_user(
            username="TEST_USER", id=111111111, db=self.db
        )
        self.test_user = await create_canned_user(self.db, canned)

    async def test_welcome_message_sent(self):
        await MessageService.send_welcome_message(self.test_user, db=self.db)
        messages = await Message.get_all_messages(user_id=self.test_user.id, db=self.db)
        assert len(messages.user_messages) == 1

    @patch.object(MessageService, "_push_messages", new_callable=AsyncMock)
    async def test_validation_message_is_not_sent_for_validating_self_mapped_task(
        self,
        mock_push_messages,
    ):
        # Arrange
        status = TaskStatus.VALIDATED.value
        validated_by = 777  # same user
        mapped_by = 777
        project_id = 1
        task_id = 1

        # Act
        await MessageService.send_message_after_validation(
            status,
            validated_by,
            mapped_by,
            project_id,
            task_id,
            db=self.db,
        )

        # Assert
        mock_push_messages.assert_not_called()

    @patch.object(MessageService, "_push_messages", new_callable=AsyncMock)
    async def test_validation_message_is_sent_after_task_validation(
        self, mock_push_message
    ):
        # Arrange
        status = TaskStatus.VALIDATED.value
        canned_project, canned_author, canned_project_id = await create_canned_project(
            self.db
        )
        # Act
        await MessageService.send_message_after_validation(
            status,
            canned_author.id,
            self.test_user.id,
            1,
            canned_project_id,
            db=self.db,
        )

        # Assert
        mock_push_message.assert_called()

    @patch.object(MessageService, "_push_messages", new_callable=AsyncMock)
    async def test_send_message_to_all_contributors(self, mock_push_message):
        # Arrange - create DB-backed fixtures as before
        canned_project, canned_author, canned_project_id = await create_canned_project(
            self.db
        )

        message_dto = MessageDTO(
            subject="Test subject",
            message="Test message",
            from_user_id=canned_author.id,
        )
        message_dto.message_id = 12
        message_dto.from_username = canned_author.username
        message_dto.project_id = int(canned_project_id)
        message_dto.project_title = "Test project"
        message_dto.message_type = MessageType.BROADCAST.value
        message_dto.sent_date = "2020-01-01"

        # Build an async contextmanager that yields the test DB connection
        @asynccontextmanager
        async def _fake_connection():
            yield self.db

        target = "backend.services.messaging.message_service.db_connection.database.connection"
        with patch(target, _fake_connection):
            await MessageService.send_message_to_all_contributors(
                int(canned_project_id), message_dto
            )

        mock_push_message.assert_called()

    @patch.object(MessageService, "_push_messages", new_callable=AsyncMock)
    async def test_send_message_after_comment(self, mock_push_message):
        # Arrange
        canned_project, canned_author, canned_project_id = await create_canned_project(
            self.db
        )
        # Act
        await MessageService.send_message_after_comment(
            canned_author.id,
            "@TEST_USER Test message",
            1,
            int(canned_project_id),
            db=self.db,
        )

        # Assert
        mock_push_message.assert_called()

    @patch.object(SMTPService, "_send_message", new_callable=AsyncMock)
    async def test_send_project_transfer_message(self, mock_send_message):
        test_project, test_author, test_project_id = await create_canned_project(
            self.db
        )

        # ensure the test user has email & verified
        await self.db.execute(
            "UPDATE users SET email_address = :email, is_email_verified = :verified WHERE id = :id",
            {
                "email": "test@hotmalinator.com",
                "verified": True,
                "id": int(self.test_user.id),
            },
        )

        try:
            org_record = await OrganisationService.get_organisation_by_id(23, self.db)
        except NotFound:
            test_org = await create_canned_organisation(self.db)
            org_record = await OrganisationService.get_organisation_by_id(
                test_org.id, self.db
            )

        await add_manager_to_organisation(org_record, self.test_user, db=self.db)

        # Build an async contextmanager that yields the test DB connection
        @asynccontextmanager
        async def _fake_connection():
            yield self.db

        target = "backend.services.messaging.message_service.db_connection.database.connection"
        with patch(target, _fake_connection):
            await MessageService.send_project_transfer_message(
                int(test_project_id), self.test_user.username, test_author.username
            )
        mock_send_message.assert_called()

    async def _send_multiple_welcome_messages(self, number_of_messages: int):
        """Sends multiple welcome messages"""
        message_ids = []
        for _ in range(number_of_messages):
            await MessageService.send_welcome_message(self.test_user, db=self.db)
        messages = await Message.get_all_messages(user_id=self.test_user.id, db=self.db)
        message_ids.extend([message.message_id for message in messages.user_messages])
        return message_ids

    async def test_delete_multiple_messages(self):
        # Arrange
        message_ids = await self._send_multiple_welcome_messages(3)

        # Act
        await MessageService.delete_multiple_messages(
            message_ids[:2], self.test_user.id, db=self.db
        )

        # Assert
        messages = await Message.get_all_messages(user_id=self.test_user.id, db=self.db)
        assert len(messages.user_messages) == 1
        assert messages.user_messages[0].message_id == message_ids[2]

    async def test_delete_all_messages(self):
        # Arrange
        await self._send_multiple_welcome_messages(3)

        # Act
        await MessageService.delete_all_messages(self.test_user.id, db=self.db)

        # Assert
        with pytest.raises(NotFound):
            await Message.get_all_messages(user_id=self.test_user.id, db=self.db)

    async def test_delete_all_message_by_type(self):
        # Arrange
        await self._send_multiple_welcome_messages(2)

        canned = await return_canned_user(
            username="test_user_2", id=222222222, db=self.db
        )
        test_user_2 = await create_canned_user(self.db, canned)

        await MessageService.send_team_join_notification(
            test_user_2.id,
            test_user_2.username,
            self.test_user.id,
            "test_team",
            10,
            "MANAGER",
            db=self.db,
        )

        # Send welcome message to test_user_2 to ensure that it is not deleted
        await MessageService.send_welcome_message(test_user_2, db=self.db)

        # Act
        await MessageService.delete_all_messages(self.test_user.id, self.db, "1,2,3")

        # Assert
        user_1_messages = await Message.get_all_messages(
            user_id=self.test_user.id, db=self.db
        )
        # Since we deleted types 1,2,3 welcome messages should be deleted as it is type 1
        # Team join notification is of type 7, so it should still be there
        assert len(user_1_messages.user_messages) == 1

        message = await self.db.fetch_one(
            query="SELECT * FROM messages WHERE id=:id",
            values={"id": user_1_messages.user_messages[0].message_id},
        )

        assert message.message_type == MessageType.INVITATION_NOTIFICATION.value

        # Also assert that messages of other users are not deleted
        user_2_messages = await Message.get_all_messages(
            user_id=test_user_2.id, db=self.db
        )
        assert len(user_2_messages.user_messages) == 1

    async def test_mark_multiple_messages_as_read(self):
        # Arrange
        message_ids = await self._send_multiple_welcome_messages(3)

        # Act
        await MessageService.mark_multiple_messages_read(
            message_ids[:2], self.test_user.id, db=self.db
        )

        # Assert
        messages = await MessageService.get_all_messages(
            user_id=self.test_user.id,
            locale="en",
            page=1,
            sort_by="date",  # Required for function to work
            sort_direction="desc",  # Required for function to work
            status="unread",
            db=self.db,
        )
        assert len(messages.user_messages) == 1
        assert messages.user_messages[0].message_id == message_ids[2]

    async def test_mark_all_messages_as_read(self):
        # Arrange
        await self._send_multiple_welcome_messages(3)

        # Act
        await MessageService.mark_all_messages_read(self.test_user.id, db=self.db)

        # Assert
        unread_count = await Message.get_unread_message_count(
            self.test_user.id, db=self.db
        )
        assert unread_count == 0

    async def test_mark_all_messages_as_read_by_type(self):
        # Arrange
        await self._send_multiple_welcome_messages(2)

        canned = await return_canned_user(
            username="test_user_2", id=222222222, db=self.db
        )
        test_user_2 = await create_canned_user(self.db, canned)

        await MessageService.send_team_join_notification(
            test_user_2.id,
            test_user_2.username,
            self.test_user.id,
            "test_team",
            10,
            "MANAGER",
            db=self.db,
        )

        # Send welcome message to test_user_2 to ensure that it is not marked as read
        await MessageService.send_welcome_message(test_user_2, db=self.db)

        # Act
        await MessageService.mark_all_messages_read(self.test_user.id, self.db, "1,2,3")

        # Assert
        user_1_messages = await MessageService.get_all_messages(
            user_id=self.test_user.id,
            locale="en",
            page=1,
            sort_by="date",
            sort_direction="desc",
            status="unread",
            db=self.db,
        )
        assert len(user_1_messages.user_messages) == 1
        assert (
            user_1_messages.user_messages[0].message_type
            == MessageType.INVITATION_NOTIFICATION.name
        )

        # Also assert that messages of other users are not marked as read
        user_2_messages = await MessageService.get_all_messages(
            user_id=test_user_2.id,
            locale="en",
            page=1,
            sort_by="date",
            sort_direction="desc",
            status="unread",
            db=self.db,
        )
        assert user_2_messages.pagination.total == 1
