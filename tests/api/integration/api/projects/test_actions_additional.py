import json
from types import SimpleNamespace
from unittest.mock import AsyncMock, patch

import pytest

from backend.api.projects import actions
from backend.api.projects.actions import feature, remove_feature, set_interests
from backend.services.project_admin_service import ProjectAdminService
from backend.services.project_service import ProjectService


class DumpableInterests:
    def model_dump(self, by_alias=False):
        return {
            "interests": [
                {
                    "id": 1,
                    "name": "Health",
                }
            ]
        }


def get_response_body(response):
    return json.loads(response.body.decode())


@pytest.mark.anyio
class TestProjectActionsAdditional:
    async def test_feature_project_permission_denied_success_and_service_error(self):
        user = SimpleNamespace(id=10)
        db = object()
        request = SimpleNamespace()

        with patch.object(
            ProjectAdminService,
            "is_user_action_permitted_on_project",
            new_callable=AsyncMock,
        ) as mock_is_permitted, patch.object(
            ProjectService,
            "set_project_as_featured",
            new_callable=AsyncMock,
        ) as mock_set_featured:
            mock_is_permitted.return_value = False

            response = await feature(
                request=request,
                project_id=1,
                user=user,
                db=db,
            )

            assert response.status_code == 403
            assert get_response_body(response)["SubCode"] == "UserPermissionError"

            mock_is_permitted.return_value = True
            mock_set_featured.return_value = None
            mock_set_featured.side_effect = None

            response = await feature(
                request=request,
                project_id=1,
                user=user,
                db=db,
            )

            assert response.status_code == 200
            assert get_response_body(response)["Success"] is True

            mock_set_featured.side_effect = ValueError("FeatureError-Cannot feature")

            response = await feature(
                request=request,
                project_id=1,
                user=user,
                db=db,
            )

            assert response.status_code == 403
            assert get_response_body(response)["SubCode"] == "FeatureError"

    async def test_remove_feature_project_permission_denied_success_and_service_error(
        self,
    ):
        user = SimpleNamespace(id=10)
        db = object()
        request = SimpleNamespace()

        with patch.object(
            ProjectAdminService,
            "is_user_action_permitted_on_project",
            new_callable=AsyncMock,
        ) as mock_is_permitted, patch.object(
            ProjectService,
            "unset_project_as_featured",
            new_callable=AsyncMock,
        ) as mock_unset_featured:
            mock_is_permitted.return_value = False

            response = await remove_feature(
                request=request,
                project_id=1,
                user=user,
                db=db,
            )

            assert response.status_code == 403
            assert get_response_body(response)["SubCode"] == "UserPermissionError"

            mock_is_permitted.return_value = True
            mock_unset_featured.return_value = None
            mock_unset_featured.side_effect = None

            response = await remove_feature(
                request=request,
                project_id=1,
                user=user,
                db=db,
            )

            assert response.status_code == 200
            assert get_response_body(response)["Success"] is True

            mock_unset_featured.side_effect = ValueError(
                "RemoveFeatureError-Cannot remove feature"
            )

            response = await remove_feature(
                request=request,
                project_id=1,
                user=user,
                db=db,
            )

            assert response.status_code == 403
            assert get_response_body(response)["SubCode"] == "RemoveFeatureError"

    async def test_set_interests_permission_denied_and_success(self):
        user = SimpleNamespace(id=10)
        db = object()
        request = SimpleNamespace()
        data = {"interests": [1, 2, 3]}

        with patch.object(
            ProjectAdminService,
            "is_user_action_permitted_on_project",
            new_callable=AsyncMock,
        ) as mock_is_permitted, patch.object(
            actions.InterestService,
            "create_or_update_project_interests",
            new_callable=AsyncMock,
        ) as mock_create_or_update_interests:
            mock_is_permitted.return_value = False

            response = await set_interests(
                request=request,
                project_id=1,
                data=data,
                user=user,
                db=db,
            )

            assert response.status_code == 403
            assert get_response_body(response)["SubCode"] == "UserPermissionError"

            mock_is_permitted.return_value = True
            mock_create_or_update_interests.return_value = DumpableInterests()

            result = await set_interests(
                request=request,
                project_id=1,
                data=data,
                user=user,
                db=db,
            )

            assert result == {
                "interests": [
                    {
                        "id": 1,
                        "name": "Health",
                    }
                ]
            }

            mock_create_or_update_interests.assert_awaited_with(
                1,
                [1, 2, 3],
                db,
            )