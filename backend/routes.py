from fastapi import APIRouter

from backend.api.annotations import resources as annotation_resources
from backend.api.campaigns import resources as campaign_resources
from backend.api.comments import resources as comment_resources
from backend.api.countries import resources as country_resources
from backend.api.interests import resources as interest_resources
from backend.api.issues import resources as issue_resources
from backend.api.licenses import actions as license_actions
from backend.api.licenses import resources as license_resources
from backend.api.mapping_levels import resources as mapping_levels_resources
from backend.api.notifications import actions as notification_actions
from backend.api.notifications import resources as notification_resources
from backend.api.organisations import campaigns as organisation_campaigns
from backend.api.organisations import resources as organisation_resources
from backend.api.partners import resources as partners_resources
from backend.api.partners import statistics as partners_statistics
from backend.api.projects import actions as project_actions
from backend.api.projects import activities as project_activities
from backend.api.projects import campaigns as project_campaigns
from backend.api.projects import contributions as project_contributions
from backend.api.projects import favorites as project_favorites
from backend.api.projects import partnerships as project_partnerships
from backend.api.projects import resources as project_resources
from backend.api.projects import statistics as project_statistics
from backend.api.projects import teams as project_teams
from backend.api.system import applications as system_applications
from backend.api.system import authentication as system_authentication
from backend.api.system import banner as system_banner
from backend.api.system import general as system_general
from backend.api.system import image_upload as system_image_upload
from backend.api.system import statistics as system_statistics
from backend.api.tasks import actions as task_actions
from backend.api.tasks import resources as task_resources
from backend.api.tasks import statistics as task_statistics
from backend.api.teams import actions as teams_actions
from backend.api.teams import resources as teams_resources
from backend.api.users import actions as user_actions
from backend.api.users import openstreetmap as users_openstreetmap
from backend.api.users import resources as user_resources
from backend.api.users import statistics as user_statistics
from backend.api.users import tasks as users_tasks

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
    v2.include_router(project_partnerships.router)

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
    v2.include_router(user_statistics.router)
    v2.include_router(user_resources.router)
    v2.include_router(users_openstreetmap.router)
    v2.include_router(users_tasks.router)
    v2.include_router(user_statistics.router)
    v2.include_router(user_actions.router)

    # Licenses REST endpoint
    v2.include_router(license_resources.router)
    v2.include_router(license_actions.router)

    # Mapping levels REST endpoint
    v2.include_router(mapping_levels_resources.router)

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

    # Issues REST endpoint
    v2.include_router(issue_resources.router)
    v2.include_router(partners_resources.router)
    v2.include_router(partners_statistics.router)

    api.include_router(v2)
