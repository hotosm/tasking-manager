import pytest

from backend.exceptions import NotFound
from backend.services.interests_service import InterestService
from tests.api.helpers.test_helpers import create_canned_project


@pytest.mark.anyio
class TestInterestService:
    @pytest.fixture(autouse=True)
    async def _setup(self, db_connection_fixture):
        self.db = db_connection_fixture

        # persisted project + user
        self.test_project, self.test_user, self.test_project_id = (
            await create_canned_project(self.db)
        )

    @staticmethod
    async def relationship_user(interests, user_id, ids, db):
        interest_ids = [interests[c]["id"] for c in ids]

        user_interests = await InterestService.create_or_update_user_interests(
            user_id, interest_ids, db
        )

        user_interest_ids = [i.id for i in user_interests.interests]
        return interest_ids, user_interest_ids

    async def test_interests(self):
        # Create interests
        interest_names = [f"interest_number_{i}" for i in range(1, 9)]
        for name in interest_names:
            await InterestService.create(name, self.db)

        interests = await InterestService.get_all_interests(self.db)
        assert len(interests.interests) == 8

        # Create new interest
        new_interest = await InterestService.create("test_new_interest", self.db)
        interests = await InterestService.get_all_interests(self.db)
        assert len(interests.interests) == 9

        # Update interest
        new_interest.name = "new_interest_name"
        updated_interest = await InterestService.update(
            new_interest.id, new_interest, self.db
        )
        assert updated_interest.name == "new_interest_name"

        # Associate user with interests
        interests_data = [{"id": i.id} for i in interests.interests]

        iids, uids = await self.relationship_user(
            interests_data, self.test_user.id, [1, 4, 5], self.db
        )
        assert uids == iids

        # Try again (overwrite)
        iids, uids = await self.relationship_user(
            interests_data, self.test_user.id, [1, 2], self.db
        )
        assert uids == iids

        # Validate non-existent interest (user)
        with pytest.raises(NotFound):
            await InterestService.create_or_update_user_interests(
                self.test_user.id, [0], self.db
            )

        await self.db.execute(
            query="""
                DELETE FROM user_interests
                WHERE user_id = :user_id
            """,
            values={"user_id": self.test_user.id},
        )
        # Delete interests one by one
        for interest in interests.interests:
            await InterestService.delete(interest.id, self.db)

        interests = await InterestService.get_all_interests(self.db)
        assert len(interests.interests) == 0
