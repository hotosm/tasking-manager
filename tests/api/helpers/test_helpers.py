import base64
import json
import logging
import os
import xml.etree.ElementTree as ET
from typing import Tuple

from backend.exceptions import NotFound
import geojson
from sqlalchemy import select

from backend.models.dtos.organisation_dto import UpdateOrganisationDTO
from backend.models.dtos.project_dto import (
    DraftProjectDTO,
    ProjectDTO,
    ProjectInfoDTO,
    ProjectPriority,
    ProjectStatus,
)
from backend.models.postgis.campaign import Campaign
from backend.models.postgis.message import Message, MessageType
from backend.models.postgis.notification import Notification
from backend.models.postgis.organisation import Organisation
from backend.models.postgis.project import Project, ProjectTeams
from backend.models.postgis.statuses import (
    OrganisationType,
    TaskStatus,
    TeamJoinMethod,
    TeamVisibility,
)
from backend.models.postgis.mapping_level import MappingLevel
from backend.models.postgis.task import Task
from backend.models.postgis.team import Team, TeamMembers
from backend.models.postgis.user import User
from backend.services.interests_service import Interest
from backend.services.license_service import LicenseDTO, LicenseService
from backend.services.mapping_issues_service import (
    MappingIssueCategoryDTO,
    MappingIssueCategoryService,
)
from backend.services.organisation_service import OrganisationService
from backend.services.users.authentication_service import AuthenticationService

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


TEST_USER_ID = 777777
TEST_USERNAME = "Thinkwhere Test"
TEST_ORGANISATION_NAME = "Kathmandu Living Labs"
TEST_ORGANISATION_SLUG = "KLL"
TEST_ORGANISATION_ID = 23
TEST_PROJECT_NAME = "Test"
TEST_TEAM_NAME = "Test Team"
TEST_CAMPAIGN_NAME = "Test Campaign"
TEST_CAMPAIGN_ID = 1
TEST_MESSAGE_SUBJECT = "Test subject"
TEST_MESSAGE_DETAILS = "This is a test message"


def get_canned_osm_user_details():
    """Helper method to find test file, dependent on where tests are being run from"""

    location = os.path.join(
        os.path.dirname(__file__), "test_files", "osm_user_details.json"
    )
    try:
        with open(location, "r") as x:
            return json.load(x)
    except FileNotFoundError:
        raise FileNotFoundError("osm_user_details.json not found")


def get_canned_osm_user_json_details():
    """Helper method to find test file, dependent on where tests are being run from"""

    location = os.path.join(
        os.path.dirname(__file__), "test_files", "osm_user_details.json"
    )
    try:
        with open(location, "r") as x:
            return json.load(x)
    except FileNotFoundError:
        raise FileNotFoundError("osm_user_details.json not found")


def get_canned_osm_user_details_changed_name():
    """Helper method to find test file, dependent on where tests are being run from"""

    location = os.path.join(
        os.path.dirname(__file__), "test_files", "osm_user_details_changed_name.xml"
    )

    try:
        with open(location, "r"):
            return ET.parse(location)
    except FileNotFoundError:
        raise FileNotFoundError("osm_user_details_changed_name.xml not found")


def get_canned_json(name_of_file):
    """Read canned Grid request from file"""

    location = os.path.join(os.path.dirname(__file__), "test_files", name_of_file)

    try:
        with open(location, "r") as grid_file:
            data = json.load(grid_file)

            return data
    except FileNotFoundError:
        raise FileNotFoundError("json file not found")


def get_canned_simplified_osm_user_details():
    """Helper that reads file and returns it as a string"""
    location = os.path.join(
        os.path.dirname(__file__), "test_files", "osm_user_details_simple.xml"
    )

    with open(location, "r") as osm_file:
        data = osm_file.read().replace("\n", "")

    return data


async def get_or_create_levels(db):
    stmt = """
        INSERT INTO mapping_levels (
            id, name, approvals_required, ordering, is_beginner
        )
        VALUES (:id, :name, :approvals_required, :ordering, :is_beginner)
        ON CONFLICT (id) DO NOTHING
    """
    await db.execute(
        stmt,
        {
            "id": 1,
            "name": "BEGINNER",
            "approvals_required": 0,
            "ordering": 1,
            "is_beginner": True,
        },
    )
    await db.execute(
        stmt,
        {
            "id": 2,
            "name": "INTERMEDIATE",
            "approvals_required": 0,
            "ordering": 2,
            "is_beginner": False,
        },
    )
    await db.execute(
        stmt,
        {
            "id": 3,
            "name": "ADVANCED",
            "approvals_required": 0,
            "ordering": 3,
            "is_beginner": False,
        },
    )

    await db.execute("SELECT setval('mapping_levels_id_seq', 3)")


