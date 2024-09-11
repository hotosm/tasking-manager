from fastapi import APIRouter
from backend.api.projects import (
    resources as project_resources,
    activities as project_activities,
    contributions as project_contributions,
    statistics as project_statistics,
    teams as project_teams,
    campaigns as project_campaigns,
    actions as project_actions,
    favorites as project_favorites,
)

from backend.api.comments import resources as comment_resources
from backend.api.countries import resources as country_resources
from backend.api.campaigns import resources as campaign_resources
from backend.api.annotations import resources as annotation_resources
from backend.api.interests import resources as interest_resources
from backend.api.users import (
    resources as user_resources,
    statistics as user_statistics,
    openstreetmap as users_openstreetmap,
    tasks as users_tasks,
    actions as user_actions
)
from backend.api.licenses import (
    resources as license_resources,
    actions as license_actions,
)
from backend.api.organisations import (
    resources as organisation_resources,
    campaigns as organisation_campaigns,
)
from backend.api.tasks import (
    resources as task_resources,
    actions as task_actions,
    statistics as task_statistics,
)
from backend.api.teams import (
    resources as teams_resources,
    actions as teams_actions,
)
from backend.api.system import (
    applications as system_applications,
    general as system_general,
    banner as system_banner,
    statistics as system_statistics,
    authentication as system_authentication,
    image_upload as system_image_upload,
)
from backend.api.notifications import (
    resources as notification_resources,
    actions as notification_actions,
)

v2 = APIRouter(prefix="/api/v2")


def add_api_end_points(api):
    v2.include_router(project_resources.router)
    v2.include_router(project_activities.router)
    v2.include_router(project_contributions.router)
    v2.include_router(project_statistics.router)
    v2.include_router(project_teams.router)
    v2.include_router(project_campaigns.router)
    v2.include_router(project_actions.router)
    v2.include_router(project_favorites.router)

    # Comments REST endpoint
    v2.include_router(comment_resources.router)

    # Teams REST endpoint
    v2.include_router(teams_resources.router)
    v2.include_router(teams_actions.router)

    # Countries REST endpoint
    v2.include_router(country_resources.router)

    # Campaigns REST endpoint
    v2.include_router(campaign_resources.router)

    # Annotations REST endpoint
    v2.include_router(annotation_resources.router)

    # Interests REST endpoint
    v2.include_router(interest_resources.router)

    # Users REST endpoint
    v2.include_router(user_resources.router)
    v2.include_router(users_openstreetmap.router)
    v2.include_router(users_tasks.router)
    v2.include_router(user_statistics.router)
    v2.include_router(user_actions.router)

    # Licenses REST endpoint
    v2.include_router(license_resources.router)
    v2.include_router(license_actions.router)

    # Organisations REST endpoint
    v2.include_router(organisation_resources.router)
    v2.include_router(organisation_campaigns.router)

    # Tasks REST endpoint
    v2.include_router(task_resources.router)
    v2.include_router(task_actions.router)
    v2.include_router(task_statistics.router)

    # System REST endpoint
    v2.include_router(system_applications.router)
    v2.include_router(system_general.router)
    v2.include_router(system_banner.router)
    v2.include_router(system_statistics.router)
    v2.include_router(system_authentication.router)
    v2.include_router(system_image_upload.router)

    # Notifications REST endpoint
    v2.include_router(notification_actions.router)
    v2.include_router(notification_resources.router)

    api.include_router(v2)
