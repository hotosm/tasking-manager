import os
import unittest
from server import create_app
from server.services.interests_service import InterestService
from tests.server.helpers.test_helpers import create_canned_project
from server.models.postgis.utils import NotFound


class TestInterestService(unittest.TestCase):

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

        self.test_project, self.test_user = create_canned_project()

    def tearDown(self):
        if self.skip_tests:
            return

        self.test_project.delete()
        self.test_user.delete()
        self.ctx.pop()

    @staticmethod
    def relationship_user(interests, user_id, ids):
        interest_ids = [interests[c]["id"] for c in ids]
        user_interests = InterestService.create_or_update_user_interests(
            user_id, interest_ids
        )
        user_interests_ids = [
            i["id"] for i in user_interests.to_primitive()["interests"]
        ]

        return interest_ids, user_interests_ids

    @staticmethod
    def relationship_project(interests, project_id, ids):
        interest_ids = [interests[c]["id"] for c in ids]
        project_interests = InterestService.create_or_update_project_interests(
            project_id, interest_ids
        )
        project_interests_ids = [
            i["id"] for i in project_interests.to_primitive()["interests"]
        ]

        return interest_ids, project_interests_ids

    def test_interests(self):
        if self.skip_tests:
            return

        interests = ["interest_number_{0}".format(i) for i in range(1, 9)]
        [InterestService.create(interest_name=i) for i in interests]
        interests = InterestService.get_all_interests().to_primitive()["interests"]
        self.assertEqual(len(interests), 8)

        # Create new interest.
        new_interest = InterestService.create(interest_name="test_new_interest")
        interests = InterestService.get_all_interests().to_primitive()["interests"]
        self.assertEqual(len(interests), 9)

        # Update interest
        new_interest.name = "new_interest_name"
        updated_interest = InterestService.update(new_interest.id, new_interest)
        self.assertEqual(new_interest.name, updated_interest.name)

        # Associate users with interest.
        iids, uids = TestInterestService.relationship_user(
            interests, self.test_user.id, [1, 4, 5]
        )
        self.assertEqual(uids, iids)

        # Try again.
        iids, uids = TestInterestService.relationship_user(
            interests, self.test_user.id, [1, 2]
        )
        self.assertEqual(uids, iids)

        # Validate unexistent interest.
        with self.assertRaises(NotFound):
            InterestService.create_or_update_user_interests(self.test_user.id, [0])

        # Associate projects with interest.
        iids, pids = TestInterestService.relationship_project(
            interests, self.test_project.id, [1, 2]
        )
        self.assertEqual(pids, iids)

        # Validate unexistent interest.
        with self.assertRaises(NotFound):
            InterestService.create_or_update_project_interests(
                self.test_project.id, [0]
            )

        # Delete one by one.
        for interest in interests:
            InterestService.delete(interest["id"])

        interests = InterestService.get_all_interests().to_primitive()["interests"]
        self.assertEqual(len(interests), 0)
