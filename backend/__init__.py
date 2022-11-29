import logging
import os
from logging.handlers import RotatingFileHandler

from flask import Flask, redirect
from flask_cors import CORS
from flask_migrate import Migrate
from requests_oauthlib import OAuth2Session
from flask_restful import Api
from flask_sqlalchemy import SQLAlchemy
from flask_mail import Mail

from backend.config import EnvironmentConfig


def sentry_init():
    """Initialize sentry.io event tracking"""
    import sentry_sdk
    from sentry_sdk.integrations.flask import FlaskIntegration

    sentry_sdk.init(
        dsn=EnvironmentConfig.SENTRY_BACKEND_DSN,
        environment=EnvironmentConfig.ENVIRONMENT,
        integrations=[FlaskIntegration()],
        traces_sample_rate=0.1,
    )


def format_url(endpoint):
    parts = endpoint.strip("/")
    return "/api/{}/{}/".format(EnvironmentConfig.API_VERSION, parts)


db = SQLAlchemy()
migrate = Migrate()

mail = Mail()


osm = OAuth2Session(
    client_id=EnvironmentConfig.OAUTH_CLIENT_ID,
    scope=EnvironmentConfig.OAUTH_SCOPE,
    redirect_uri=EnvironmentConfig.OAUTH_REDIRECT_URI,
)

# Import all models so that they are registered with SQLAlchemy
from backend.models.postgis import *  # noqa


def create_app(env="backend.config.EnvironmentConfig"):
    """
    Bootstrap function to initialise the Flask app and config
    :return: Initialised Flask app
    """
    # If SENTRY_BACKEND_DSN is configured, init sentry_sdk tracking
    if EnvironmentConfig.SENTRY_BACKEND_DSN:
        sentry_init()

    app = Flask(__name__, template_folder="services/messaging/templates/")

    # Load configuration options from environment
    app.config.from_object(env)
    # Enable logging to files
    initialise_logger(app)
    app.logger.info("Starting up a new Tasking Manager application")

    # Connect to database
    app.logger.debug("Connecting to the database")
    db.init_app(app)
    migrate.init_app(app, db)
    mail.init_app(app)

    app.logger.debug("Add root redirect route")

    @app.route("/")
    def index_redirect():
        return redirect(format_url("system/heartbeat/"), code=302)

    # Add paths to API endpoints
    add_api_endpoints(app)

    # Enables CORS on all API routes, meaning API is callable from anywhere
    CORS(app)

    # Add basic oauth setup
    app.secret_key = app.config[
        "SECRET_KEY"
    ]  # Required by itsdangerous, Flask-OAuthlib for creating entropy

    return app


def initialise_logger(app):
    """
    Read environment config then initialise a 2MB rotating log.  Prod Log Level can be reduced to help diagnose Prod
    only issues.
    """
    log_dir = app.config["LOG_DIR"]
    log_level = app.config["LOG_LEVEL"]
    if not os.path.exists(log_dir):
        os.makedirs(log_dir)

    file_handler = RotatingFileHandler(
        log_dir + "/tasking-manager.log", "a", 2 * 1024 * 1024, 3
    )
    file_handler.setLevel(log_level)
    file_handler.setFormatter(
        logging.Formatter(
            "%(asctime)s %(levelname)s: %(message)s [in %(pathname)s:%(lineno)d]"
        )
    )
    app.logger.addHandler(file_handler)
    app.logger.setLevel(log_level)


def initialise_counters(app):
    """ Initialise homepage counters so that users don't see 0 users on first load of application"""
    from backend.services.stats_service import StatsService

    with app.app_context():
        StatsService.get_homepage_stats()