async def return_canned_user(db, username=TEST_USERNAME, id=TEST_USER_ID) -> User:
    """Returns a canned user"""
    await get_or_create_levels(db)

    test_user = User()
    test_user.username = username
    test_user.id = id
    test_user.mapping_level = 1
    test_user.email_address = None
    test_user.role = 0
    test_user.tasks_mapped = 0
    test_user.tasks_validated = 0
    test_user.tasks_invalidated = 0
    test_user.is_email_verified = False
    test_user.is_expert = False
    test_user.default_editor = "ID"
    test_user.mentions_notifications = True
    test_user.projects_comments_notifications = False
    test_user.projects_notifications = True
    test_user.tasks_notifications = True
    test_user.tasks_comments_notifications = False
    test_user.teams_announcement_notifications = True

    return test_user


def generate_encoded_token(user_id: int):
    "Returns encoded session token along with token scheme"

    session_token = AuthenticationService.generate_session_token_for_user(user_id)
    session_token = base64.b64encode(session_token.encode("utf-8"))
    return "Token " + session_token.decode("utf-8")


async def create_canned_user(db, test_user=None):
    """Generate a canned user in the DB"""
    if test_user is None:
        test_user = await return_canned_user(db)

    # Make sure all required values are passed to the INSERT query (including non-nullable defaults)
    await db.execute(
        """
        INSERT INTO users (
            id, username, role, mapping_level, tasks_mapped, tasks_validated, tasks_invalidated,
            email_address, is_email_verified, is_expert, default_editor, mentions_notifications,
            projects_comments_notifications, projects_notifications, tasks_notifications,
            tasks_comments_notifications, teams_announcement_notifications, date_registered,
            last_validation_date
        )
        VALUES (
            :id, :username, :role, :mapping_level, :tasks_mapped, :tasks_validated, :tasks_invalidated,
            :email_address, :is_email_verified, :is_expert, :default_editor, :mentions_notifications,
            :projects_comments_notifications, :projects_notifications, :tasks_notifications,
            :tasks_comments_notifications, :teams_announcement_notifications, :date_registered,
            :last_validation_date
        )
        """,
        {
            "id": test_user.id,
            "username": test_user.username,
            "role": test_user.role,
            "mapping_level": test_user.mapping_level,
            "tasks_mapped": test_user.tasks_mapped,
            "tasks_validated": test_user.tasks_validated,
            "tasks_invalidated": test_user.tasks_invalidated,
            "email_address": test_user.email_address,
            "is_email_verified": test_user.is_email_verified,
            "is_expert": test_user.is_expert,
            "default_editor": test_user.default_editor,
            "mentions_notifications": test_user.mentions_notifications,
            "projects_comments_notifications": test_user.projects_comments_notifications,
            "projects_notifications": test_user.projects_notifications,
            "tasks_notifications": test_user.tasks_notifications,
            "tasks_comments_notifications": test_user.tasks_comments_notifications,
            "teams_announcement_notifications": test_user.teams_announcement_notifications,
            "date_registered": test_user.date_registered,
            "last_validation_date": test_user.last_validation_date,
        },
    )

    return test_user


async def get_canned_user(username: str, db) -> User:
    test_user = await User().get_by_username(username, db)
    return test_user


