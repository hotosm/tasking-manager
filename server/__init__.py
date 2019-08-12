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
    Define the routes the API exposes using Flask-Restful.  See docs here
    http://flask-restful-cn.readthedocs.org/en/0.3.5/quickstart.html#endpoints
    """
    app.logger.debug("Adding routes to API endpoints")
    api = Api(app)

    from server.api.application_apis import ApplicationAPI
    from server.api.users.authentication_apis import LoginAPI, OAuthAPI, AuthEmailAPI
    from server.api.health_check_api import HealthCheckAPI
    from server.api.license_apis import LicenseAPI, LicenceListAPI
    from server.api.mapping_apis import (
        MappingTaskAPI,
        LockTaskForMappingAPI,
        UnlockTaskForMappingAPI,
        StopMappingAPI,
        CommentOnTaskAPI,
        TasksAsJson,
        TasksAsGPX,
        TasksAsOSM,
        UndoMappingAPI,
    )
    from server.api.messaging.message_apis import (
        ProjectsMessageAll,
        HasNewMessages,
        GetAllMessages,
        MessagesAPI,
        DeleteMultipleMessages,
        ResendEmailValidationAPI,
    )
    from server.api.messaging.project_chat_apis import ProjectChatAPI
    from server.api.project_admin_api import (
        ProjectAdminAPI,
        ProjectInvalidateAll,
        ProjectValidateAll,
        ProjectMapAll,
        ProjectResetAll,
        ProjectResetBadImagery,
        ProjectsForAdminAPI,
        ProjectTransfer,
    )
    from server.api.project_apis import (
        ProjectAPI,
        ProjectAOIAPI,
        ProjectSearchAPI,
        HasUserTaskOnProject,
        HasUserTaskOnProjectDetails,
        ProjectSearchBBoxAPI,
        ProjectSummaryAPI,
        ProjectNoTasksAPI,
        ProjectNoGeometriesAPI,
        TaskAnnotationsAPI,
    )
    from server.api.swagger_docs_api import SwaggerDocsAPI
    from server.api.stats_api import (
        StatsContributionsAPI,
        StatsActivityAPI,
        StatsProjectAPI,
        HomePageStatsAPI,
        StatsUserAPI,
        StatsProjectUserAPI,
        StatsContributionsByDayAPI,
    )
    from server.api.tags_apis import CampaignsTagsAPI, OrganisationTagsAPI
    from server.api.mapping_issues_apis import (
        MappingIssueCategoryAPI,
        MappingIssueCategoriesAPI,
    )
    from server.api.users.user_apis import (
        UserAPI,
        UserIdAPI,
        UserOSMAPI,
        UserMappedProjects,
        UserSetRole,
        UserSetLevel,
        UserSetExpertMode,
        UserAcceptLicense,
        UserSearchFilterAPI,
        UserSearchAllAPI,
        UserUpdateAPI,
        UserContributionsAPI,
    )
    from server.api.validator_apis import (
        LockTasksForValidationAPI,
        UnlockTasksAfterValidationAPI,
        StopValidatingAPI,
        MappedTasksByUser,
        UserInvalidatedTasks,
    )
    from server.api.grid.grid_apis import IntersectingTilesAPI
    from server.api.grid.split_task_apis import SplitTaskAPI
    from server.api.settings_apis import LanguagesAPI

    api.add_resource(SwaggerDocsAPI, "/api/v2/system/docs/json")
    api.add_resource(HealthCheckAPI, "/api/v2/system/heartbeat")
    api.add_resource(
        ProjectAdminAPI, "/api/v2/projects", endpoint="create_project", methods=["POST"]
    )
    api.add_resource(
        ProjectAdminAPI,
        "/api/v2/projects/<int:project_id>",
        methods=["PATCH", "DELETE"],
    )
    api.add_resource(
        ProjectNoTasksAPI, "/api/v2/projects/<int:project_id>/queries/notasks"
    )
    api.add_resource(
        ProjectInvalidateAll,
        "/api/v2/projects/<int:project_id>/tasks/actions/invalidate-all",
    )
    api.add_resource(
        ProjectValidateAll,
        "/api/v2/projects/<int:project_id>/tasks/actions/validate-all",
    )
    api.add_resource(
        ProjectMapAll, "/api/v2/projects/<int:project_id>/tasks/actions/map-all"
    )
    api.add_resource(
        ProjectResetBadImagery,
        "/api/v2/projects/<int:project_id>/tasks/actions/reset-all-badimagery",
    )
    api.add_resource(
        ProjectResetAll, "/api/v2/projects/<int:project_id>/tasks/actions/reset-all"
    )
    api.add_resource(
        ProjectsMessageAll,
        "/api/v2/projects/<int:project_id>/actions/message-contributors",
    )
    api.add_resource(
        ProjectTransfer, "/api/v2/projects/<int:project_id>/actions/transfer-ownership"
    )
    api.add_resource(ProjectsForAdminAPI, "/api/v2/projects/queries/myself/owner")
    api.add_resource(
        ApplicationAPI,
        "/api/v2/system/authentication/applications",
        methods=["POST", "GET"],
    )
    api.add_resource(
        ApplicationAPI,
        "/api/v2/system/authentication/applications/<string:application_key>",
        endpoint="delete_application",
        methods=["DELETE"],
    )
    api.add_resource(
        ApplicationAPI,
        "/api/v2/system/authentication/applications/<string:application_key>",
        endpoint="check_application",
        methods=["PATCH"],
    )
    api.add_resource(LoginAPI, "/api/v2/system/authentication/login")
    api.add_resource(OAuthAPI, "/api/v2/system/authentication/callback")
    api.add_resource(AuthEmailAPI, "/api/v2/system/authentication/email")
    api.add_resource(
        LicenseAPI, "/api/v2/licenses", endpoint="create_license", methods=["POST"]
    )
    api.add_resource(
        LicenseAPI,
        "/api/v2/licenses/<int:license_id>",
        methods=["GET", "PATCH", "DELETE"],
    )
    api.add_resource(LicenceListAPI, "/api/v2/licenses")
    api.add_resource(HasNewMessages, "/api/v2/messages/has-new-messages")
    api.add_resource(GetAllMessages, "/api/v2/messages/get-all-messages")
    api.add_resource(MessagesAPI, "/api/v2/messages/<int:message_id>")
    api.add_resource(
        DeleteMultipleMessages, "/api/v2/messages/delete-multiple", methods=["DELETE"]
    )
    api.add_resource(
        ResendEmailValidationAPI, "/api/v2/messages/resend-email-verification"
    )
    api.add_resource(ProjectSearchAPI, "/api/v2/projects")
    api.add_resource(ProjectSearchBBoxAPI, "/api/v2/projects/bbox")
    api.add_resource(
        ProjectNoGeometriesAPI, "/api/v2/projects/<int:project_id>/queries/nogeometries"
    )
    api.add_resource(ProjectAPI, "/api/v2/projects/<int:project_id>", methods=["GET"])
    api.add_resource(ProjectAOIAPI, "/api/v2/projects/<int:project_id>/queries/aoi")
    api.add_resource(
        ProjectChatAPI,
        "/api/v2/projects/<int:project_id>/comments",
        methods=["GET", "POST"],
    )
    api.add_resource(
        HasUserTaskOnProject,
        "/api/v2/projects/<int:project_id>/tasks/queries/own/locked",
    )
    api.add_resource(
        HasUserTaskOnProjectDetails,
        "/api/v2/projects/<int:project_id>/tasks/queries/own/locked/details",
    )
    api.add_resource(
        MappedTasksByUser, "/api/v2/projects/<int:project_id>/tasks/queries/own/mapped"
    )
    api.add_resource(
        ProjectSummaryAPI, "/api/v2/projects/<int:project_id>/queries/summary"
    )
    api.add_resource(
        TasksAsJson, "/api/v2/projects/<int:project_id>/tasks/queries/json"
    )
    api.add_resource(TasksAsGPX, "/api/v2/projects/<int:project_id>/tasks/queries/gpx")
    api.add_resource(TasksAsOSM, "/api/v2/projects/<int:project_id>/tasks/queries/xml")
    api.add_resource(
        LockTaskForMappingAPI,
        "/api/v2/projects/<int:project_id>/tasks/actions/lock-for-mapping/<int:task_id>",
    )
    api.add_resource(
        UndoMappingAPI,
        "/api/v2/projects/<int:project_id>/tasks/actions/undo-mapping/<int:task_id>",
    )
    api.add_resource(
        MappingTaskAPI, "/api/v2/projects/<int:project_id>/tasks/<int:task_id>"
    )
    api.add_resource(
        UnlockTaskForMappingAPI,
        "/api/v2/projects/<int:project_id>/tasks/actions/unlock-after-mapping/<int:task_id>",
    )
    api.add_resource(
        StopMappingAPI,
        "/api/v2/projects/<int:project_id>/tasks/actions/stop-mapping/<int:task_id>",
    )
    api.add_resource(
        CommentOnTaskAPI,
        "/api/v2/projects/<int:project_id>/comments/tasks/<int:task_id>",
        methods=["GET", "POST"],
    )
    api.add_resource(
        LockTasksForValidationAPI,
        "/api/v2/projects/<int:project_id>/tasks/actions/lock-for-validation",
    )
    api.add_resource(
        UnlockTasksAfterValidationAPI,
        "/api/v2/projects/<int:project_id>/tasks/actions/unlock-after-validation",
    )
    api.add_resource(
        StopValidatingAPI,
        "/api/v2/projects/<int:project_id>/tasks/actions/stop-validating",
    )
    api.add_resource(
        StatsContributionsAPI, "/api/v2/projects/<int:project_id>/contributions"
    )
    api.add_resource(
        StatsContributionsByDayAPI,
        "/api/v2/projects/<int:project_id>/contributions/day",
    )
    api.add_resource(
        TaskAnnotationsAPI,
        "/api/v2/projects/<int:project_id>/annotations/<string:annotation_type>",
        "/api/v2/projects/<int:project_id>/annotations",
        methods=["GET", "POST"],
    )
    api.add_resource(StatsActivityAPI, "/api/v2/projects/<int:project_id>/activities")
    api.add_resource(StatsProjectAPI, "/api/v2/projects/<int:project_id>/statistics")
    api.add_resource(
        StatsProjectUserAPI,
        "/api/v2/projects/<int:project_id>/statistics/user/<string:username>",
    )
    api.add_resource(StatsUserAPI, "/api/v2/users/<string:username>/statistics")
    api.add_resource(HomePageStatsAPI, "/api/v2/system/statistics")
    api.add_resource(CampaignsTagsAPI, "/api/v2/tags/campaigns")
    api.add_resource(OrganisationTagsAPI, "/api/v2/tags/organisations")
    api.add_resource(
        MappingIssueCategoriesAPI,
        "/api/v2/tasks/issues/categories",
        methods=["GET", "POST"],
    )
    api.add_resource(
        MappingIssueCategoryAPI,
        "/api/v2/tasks/issues/categories/<int:category_id>",
        methods=["GET", "PATCH", "DELETE"],
    )
    api.add_resource(UserSearchAllAPI, "/api/v2/users")
    api.add_resource(
        UserSearchFilterAPI, "/api/v2/users/queries/filter/<string:username>"
    )
    api.add_resource(UserAPI, "/api/v2/users/queries/<string:username>")
    api.add_resource(UserUpdateAPI, "/api/v2/users/<string:username>")
    api.add_resource(
        UserSetExpertMode,
        "/api/v2/users/<string:username>/actions/set-expert-mode/<string:is_expert>",
    )
    api.add_resource(
        UserMappedProjects, "/api/v2/projects/queries/<string:username>/touched"
    )
    api.add_resource(
        UserInvalidatedTasks,
        "/api/v2/projects/<int:project_id>/tasks/queries/own/invalidated",
    )
    api.add_resource(UserOSMAPI, "/api/v2/users/<string:username>/openstreetmap")
    api.add_resource(
        UserSetRole, "/api/v2/users/<string:username>/actions/set-role/<string:role>"
    )
    api.add_resource(
        UserSetLevel, "/api/v2/users/<string:username>/actions/set-level/<string:level>"
    )
    api.add_resource(
        UserAcceptLicense, "/api/v2/licenses/<int:license_id>/actions/accept-for-me"
    )
    api.add_resource(UserIdAPI, "/api/v2/users/<int:userid>")
    api.add_resource(UserContributionsAPI, "/api/v2/users/<int:userid>/contributions")
    api.add_resource(
        IntersectingTilesAPI, "/api/v2/projects/<int:project_id>/tasks/queries/aoi"
    )
    api.add_resource(
        SplitTaskAPI,
        "/api/v2/projects/<int:project_id>/tasks/<int:task_id>/actions/split",
    )
    api.add_resource(LanguagesAPI, "/api/v2/system/languages")
