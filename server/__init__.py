import logging
import os
from logging.handlers import RotatingFileHandler

from flask import Flask, render_template, current_app, send_from_directory
from flask_cors import CORS
from flask_migrate import Migrate
from flask_oauthlib.client import OAuth
from flask_restful import Api
from flask_sqlalchemy import SQLAlchemy

db = SQLAlchemy()
migrate = Migrate()
oauth = OAuth()

osm = oauth.remote_app("osm", app_key="OSM_OAUTH_SETTINGS")

# Import all models so that they are registered with SQLAlchemy
from server.models.postgis import *  # noqa


def create_app(env=None):
    """
    Bootstrap function to initialise the Flask app and config
    :return: Initialised Flask app
    """

    app = Flask(
        __name__,
        static_folder="../frontend/build/static",
        template_folder="../frontend/build",
    )

    # Load configuration options from environment
    app.config.from_object(f"server.config.EnvironmentConfig")

    # Enable logging to files
    initialise_logger(app)
    app.logger.info(f"Starting up a new Tasking Manager application")

    # Connect to database
    app.logger.debug(f"Connecting to the databse")
    db.init_app(app)
    migrate.init_app(app, db)

    app.logger.debug(f"Initialising frontend routes")

    # Main route to frontend
    @app.route("/")
    def index():
        return render_template("index.html")

    @app.route("/<path:text>")
    def assets(text):
        if "service-worker.js" in text:
            return send_from_directory(app.template_folder, text)
        elif "precache-manifest" in text:
            return send_from_directory(app.template_folder, text)
        elif "manifest.json" in text:
            return send_from_directory(app.template_folder, text)
        elif "favicon" in text:
            return send_from_directory(app.template_folder, text)
        else:
            return render_template("index.html")

    # Route to Swagger UI
    @app.route("/api-docs/")
    def api():
        api_url = current_app.config["API_DOCS_URL"]
        return render_template("swagger.html", doc_link=api_url)

    # Add paths to API endpoints
    add_api_endpoints(app)

    # Enables CORS on all API routes, meaning API is callable from anywhere
    CORS(app)

    # Add basic oauth setup
    app.secret_key = app.config[
        "SECRET_KEY"
    ]  # Required by itsdangeroud, Flask-OAuthlib for creating entropy
    oauth.init_app(app)

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
    from server.services.stats_service import StatsService

    with app.app_context():
        StatsService.get_homepage_stats()