async def create_canned_project(db, name=TEST_PROJECT_NAME) -> Tuple[Project, User]:
    """Generates a canned project in the DB to help with integration tests"""
    test_aoi_geojson = geojson.loads(json.dumps(get_canned_json("test_aoi.json")))

    task_feature = geojson.loads(json.dumps(get_canned_json("splittable_task.json")))
    task_non_square_feature = geojson.loads(
        json.dumps(get_canned_json("non_square_task.json"))
    )
    task_arbitrary_feature = geojson.loads(
        json.dumps(get_canned_json("splittable_task.json"))
    )
    test_user = await get_canned_user(TEST_USERNAME, db)
    if test_user is None:
        test_user = await create_canned_user(db)

    try:
        org_record = await OrganisationService.get_organisation_by_id(23, db)
    except NotFound:
        test_org = await create_canned_organisation(db)
        org_record = await OrganisationService.get_organisation_by_id(test_org.id, db)

    test_project_dto = DraftProjectDTO(project_name=name)
    test_project_dto.user_id = test_user.id
    test_project_dto.area_of_interest = test_aoi_geojson
    test_project_dto.organisation = org_record
    test_project = Project()
    test_project.create_draft_project(test_project_dto)
    await test_project.set_project_aoi(test_project_dto, db)
    test_project.total_tasks = 3

    # Setup test task
    test_task = Task.from_geojson_feature(1, task_feature)
    test_task.task_status = TaskStatus.MAPPED.value
    test_task.mapped_by = test_user.id
    test_task.is_square = True

    test_task2 = Task.from_geojson_feature(2, task_non_square_feature)
    test_task2.task_status = TaskStatus.READY.value
    test_task2.is_square = False

    test_task3 = Task.from_geojson_feature(3, task_arbitrary_feature)
    test_task3.task_status = TaskStatus.BADIMAGERY.value
    test_task3.mapped_by = test_user.id
    test_task3.is_square = True

    test_task4 = Task.from_geojson_feature(4, task_feature)
    test_task4.task_status = TaskStatus.VALIDATED.value
    test_task4.mapped_by = test_user.id
    test_task4.validated_by = test_user.id
    test_task4.is_square = True

    test_project.tasks.append(test_task)
    test_project.tasks.append(test_task2)
    test_project.tasks.append(test_task3)
    test_project.tasks.append(test_task4)
    test_project.total_tasks = 4
    test_project.tasks_mapped = 1
    test_project.tasks_validated = 1
    test_project.tasks_bad_imagery = 1
    project_id = await test_project.create(name, db)
    query = """
        UPDATE tasks
        SET task_status = CASE
            WHEN id = 1 THEN 2
            WHEN id = 2 THEN 0
            WHEN id = 3 THEN 6
            WHEN id = 4 THEN 4
        END
        WHERE id IN (1, 2, 3, 4);
    """
    await db.execute(query)
    test_project.set_default_changeset_comment()
    return test_project, test_user, project_id


def return_canned_draft_project_json():
    """Helper method to find test file, dependent on where tests are being run from"""

    location = os.path.join(
        os.path.dirname(__file__), "test_files", "canned_draft_project.json"
    )
    try:
        with open(location, "r") as x:
            a = json.load(x)
            return a
    except FileNotFoundError:
        raise FileNotFoundError("canned_draft_project.json not found")


def return_canned_organisation(
    org_id=TEST_ORGANISATION_ID,
    org_name=TEST_ORGANISATION_NAME,
    org_slug=TEST_ORGANISATION_SLUG,
) -> Organisation:
    "Returns test organisation without writing to db"
    test_org = Organisation()
    test_org.id = org_id
    test_org.name = org_name
    test_org.slug = org_slug
    test_org.type = OrganisationType.FREE.value

    return test_org


async def create_canned_organisation(db):
    """Generate a canned organisation in the DB"""
    test_org = return_canned_organisation()
    await db.execute(
        """
        INSERT INTO organisations (id, name, slug, type)
        VALUES (:id, :name, :slug, :type)
        """,
        {
            "id": test_org.id,
            "name": test_org.name,
            "slug": test_org.slug,
            "type": test_org.type,
        },
    )
    return test_org


async def get_canned_organisation(org_name: str, db) -> Organisation:
    organisation = await Organisation.get_organisation_by_name(org_name, db)
    return organisation


async def return_canned_team(
    db, name=TEST_TEAM_NAME, org_name=TEST_ORGANISATION_NAME
) -> Team:
    """Returns test team without writing to db"""
    test_team = Team()
    test_team.name = name
    test_org = await get_canned_organisation(org_name, db)
    if test_org is None:
        test_org = await create_canned_organisation(db)
    test_team.organisation = test_org
    test_team.organisation_id = test_org.id

    return test_team


