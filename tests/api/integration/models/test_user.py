import pytest
from tests.api.helpers.test_helpers import create_canned_user


@pytest.mark.anyio
class TestUser:
    @pytest.fixture(autouse=True)
    async def _setup(self, db_connection_fixture):
        self.db = db_connection_fixture

        self.test_user = await create_canned_user(self.db)

        await self.db.execute(
            """
            UPDATE users
            SET username = :username,
                email_address = :email
            WHERE id = :user_id
            """,
            {
                "username": "mrtest",
                "email": "test@test.com",
                "user_id": self.test_user.id,
            },
        )

        self.test_user.username = "mrtest"
        self.test_user.email_address = "test@test.com"

    async def test_as_dto_will_not_return_email_if_not_owner(self):
        # Act
        user_dto = await self.test_user.as_dto("mastertest", self.db)

        # Assert
        assert not user_dto.email_address

    async def test_as_dto_will_return_email_if_owner(self):
        # Act
        user_dto = await self.test_user.as_dto("mrtest", self.db)

        # Assert
        assert user_dto.email_address