def add_api_endpoints(app):
    """
    Define the routes the API exposes using Flask-Restful.
    """
    app.logger.debug("Adding routes to API endpoints")
    api = Api(app)

    # Projects API import
    from server.api.projects.resources import (
        ProjectsRestAPI,
        ProjectsAllAPI,
        ProjectsQueriesBboxAPI,
        ProjectsQueriesOwnerAPI,
        ProjectsQueriesTouchedAPI,
        ProjectsQueriesSummaryAPI,
        ProjectsQueriesNoGeometriesAPI,
        ProjectsQueriesNoTasksAPI,
        ProjectsQueriesAoiAPI,
        ProjectsQueriesFeaturedAPI,
    )
    from server.api.projects.activities import (
        ProjectsActivitiesAPI,
        ProjectsLastActivitiesAPI,
    )
    from server.api.projects.contributions import (
        ProjectsContributionsAPI,
        ProjectsContributionsQueriesDayAPI,
    )
    from server.api.projects.statistics import (
        ProjectsStatisticsAPI,
        ProjectsStatisticsQueriesUsernameAPI,
        ProjectsStatisticsQueriesPopularAPI,
    )
    from server.api.projects.teams import ProjectsTeamsAPI
    from server.api.projects.campaigns import ProjectsCampaignsAPI
    from server.api.projects.actions import (
        ProjectsActionsTransferAPI,
        ProjectsActionsMessageContributorsAPI,
        ProjectsActionsFeatureAPI,
        ProjectsActionsUnFeatureAPI,
    )

    from server.api.projects.favorites import ProjectFavoriteAPI

    # Tasks API import
    from server.api.tasks.resources import (
        TasksRestAPI,
        TasksQueriesJsonAPI,
        TasksQueriesXmlAPI,
        TasksQueriesGpxAPI,
        TasksQueriesAoiAPI,
        TasksQueriesOwnLockedAPI,
        TasksQueriesOwnLockedDetailsAPI,
        TasksQueriesOwnMappedAPI,
        TasksQueriesOwnInvalidatedAPI,
    )
    from server.api.tasks.actions import (
        TasksActionsMappingLockAPI,
        TasksActionsMappingStopAPI,
        TasksActionsMappingUnlockAPI,
        TasksActionsMappingUndoAPI,
        TasksActionsValidationLockAPI,
        TasksActionsValidatioStopAPI,
        TasksActionsValidationUnlockAPI,
        TasksActionsMapAllAPI,
        TasksActionsValidateAllAPI,
        TasksActionsInvalidateAllAPI,
        TasksActionsResetBadImageryAllAPI,
        TasksActionsResetAllAPI,
        TasksActionsSplitAPI,
    )

    # Comments API impor
    from server.api.comments.resources import (
        CommentsProjectsRestAPI,
        CommentsTasksRestAPI,
    )

    # Annotations API import
    from server.api.annotations.resources import AnnotationsRestAPI

    # Issues API import
    from server.api.issues.resources import IssuesRestAPI, IssuesAllAPI

    # Licenses API import
    from server.api.licenses.resources import LicensesRestAPI, LicensesAllAPI
    from server.api.licenses.actions import LicensesActionsAcceptAPI

    # Campaigns API endpoint
    from server.api.campaigns.resources import CampaignsRestAPI, CampaignsAllAPI

    # Organisations API endpoint
    from server.api.organisations.resources import (
        OrganisationsRestAPI,
        OrganisationsAllAPI,
    )
    from server.api.organisations.campaigns import OrganisationsCampaignsAPI

    # Countries API endpoint
    from server.api.countries.resources import CountriesRestAPI

    # Teams API endpoint
    from server.api.teams.resources import TeamsRestAPI, TeamsAllAPI
    from server.api.teams.actions import (
        TeamsActionsJoinAPI,
        TeamsActionsLeaveAPI,
        TeamsActionsLeaveMultipleAPI,
    )

    # Notifications API endpoint
    from server.api.notifications.resources import (
        NotificationsRestAPI,
        NotificationsAllAPI,
        NotificationsQueriesCountUnreadAPI,
    )
    from server.api.notifications.actions import NotificationsActionsDeleteMultipleAPI

    # Users API endpoint
    from server.api.users.resources import (
        UsersRestAPI,
        UsersAllAPI,
        UsersQueriesUsernameAPI,
        UsersQueriesUsernameFilterAPI,
        UserFavoritesAPI,
    )
    from server.api.users.actions import (
        UsersActionsSetUsersAPI,
        UsersActionsSetLevelAPI,
        UsersActionsSetRoleAPI,
        UsersActionsSetExpertModeAPI,
        UsersActionsVerifyEmailAPI,
    )
    from server.api.users.openstreetmap import UsersOpenStreetMapAPI
    from server.api.users.statistics import UsersStatisticsAPI

    # System API endpoint
    from server.api.system.general import SystemDocsAPI
    from server.api.system.general import SystemHeartbeatAPI
    from server.api.system.general import SystemLanguagesAPI
    from server.api.system.statistics import SystemStatisticsAPI
    from server.api.system.authentication import (
        SystemAuthenticationEmailAPI,
        SystemAuthenticationLoginAPI,
        SystemAuthenticationCallbackAPI,
    )
    from server.api.system.applications import SystemApplicationsRestAPI

    # Projects REST endpoint
    api.add_resource(ProjectsAllAPI, "/api/v2/projects/", methods=["GET"])
    api.add_resource(
        ProjectsRestAPI,
        "/api/v2/projects/",
        endpoint="create_project",
        methods=["POST"],
    )
    api.add_resource(
        ProjectsRestAPI,
        "/api/v2/projects/<int:project_id>/",
        methods=["GET", "PATCH", "DELETE"],
    )

    # Projects queries endoints (TODO: Refactor them into the REST endpoints)
    api.add_resource(ProjectsQueriesBboxAPI, "/api/v2/projects/queries/bbox/")
    api.add_resource(ProjectsQueriesOwnerAPI, "/api/v2/projects/queries/myself/owner/")
    api.add_resource(
        ProjectsQueriesTouchedAPI, "/api/v2/projects/queries/<string:username>/touched/"
    )
    api.add_resource(
        ProjectsQueriesSummaryAPI, "/api/v2/projects/<int:project_id>/queries/summary/"
    )
    api.add_resource(
        ProjectsQueriesNoGeometriesAPI,
        "/api/v2/projects/<int:project_id>/queries/nogeometries/",
    )
    api.add_resource(
        ProjectsQueriesNoTasksAPI, "/api/v2/projects/<int:project_id>/queries/notasks/"
    )
    api.add_resource(
        ProjectsQueriesAoiAPI, "/api/v2/projects/<int:project_id>/queries/aoi/"
    )
    api.add_resource(ProjectsQueriesFeaturedAPI, "/api/v2/projects/queries/featured")

    # Projects' addtional resources
    api.add_resource(
        ProjectsActivitiesAPI, "/api/v2/projects/<int:project_id>/activities/"
    )
    api.add_resource(
        ProjectsLastActivitiesAPI,
        "/api/v2/projects/<int:project_id>/activities/latest/",
    )
    api.add_resource(
        ProjectsContributionsAPI, "/api/v2/projects/<int:project_id>/contributions/"
    )
    api.add_resource(
        ProjectsContributionsQueriesDayAPI,
        "/api/v2/projects/<int:project_id>/contributions/queries/day/",
    )
    api.add_resource(
        ProjectsStatisticsAPI, "/api/v2/projects/<int:project_id>/statistics/"
    )

    api.add_resource(
        ProjectsStatisticsQueriesUsernameAPI,
        "/api/v2/projects/<int:project_id>/statistics/queries/<string:username>/",
    )

    api.add_resource(
        ProjectsStatisticsQueriesPopularAPI, "/api/v2/projects/queries/popular/"
    )

    api.add_resource(
        ProjectsTeamsAPI,
        "/api/v2/projects/<int:project_id>/teams",
        endpoint="get_all_project_teams",
        methods=["GET"],
    )
    api.add_resource(
        ProjectsTeamsAPI,
        "/api/v2/projects/<int:project_id>/teams/<int:team_id>",
        methods=["PUT", "DELETE", "PATCH"],
    )
    api.add_resource(
        ProjectsCampaignsAPI,
        "/api/v2/projects/<int:project_id>/campaigns",
        endpoint="get_all_project_campaigns",
        methods=["GET"],
    )
    api.add_resource(
        ProjectsCampaignsAPI,
        "/api/v2/projects/<int:project_id>/campaigns/<int:campaign_id>",
        endpoint="assign_remove_campaign_to_project",
        methods=["PUT", "DELETE"],
    )

    # Projects actions endoints
    api.add_resource(
        ProjectsActionsMessageContributorsAPI,
        "/api/v2/projects/<int:project_id>/actions/message-contributors/",
    )
    api.add_resource(
        ProjectsActionsTransferAPI,
        "/api/v2/projects/<int:project_id>/actions/transfer-ownership/",
    )
    api.add_resource(
        ProjectsActionsFeatureAPI, "/api/v2/projects/<int:project_id>/actions/feature"
    )
    api.add_resource(
        ProjectsActionsUnFeatureAPI,
        "/api/v2/projects/<int:project_id>/actions/remove-feature",
        methods=["POST"],
    )

    api.add_resource(
        ProjectFavoriteAPI,
        "/api/v2/projects/<int:project_id>/favorite/",
        methods=["GET", "POST", "DELETE"],
    )

    # Tasks REST endpoint
    api.add_resource(
        TasksRestAPI, "/api/v2/projects/<int:project_id>/tasks/<int:task_id>/"
    )

    # Tasks queries endoints (TODO: Refactor them into the REST endpoints)
    api.add_resource(TasksQueriesJsonAPI, "/api/v2/projects/<int:project_id>/tasks/")
    api.add_resource(
        TasksQueriesXmlAPI, "/api/v2/projects/<int:project_id>/tasks/queries/xml/"
    )
    api.add_resource(
        TasksQueriesGpxAPI, "/api/v2/projects/<int:project_id>/tasks/queries/gpx/"
    )
    api.add_resource(
        TasksQueriesAoiAPI, "/api/v2/projects/<int:project_id>/tasks/queries/aoi/"
    )
    api.add_resource(
        TasksQueriesOwnLockedAPI,
        "/api/v2/projects/<int:project_id>/tasks/queries/own/locked/",
    )
    api.add_resource(
        TasksQueriesOwnLockedDetailsAPI,
        "/api/v2/projects/<int:project_id>/tasks/queries/own/locked/details/",
    )
    api.add_resource(
        TasksQueriesOwnMappedAPI,
        "/api/v2/projects/<int:project_id>/tasks/queries/own/mapped/",
    )
    api.add_resource(
        TasksQueriesOwnInvalidatedAPI,
        "/api/v2/projects/<int:project_id>/tasks/queries/own/invalidated/",
    )

    # Tasks actions endoints
    api.add_resource(
        TasksActionsMappingLockAPI,
        "/api/v2/projects/<int:project_id>/tasks/actions/lock-for-mapping/<int:task_id>/",
    )
    api.add_resource(
        TasksActionsMappingStopAPI,
        "/api/v2/projects/<int:project_id>/tasks/actions/stop-mapping/<int:task_id>/",
    )
    api.add_resource(
        TasksActionsMappingUnlockAPI,
        "/api/v2/projects/<int:project_id>/tasks/actions/unlock-after-mapping/<int:task_id>/",
    )
    api.add_resource(
        TasksActionsMappingUndoAPI,
        "/api/v2/projects/<int:project_id>/tasks/actions/undo-mapping/<int:task_id>/",
    )
    api.add_resource(
        TasksActionsValidationLockAPI,
        "/api/v2/projects/<int:project_id>/tasks/actions/lock-for-validation/",
    )
    api.add_resource(
        TasksActionsValidatioStopAPI,
        "/api/v2/projects/<int:project_id>/tasks/actions/stop-validating/",
    )
    api.add_resource(
        TasksActionsValidationUnlockAPI,
        "/api/v2/projects/<int:project_id>/tasks/actions/unlock-after-validation/",
    )
    api.add_resource(
        TasksActionsMapAllAPI,
        "/api/v2/projects/<int:project_id>/tasks/actions/map-all/",
    )
    api.add_resource(
        TasksActionsValidateAllAPI,
        "/api/v2/projects/<int:project_id>/tasks/actions/validate-all/",
    )
    api.add_resource(
        TasksActionsInvalidateAllAPI,
        "/api/v2/projects/<int:project_id>/tasks/actions/invalidate-all/",
    )
    api.add_resource(
        TasksActionsResetBadImageryAllAPI,
        "/api/v2/projects/<int:project_id>/tasks/actions/reset-all-badimagery/",
    )
    api.add_resource(
        TasksActionsResetAllAPI,
        "/api/v2/projects/<int:project_id>/tasks/actions/reset-all/",
    )
    api.add_resource(
        TasksActionsSplitAPI,
        "/api/v2/projects/<int:project_id>/tasks/<int:task_id>/actions/split/",
    )

    # Comments REST endoints
    api.add_resource(
        CommentsProjectsRestAPI,
        "/api/v2/projects/<int:project_id>/comments/",
        methods=["GET", "POST"],
    )
    api.add_resource(
        CommentsTasksRestAPI,
        "/api/v2/projects/<int:project_id>/comments/tasks/<int:task_id>/",
        methods=["GET", "POST"],
    )

    # Annotations REST endoints
    api.add_resource(
        AnnotationsRestAPI,
        "/api/v2/projects/<int:project_id>/annotations/<string:annotation_type>/",
        "/api/v2/projects/<int:project_id>/annotations/",
        methods=["GET", "POST"],
    )

    # Issues REST endpoints
    api.add_resource(
        IssuesAllAPI, "/api/v2/tasks/issues/categories/", methods=["GET", "POST"]
    )
    api.add_resource(
        IssuesRestAPI,
        "/api/v2/tasks/issues/categories/<int:category_id>/",
        methods=["GET", "PATCH", "DELETE"],
    )

    # Licenses REST endpoints
    api.add_resource(LicensesAllAPI, "/api/v2/licenses/")
    api.add_resource(
        LicensesRestAPI,
        "/api/v2/licenses/",
        endpoint="create_license",
        methods=["POST"],
    )
    api.add_resource(
        LicensesRestAPI,
        "/api/v2/licenses/<int:license_id>/",
        methods=["GET", "PATCH", "DELETE"],
    )

    # Licenses actions endpoint
    api.add_resource(
        LicensesActionsAcceptAPI,
        "/api/v2/licenses/<int:license_id>/actions/accept-for-me/",
    )

    # Countries REST endpoints
    api.add_resource(CountriesRestAPI, "/api/v2/countries/")

    # Organisations REST endpoints
    api.add_resource(OrganisationsAllAPI, "/api/v2/organisations", methods=["GET"])
    api.add_resource(
        OrganisationsAllAPI,
        "/api/v2/organisations",
        endpoint="create_organisation",
        methods=["POST"],
    )
    api.add_resource(
        OrganisationsRestAPI,
        "/api/v2/organisations/<int:organisation_id>",
        endpoint="get_organisation",
        methods=["GET"],
    )
    api.add_resource(
        OrganisationsRestAPI,
        "/api/v2/organisations/<int:organisation_id>",
        methods=["PUT", "DELETE"],
    )

    # Organisations additional resources endpoints
    api.add_resource(
        OrganisationsCampaignsAPI,
        "/api/v2/organisations/<int:organisation_id>/campaigns",
        endpoint="get_all_organisation_campaigns",
        methods=["GET"],
    )
    api.add_resource(
        OrganisationsCampaignsAPI,
        "/api/v2/organisations/<int:organisation_id>/campaigns/<int:campaign_id>",
        endpoint="assign_campaign_to_organisation",
        methods=["PUT", "DELETE"],
    )

    # Teams REST endpoints
    api.add_resource(TeamsAllAPI, "/api/v2/teams", methods=["GET"])
    api.add_resource(
        TeamsAllAPI, "/api/v2/teams", endpoint="create_team", methods=["POST"]
    )
    api.add_resource(
        TeamsRestAPI, "/api/v2/teams/<int:team_id>", methods=["GET", "PUT", "DELETE"]
    )

    # Teams actions endpoints
    api.add_resource(
        TeamsActionsJoinAPI,
        "/api/v2/teams/<int:team_id>/actions/join",
        methods=["POST"],
    )
    api.add_resource(
        TeamsActionsLeaveAPI,
        "/api/v2/teams/<int:team_id>/actions/leave",
        endpoint="leave_team",
        methods=["POST"],
    )
    api.add_resource(
        TeamsActionsLeaveMultipleAPI,
        "/api/v2/teams/<int:team_id>/actions/remove-users",
        endpoint="remove_users_from_team",
        methods=["POST"],
    )

    # Campaigns REST endpoints
    api.add_resource(
        CampaignsAllAPI,
        "/api/v2/campaigns",
        endpoint="get_all_campaign",
        methods=["GET"],
    )
    api.add_resource(
        CampaignsAllAPI,
        "/api/v2/campaigns",
        endpoint="create_campaign",
        methods=["POST"],
    )
    api.add_resource(
        CampaignsRestAPI,
        "/api/v2/campaigns/<int:campaign_id>",
        methods=["GET", "PUT", "DELETE"],
    )

    # Notifications REST endpoints
    api.add_resource(NotificationsRestAPI, "/api/v2/notifications/<int:message_id>/")
    api.add_resource(NotificationsAllAPI, "/api/v2/notifications/")
    api.add_resource(
        NotificationsQueriesCountUnreadAPI,
        "/api/v2/notifications/queries/myself/count-unread/",
    )

    # Notifications Actions endpoints
    api.add_resource(
        NotificationsActionsDeleteMultipleAPI,
        "/api/v2/notifications/delete-multiple/",
        methods=["DELETE"],
    )

    # Users REST endpoint
    api.add_resource(UsersAllAPI, "/api/v2/users/")
    api.add_resource(UsersRestAPI, "/api/v2/users/<int:userid>/")
    api.add_resource(
        UsersQueriesUsernameFilterAPI, "/api/v2/users/queries/filter/<string:username>/"
    )
    api.add_resource(
        UsersQueriesUsernameAPI, "/api/v2/users/queries/<string:username>/"
    )
    api.add_resource(UserFavoritesAPI, "/api/v2/users/queries/favorites/")

    # Users Actions endpoint
    api.add_resource(UsersActionsSetUsersAPI, "/api/v2/users/actions/set-user/")

    api.add_resource(
        UsersActionsSetLevelAPI,
        "/api/v2/users/<string:username>/actions/set-level/<string:level>/",
    )
    api.add_resource(
        UsersActionsSetRoleAPI,
        "/api/v2/users/<string:username>/actions/set-role/<string:role>/",
    )
    api.add_resource(
        UsersActionsSetExpertModeAPI,
        "/api/v2/users/<string:username>/actions/set-expert-mode/<string:is_expert>/",
    )
    api.add_resource(
        UsersActionsVerifyEmailAPI, "/api/v2/users/myself/actions/verify-email/"
    )

    # Users Statistics endpoint
    api.add_resource(UsersStatisticsAPI, "/api/v2/users/<string:username>/statistics/")

    # Users openstreetmap endpoint
    api.add_resource(
        UsersOpenStreetMapAPI, "/api/v2/users/<string:username>/openstreetmap/"
    )

    # System endpoint
    api.add_resource(SystemDocsAPI, "/api/v2/system/docs/json/")
    api.add_resource(SystemHeartbeatAPI, "/api/v2/system/heartbeat/")
    api.add_resource(SystemLanguagesAPI, "/api/v2/system/languages/")
    api.add_resource(SystemStatisticsAPI, "/api/v2/system/statistics/")
    api.add_resource(
        SystemAuthenticationLoginAPI, "/api/v2/system/authentication/login/"
    )
    api.add_resource(
        SystemAuthenticationCallbackAPI, "/api/v2/system/authentication/callback/"
    )
    api.add_resource(
        SystemAuthenticationEmailAPI, "/api/v2/system/authentication/email/"
    )
    api.add_resource(
        SystemApplicationsRestAPI,
        "/api/v2/system/authentication/applications/",
        methods=["POST", "GET"],
    )
    api.add_resource(
        SystemApplicationsRestAPI,
        "/api/v2/system/authentication/applications/<string:application_key>/",
        endpoint="delete_application",
        methods=["DELETE"],
    )
    api.add_resource(
        SystemApplicationsRestAPI,
        "/api/v2/system/authentication/applications/<string:application_key>/",
        endpoint="check_application",
        methods=["PATCH"],
    )