def add_api_endpoints(app):
    """
    Define the routes the API exposes using Flask-Restful.
    """
    app.logger.debug("Adding routes to API endpoints")
    api = Api(app)

    # Projects API import
    from backend.api.projects.resources import (
        ProjectsRestAPI,
        ProjectsAllAPI,
        ProjectsQueriesBboxAPI,
        ProjectsQueriesOwnerAPI,
        ProjectsQueriesTouchedAPI,
        ProjectsQueriesSummaryAPI,
        ProjectsQueriesNoGeometriesAPI,
        ProjectsQueriesNoTasksAPI,
        ProjectsQueriesAoiAPI,
        ProjectsQueriesPriorityAreasAPI,
        ProjectsQueriesFeaturedAPI,
    )
    from backend.api.projects.activities import (
        ProjectsActivitiesAPI,
        ProjectsLastActivitiesAPI,
    )
    from backend.api.projects.contributions import (
        ProjectsContributionsAPI,
        ProjectsContributionsQueriesDayAPI,
    )
    from backend.api.projects.statistics import (
        ProjectsStatisticsAPI,
        ProjectsStatisticsQueriesUsernameAPI,
        ProjectsStatisticsQueriesPopularAPI,
    )
    from backend.api.projects.teams import ProjectsTeamsAPI
    from backend.api.projects.campaigns import ProjectsCampaignsAPI
    from backend.api.projects.actions import (
        ProjectsActionsTransferAPI,
        ProjectsActionsMessageContributorsAPI,
        ProjectsActionsFeatureAPI,
        ProjectsActionsUnFeatureAPI,
        ProjectsActionsSetInterestsAPI,
        ProjectActionsIntersectingTilesAPI,
    )

    from backend.api.projects.favorites import ProjectsFavoritesAPI

    # Tasks API import
    from backend.api.tasks.resources import (
        TasksRestAPI,
        TasksQueriesJsonAPI,
        TasksQueriesXmlAPI,
        TasksQueriesGpxAPI,
        TasksQueriesAoiAPI,
        TasksQueriesMappedAPI,
        TasksQueriesOwnInvalidatedAPI,
    )
    from backend.api.tasks.actions import (
        TasksActionsMappingLockAPI,
        TasksActionsMappingStopAPI,
        TasksActionsMappingUnlockAPI,
        TasksActionsMappingUndoAPI,
        TasksActionsValidationLockAPI,
        TasksActionsValidationStopAPI,
        TasksActionsValidationUnlockAPI,
        TasksActionsMapAllAPI,
        TasksActionsValidateAllAPI,
        TasksActionsInvalidateAllAPI,
        TasksActionsResetBadImageryAllAPI,
        TasksActionsResetAllAPI,
        TasksActionsSplitAPI,
        TasksActionsExtendAPI,
    )
    from backend.api.tasks.statistics import (
        TasksStatisticsAPI,
    )

    # Comments API impor
    from backend.api.comments.resources import (
        CommentsProjectsRestAPI,
        CommentsTasksRestAPI,
    )

    # Annotations API import
    from backend.api.annotations.resources import AnnotationsRestAPI

    # Issues API import
    from backend.api.issues.resources import IssuesRestAPI, IssuesAllAPI

    # Interests API import
    from backend.api.interests.resources import InterestsRestAPI, InterestsAllAPI

    # Licenses API import
    from backend.api.licenses.resources import LicensesRestAPI, LicensesAllAPI
    from backend.api.licenses.actions import LicensesActionsAcceptAPI

    # Campaigns API endpoint
    from backend.api.campaigns.resources import CampaignsRestAPI, CampaignsAllAPI

    # Organisations API endpoint
    from backend.api.organisations.resources import (
        OrganisationsStatsAPI,
        OrganisationsRestAPI,
        OrganisationsBySlugRestAPI,
        OrganisationsAllAPI,
    )
    from backend.api.organisations.campaigns import OrganisationsCampaignsAPI

    # Countries API endpoint
    from backend.api.countries.resources import CountriesRestAPI

    # Teams API endpoint
    from backend.api.teams.resources import TeamsRestAPI, TeamsAllAPI
    from backend.api.teams.actions import (
        TeamsActionsJoinAPI,
        TeamsActionsAddAPI,
        TeamsActionsLeaveAPI,
        TeamsActionsMessageMembersAPI,
    )

    # Notifications API endpoint
    from backend.api.notifications.resources import (
        NotificationsRestAPI,
        NotificationsAllAPI,
        NotificationsQueriesCountUnreadAPI,
        NotificationsQueriesPostUnreadAPI,
    )
    from backend.api.notifications.actions import NotificationsActionsDeleteMultipleAPI

    # Users API endpoint
    from backend.api.users.resources import (
        UsersRestAPI,
        UsersAllAPI,
        UsersQueriesUsernameAPI,
        UsersQueriesUsernameFilterAPI,
        UsersQueriesOwnLockedAPI,
        UsersQueriesOwnLockedDetailsAPI,
        UsersQueriesFavoritesAPI,
        UsersQueriesInterestsAPI,
        UsersRecommendedProjectsAPI,
    )
    from backend.api.users.tasks import UsersTasksAPI
    from backend.api.users.actions import (
        UsersActionsSetUsersAPI,
        UsersActionsSetLevelAPI,
        UsersActionsSetRoleAPI,
        UsersActionsSetExpertModeAPI,
        UsersActionsVerifyEmailAPI,
        UsersActionsRegisterEmailAPI,
        UsersActionsSetInterestsAPI,
    )
    from backend.api.users.openstreetmap import UsersOpenStreetMapAPI
    from backend.api.users.statistics import (
        UsersStatisticsAPI,
        UsersStatisticsInterestsAPI,
        UsersStatisticsAllAPI,
    )

    # System API endpoint
    from backend.api.system.general import (
        SystemDocsAPI,
        SystemHeartbeatAPI,
        SystemLanguagesAPI,
        SystemContactAdminRestAPI,
        SystemReleaseAPI,
    )
    from backend.api.system.banner import SystemBannerAPI
    from backend.api.system.statistics import SystemStatisticsAPI
    from backend.api.system.authentication import (
        SystemAuthenticationEmailAPI,
        SystemAuthenticationLoginAPI,
        SystemAuthenticationCallbackAPI,
    )
    from backend.api.system.applications import SystemApplicationsRestAPI
    from backend.api.system.image_upload import SystemImageUploadRestAPI

    # Projects REST endpoint
    api.add_resource(ProjectsAllAPI, format_url("projects/"), methods=["GET"])
    api.add_resource(
        ProjectsRestAPI,
        format_url("projects/"),
        endpoint="create_project",
        methods=["POST"],
    )
    api.add_resource(
        ProjectsRestAPI,
        format_url("projects/<int:project_id>/"),
        methods=["GET", "PATCH", "DELETE"],
    )

    # Projects queries endoints (TODO: Refactor them into the REST endpoints)
    api.add_resource(ProjectsQueriesBboxAPI, format_url("projects/queries/bbox/"))
    api.add_resource(
        ProjectsQueriesOwnerAPI, format_url("projects/queries/myself/owner/")
    )
    api.add_resource(
        ProjectsQueriesTouchedAPI,
        format_url("projects/queries/<string:username>/touched/"),
    )
    api.add_resource(
        ProjectsQueriesSummaryAPI,
        format_url("projects/<int:project_id>/queries/summary/"),
    )
    api.add_resource(
        ProjectsQueriesNoGeometriesAPI,
        format_url("projects/<int:project_id>/queries/nogeometries/"),
    )
    api.add_resource(
        ProjectsQueriesNoTasksAPI,
        format_url("projects/<int:project_id>/queries/notasks/"),
    )
    api.add_resource(
        ProjectsQueriesAoiAPI, format_url("projects/<int:project_id>/queries/aoi/")
    )
    api.add_resource(
        ProjectsQueriesPriorityAreasAPI,
        format_url("projects/<int:project_id>/queries/priority-areas/"),
    )
    api.add_resource(
        ProjectsQueriesFeaturedAPI, format_url("projects/queries/featured/")
    )

    # Projects' addtional resources
    api.add_resource(
        ProjectsActivitiesAPI, format_url("projects/<int:project_id>/activities/")
    )
    api.add_resource(
        ProjectsLastActivitiesAPI,
        format_url("projects/<int:project_id>/activities/latest/"),
    )
    api.add_resource(
        ProjectsContributionsAPI, format_url("projects/<int:project_id>/contributions/")
    )
    api.add_resource(
        ProjectsContributionsQueriesDayAPI,
        format_url("projects/<int:project_id>/contributions/queries/day/"),
    )
    api.add_resource(
        ProjectsStatisticsAPI, format_url("projects/<int:project_id>/statistics/")
    )

    api.add_resource(
        ProjectsStatisticsQueriesUsernameAPI,
        format_url("projects/<int:project_id>/statistics/queries/<string:username>/"),
    )

    api.add_resource(
        ProjectsStatisticsQueriesPopularAPI, format_url("projects/queries/popular/")
    )

    api.add_resource(
        ProjectsTeamsAPI,
        format_url("projects/<int:project_id>/teams/"),
        endpoint="get_all_project_teams",
        methods=["GET"],
    )
    api.add_resource(
        ProjectsTeamsAPI,
        format_url("projects/<int:project_id>/teams/<int:team_id>/"),
        methods=["POST", "DELETE", "PATCH"],
    )
    api.add_resource(
        ProjectsCampaignsAPI,
        format_url("projects/<int:project_id>/campaigns/"),
        endpoint="get_all_project_campaigns",
        methods=["GET"],
    )
    api.add_resource(
        ProjectsCampaignsAPI,
        format_url("projects/<int:project_id>/campaigns/<int:campaign_id>/"),
        endpoint="assign_remove_campaign_to_project",
        methods=["POST", "DELETE"],
    )

    # Projects actions endoints
    api.add_resource(
        ProjectsActionsMessageContributorsAPI,
        format_url("projects/<int:project_id>/actions/message-contributors/"),
    )
    api.add_resource(
        ProjectsActionsTransferAPI,
        format_url("projects/<int:project_id>/actions/transfer-ownership/"),
    )
    api.add_resource(
        ProjectsActionsFeatureAPI,
        format_url("projects/<int:project_id>/actions/feature/"),
    )
    api.add_resource(
        ProjectsActionsUnFeatureAPI,
        format_url("projects/<int:project_id>/actions/remove-feature/"),
        methods=["POST"],
    )

    api.add_resource(
        ProjectsFavoritesAPI,
        format_url("projects/<int:project_id>/favorite/"),
        methods=["GET", "POST", "DELETE"],
    )

    api.add_resource(
        ProjectsActionsSetInterestsAPI,
        format_url("projects/<int:project_id>/actions/set-interests/"),
        methods=["POST"],
    )

    api.add_resource(
        ProjectActionsIntersectingTilesAPI,
        format_url("projects/actions/intersecting-tiles/"),
        methods=["POST"],
    )

    api.add_resource(
        UsersActionsSetInterestsAPI,
        format_url("users/me/actions/set-interests/"),
        endpoint="create_user_interest",
        methods=["POST"],
    )

    api.add_resource(
        UsersStatisticsInterestsAPI,
        format_url("users/<int:user_id>/statistics/interests/"),
        methods=["GET"],
    )

    api.add_resource(
        InterestsAllAPI,
        format_url("interests/"),
        endpoint="create_interest",
        methods=["POST", "GET"],
    )
    api.add_resource(
        InterestsRestAPI,
        format_url("interests/<int:interest_id>/"),
        methods=["GET", "PATCH", "DELETE"],
    )

    # Tasks REST endpoint
    api.add_resource(
        TasksRestAPI, format_url("projects/<int:project_id>/tasks/<int:task_id>/")
    )

    # Tasks queries endoints (TODO: Refactor them into the REST endpoints)
    api.add_resource(
        TasksQueriesJsonAPI,
        format_url("projects/<int:project_id>/tasks/"),
        methods=["GET", "DELETE"],
    )
    api.add_resource(
        TasksQueriesXmlAPI, format_url("projects/<int:project_id>/tasks/queries/xml/")
    )
    api.add_resource(
        TasksQueriesGpxAPI, format_url("projects/<int:project_id>/tasks/queries/gpx/")
    )
    api.add_resource(
        TasksQueriesAoiAPI, format_url("projects/<int:project_id>/tasks/queries/aoi/")
    )
    api.add_resource(
        TasksQueriesMappedAPI,
        format_url("projects/<int:project_id>/tasks/queries/mapped/"),
    )
    api.add_resource(
        TasksQueriesOwnInvalidatedAPI,
        format_url("projects/<string:username>/tasks/queries/own/invalidated/"),
    )

    # Tasks actions endoints
    api.add_resource(
        TasksActionsMappingLockAPI,
        format_url(
            "projects/<int:project_id>/tasks/actions/lock-for-mapping/<int:task_id>/"
        ),
    )
    api.add_resource(
        TasksActionsMappingStopAPI,
        format_url(
            "projects/<int:project_id>/tasks/actions/stop-mapping/<int:task_id>/"
        ),
    )
    api.add_resource(
        TasksActionsMappingUnlockAPI,
        format_url(
            "projects/<int:project_id>/tasks/actions/unlock-after-mapping/<int:task_id>/"
        ),
    )
    api.add_resource(
        TasksActionsMappingUndoAPI,
        format_url(
            "projects/<int:project_id>/tasks/actions/undo-last-action/<int:task_id>/"
        ),
    )
    api.add_resource(
        TasksActionsExtendAPI,
        format_url("projects/<int:project_id>/tasks/actions/extend/"),
    )
    api.add_resource(
        TasksActionsValidationLockAPI,
        format_url("projects/<int:project_id>/tasks/actions/lock-for-validation/"),
    )
    api.add_resource(
        TasksActionsValidationStopAPI,
        format_url("projects/<int:project_id>/tasks/actions/stop-validation/"),
    )
    api.add_resource(
        TasksActionsValidationUnlockAPI,
        format_url("projects/<int:project_id>/tasks/actions/unlock-after-validation/"),
    )
    api.add_resource(
        TasksActionsMapAllAPI,
        format_url("projects/<int:project_id>/tasks/actions/map-all/"),
    )
    api.add_resource(
        TasksActionsValidateAllAPI,
        format_url("projects/<int:project_id>/tasks/actions/validate-all/"),
    )
    api.add_resource(
        TasksActionsInvalidateAllAPI,
        format_url("projects/<int:project_id>/tasks/actions/invalidate-all/"),
    )
    api.add_resource(
        TasksActionsResetBadImageryAllAPI,
        format_url("projects/<int:project_id>/tasks/actions/reset-all-badimagery/"),
    )
    api.add_resource(
        TasksActionsResetAllAPI,
        format_url("projects/<int:project_id>/tasks/actions/reset-all/"),
    )
    api.add_resource(
        TasksActionsSplitAPI,
        format_url("projects/<int:project_id>/tasks/actions/split/<int:task_id>/"),
    )

    # Tasks Statistics endpoint
    api.add_resource(
        TasksStatisticsAPI,
        format_url("tasks/statistics/"),
        methods=["GET"],
    )

    # Comments REST endoints
    api.add_resource(
        CommentsProjectsRestAPI,
        format_url("projects/<int:project_id>/comments/"),
        methods=["GET", "POST"],
    )
    api.add_resource(
        CommentsTasksRestAPI,
        format_url("projects/<int:project_id>/comments/tasks/<int:task_id>/"),
        methods=["GET", "POST"],
    )

    # Annotations REST endoints
    api.add_resource(
        AnnotationsRestAPI,
        format_url("projects/<int:project_id>/annotations/<string:annotation_type>/"),
        format_url("projects/<int:project_id>/annotations/"),
        methods=["GET", "POST"],
    )

    # Issues REST endpoints
    api.add_resource(
        IssuesAllAPI, format_url("tasks/issues/categories/"), methods=["GET", "POST"]
    )
    api.add_resource(
        IssuesRestAPI,
        format_url("tasks/issues/categories/<int:category_id>/"),
        methods=["GET", "PATCH", "DELETE"],
    )

    # Licenses REST endpoints
    api.add_resource(LicensesAllAPI, format_url("licenses/"))
    api.add_resource(
        LicensesRestAPI,
        format_url("licenses/"),
        endpoint="create_license",
        methods=["POST"],
    )
    api.add_resource(
        LicensesRestAPI,
        format_url("licenses/<int:license_id>/"),
        methods=["GET", "PATCH", "DELETE"],
    )

    # Licenses actions endpoint
    api.add_resource(
        LicensesActionsAcceptAPI,
        format_url("licenses/<int:license_id>/actions/accept-for-me/"),
    )

    # Countries REST endpoints
    api.add_resource(CountriesRestAPI, format_url("countries/"))

    # Organisations REST endpoints
    api.add_resource(OrganisationsAllAPI, format_url("organisations/"))
    api.add_resource(
        OrganisationsRestAPI,
        format_url("organisations/"),
        endpoint="create_organisation",
        methods=["POST"],
    )
    api.add_resource(
        OrganisationsRestAPI,
        format_url("organisations/<int:organisation_id>/"),
        endpoint="get_organisation",
        methods=["GET"],
    )
    api.add_resource(
        OrganisationsBySlugRestAPI,
        format_url("organisations/<string:slug>/"),
        endpoint="get_organisation_by_slug",
        methods=["GET"],
    )
    api.add_resource(
        OrganisationsRestAPI,
        format_url("organisations/<int:organisation_id>/"),
        methods=["PUT", "DELETE", "PATCH"],
    )

    # Organisations additional resources endpoints
    api.add_resource(
        OrganisationsStatsAPI,
        format_url("organisations/<int:organisation_id>/statistics/"),
        endpoint="get_organisation_stats",
        methods=["GET"],
    )
    api.add_resource(
        OrganisationsCampaignsAPI,
        format_url("organisations/<int:organisation_id>/campaigns/"),
        endpoint="get_all_organisation_campaigns",
        methods=["GET"],
    )
    api.add_resource(
        OrganisationsCampaignsAPI,
        format_url("organisations/<int:organisation_id>/campaigns/<int:campaign_id>/"),
        endpoint="assign_campaign_to_organisation",
        methods=["POST", "DELETE"],
    )

    # Teams REST endpoints
    api.add_resource(TeamsAllAPI, format_url("teams"), methods=["GET"])
    api.add_resource(
        TeamsAllAPI, format_url("teams/"), endpoint="create_team", methods=["POST"]
    )
    api.add_resource(
        TeamsRestAPI,
        format_url("teams/<int:team_id>/"),
        methods=["GET", "PUT", "DELETE", "PATCH"],
    )

    # Teams actions endpoints
    api.add_resource(
        TeamsActionsJoinAPI,
        format_url("teams/<int:team_id>/actions/join/"),
        methods=["POST", "PATCH"],
    )
    api.add_resource(
        TeamsActionsAddAPI,
        format_url("teams/<int:team_id>/actions/add/"),
        methods=["POST"],
    )
    api.add_resource(
        TeamsActionsLeaveAPI,
        format_url("teams/<int:team_id>/actions/leave/"),
        endpoint="leave_team",
        methods=["POST"],
    )
    api.add_resource(
        TeamsActionsMessageMembersAPI,
        format_url("teams/<int:team_id>/actions/message-members/"),
    )

    # Campaigns REST endpoints
    api.add_resource(
        CampaignsAllAPI,
        format_url("campaigns/"),
        endpoint="get_all_campaign",
        methods=["GET"],
    )
    api.add_resource(
        CampaignsAllAPI,
        format_url("campaigns/"),
        endpoint="create_campaign",
        methods=["POST"],
    )
    api.add_resource(
        CampaignsRestAPI,
        format_url("campaigns/<int:campaign_id>/"),
        methods=["GET", "PATCH", "DELETE"],
    )

    # Notifications REST endpoints
    api.add_resource(
        NotificationsRestAPI, format_url("notifications/<int:message_id>/")
    )
    api.add_resource(NotificationsAllAPI, format_url("notifications/"))
    api.add_resource(
        NotificationsQueriesCountUnreadAPI,
        format_url("notifications/queries/own/count-unread/"),
    )
    api.add_resource(
        NotificationsQueriesPostUnreadAPI,
        format_url("notifications/queries/own/post-unread/"),
        methods=["POST"],
    )
    # Notifications Actions endpoints
    api.add_resource(
        NotificationsActionsDeleteMultipleAPI,
        format_url("notifications/delete-multiple/"),
        methods=["DELETE"],
    )

    # Users REST endpoint
    api.add_resource(UsersAllAPI, format_url("users/"))
    api.add_resource(UsersRestAPI, format_url("users/<int:user_id>/"))
    api.add_resource(
        UsersQueriesUsernameFilterAPI,
        format_url("users/queries/filter/<string:username>/"),
    )
    api.add_resource(
        UsersQueriesUsernameAPI, format_url("users/queries/<string:username>/")
    )
    api.add_resource(UsersQueriesFavoritesAPI, format_url("users/queries/favorites/"))
    api.add_resource(
        UsersQueriesOwnLockedAPI, format_url("users/queries/tasks/locked/")
    )
    api.add_resource(
        UsersQueriesOwnLockedDetailsAPI,
        format_url("users/queries/tasks/locked/details/"),
    )

    # Users Actions endpoint
    api.add_resource(UsersActionsSetUsersAPI, format_url("users/me/actions/set-user/"))

    api.add_resource(
        UsersActionsSetLevelAPI,
        format_url("users/<string:username>/actions/set-level/<string:level>/"),
    )
    api.add_resource(
        UsersActionsSetRoleAPI,
        format_url("users/<string:username>/actions/set-role/<string:role>/"),
    )
    api.add_resource(
        UsersActionsSetExpertModeAPI,
        format_url(
            "users/<string:username>/actions/set-expert-mode/<string:is_expert>/"
        ),
    )

    api.add_resource(UsersTasksAPI, format_url("users/<int:user_id>/tasks/"))
    api.add_resource(
        UsersActionsVerifyEmailAPI, format_url("users/me/actions/verify-email/")
    )
    api.add_resource(
        UsersActionsRegisterEmailAPI, format_url("users/actions/register/")
    )

    # Users Statistics endpoint
    api.add_resource(
        UsersStatisticsAPI, format_url("users/<string:username>/statistics/")
    )

    api.add_resource(
        UsersStatisticsAllAPI,
        format_url("users/statistics/"),
    )
    # User RecommendedProjects endpoint
    api.add_resource(
        UsersRecommendedProjectsAPI,
        format_url("users/<string:username>/recommended-projects/"),
    )

    # User Interests endpoint
    api.add_resource(
        UsersQueriesInterestsAPI,
        format_url("users/<string:username>/queries/interests/"),
    )

    # Users openstreetmap endpoint
    api.add_resource(
        UsersOpenStreetMapAPI, format_url("users/<string:username>/openstreetmap/")
    )

    # System endpoint
    api.add_resource(SystemDocsAPI, format_url("system/docs/json/"))
    api.add_resource(
        SystemBannerAPI, format_url("system/banner/"), methods=["GET", "PATCH"]
    )
    api.add_resource(SystemHeartbeatAPI, format_url("system/heartbeat/"))
    api.add_resource(SystemLanguagesAPI, format_url("system/languages/"))
    api.add_resource(SystemStatisticsAPI, format_url("system/statistics/"))
    api.add_resource(
        SystemAuthenticationLoginAPI, format_url("system/authentication/login/")
    )
    api.add_resource(
        SystemAuthenticationCallbackAPI, format_url("system/authentication/callback/")
    )
    api.add_resource(
        SystemAuthenticationEmailAPI, format_url("system/authentication/email/")
    )
    api.add_resource(
        SystemImageUploadRestAPI,
        format_url("system/image-upload/"),
        methods=["POST"],
    )
    api.add_resource(
        SystemApplicationsRestAPI,
        format_url("system/authentication/applications/"),
        methods=["POST", "GET"],
    )
    api.add_resource(
        SystemApplicationsRestAPI,
        format_url("system/authentication/applications/<string:application_key>/"),
        endpoint="delete_application",
        methods=["DELETE"],
    )
    api.add_resource(
        SystemApplicationsRestAPI,
        format_url("system/authentication/applications/<string:application_key>/"),
        endpoint="check_application",
        methods=["PATCH"],
    )
    api.add_resource(
        SystemContactAdminRestAPI, format_url("system/contact-admin/"), methods=["POST"]
    )
    api.add_resource(SystemReleaseAPI, format_url("system/release/"), methods=["POST"])