async def create_canned_team(db):
    test_team = await return_canned_team(db)

    query = """
        INSERT INTO teams (name, organisation_id, join_method, visibility)
        VALUES (:name, :organisation_id, :join_method, :visibility)
        RETURNING id
    """

    created_team_id = await db.fetch_one(
        query,
        {
            "name": test_team.name,
            "organisation_id": test_team.organisation_id,
            "join_method": TeamJoinMethod.ANY.value,
            "visibility": TeamVisibility.PUBLIC.value,
        },
    )

    created_team = await db.fetch_one(
        """
        SELECT id, name, description, join_method, visibility, organisation_id
        FROM teams
        WHERE id = :id
        """,
        {"id": created_team_id["id"]},
    )

    return Team(**created_team) if created_team else None


def add_user_to_team(
    team: Team, user: User, role: int, is_active: bool, db
) -> TeamMembers:
    team_member = TeamMembers(team=team, member=user, function=role, active=is_active)
    team_member.create(db)

    return team_member


def add_manager_to_organisation(organisation: Organisation, user: User):
    org_dto = UpdateOrganisationDTO()
    org_dto.managers = [user.username]
    organisation.update(org_dto)
    organisation.save()
    return user.username


def assign_team_to_project(project: Project, team: Team, role: int, db) -> ProjectTeams:
    project_team = ProjectTeams(project=project, team=team, role=role)
    project_team.create(db)

    return project_team


def update_project_with_info(test_project: Project) -> Project:
    locales = []
    test_info = ProjectInfoDTO()
    test_info.locale = "en"
    test_info.name = "Thinkwhere Test"
    test_info.description = "Test Description"
    test_info.short_description = "Short description"
    test_info.instructions = "Instructions"
    locales.append(test_info)

    test_dto = ProjectDTO()
    test_dto.project_status = ProjectStatus.PUBLISHED.name
    test_dto.project_priority = ProjectPriority.MEDIUM.name
    test_dto.default_locale = "en"
    test_dto.project_info_locales = locales
    test_dto.difficulty = "EASY"
    test_dto.mapping_types = ["ROADS"]
    test_dto.mapping_editors = ["JOSM", "ID"]
    test_dto.validation_editors = ["JOSM"]
    test_dto.changeset_comment = "hot-project"
    test_dto.private = False
    test_project.update(test_dto)

    return test_project


def return_canned_campaign(
    id=TEST_CAMPAIGN_ID,
    name=TEST_CAMPAIGN_NAME,
    description=None,
    logo=None,
) -> Campaign:
    """Returns test campaign without writing to db"""
    test_campaign = Campaign()
    test_campaign.id = id
    test_campaign.name = name
    test_campaign.description = description
    test_campaign.logo = logo

    return test_campaign


def create_canned_campaign(
    id=TEST_CAMPAIGN_ID,
    name=TEST_CAMPAIGN_NAME,
    description=None,
    logo=None,
) -> Campaign:
    """Creates test campaign without writing to db"""
    test_campaign = return_canned_campaign(id, name, description, logo)
    test_campaign.create()

    return test_campaign


def create_canned_interest(name="test_interest") -> Interest:
    """Returns test interest without writing to db
    param name: name of interest
    return: Interest object
    """
    test_interest = Interest()
    test_interest.name = name
    test_interest.create()
    return test_interest


def create_canned_license(name="test_license") -> int:
    """Returns test license without writing to db
    param name: name of license
    return: license id
    """
    license_dto = LicenseDTO()
    license_dto.name = name
    license_dto.description = "test license"
    license_dto.plain_text = "test license"
    test_license = LicenseService.create_licence(license_dto)
    return test_license


def create_canned_mapping_issue(name="Test Issue") -> int:
    issue_dto = MappingIssueCategoryDTO()
    issue_dto.name = name
    test_issue_id = MappingIssueCategoryService.create_mapping_issue_category(issue_dto)
    return test_issue_id


def create_canned_message(
    subject=TEST_MESSAGE_SUBJECT,
    message=TEST_MESSAGE_DETAILS,
    message_type=MessageType.SYSTEM.value,
    db=None,
) -> Message:
    test_message = Message()
    test_message.subject = subject
    test_message.message = message
    test_message.message_type = message_type
    test_message.save(db)
    return test_message


def create_canned_notification(user_id, unread_count, date) -> Notification:
    test_notification = Notification()
    test_notification.user_id = user_id
    test_notification.unread_count = unread_count
    test_notification.date = date
    test_notification.save()
    return test_notification
