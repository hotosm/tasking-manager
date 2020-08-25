from schematics import Model
from schematics.exceptions import ValidationError
from schematics.types import (
    StringType,
    IntType,
    EmailType,
    LongType,
    BooleanType,
)
from schematics.types.compound import ListType, ModelType, BaseType
from backend.models.dtos.stats_dto import Pagination
from backend.models.dtos.mapping_dto import TaskDTO
from backend.models.dtos.interests_dto import InterestDTO
from backend.models.postgis.statuses import MappingLevel, UserRole


def is_known_mapping_level(value):
    """ Validates that supplied mapping level is known value """
    if value.upper() == "ALL":
        return True

    try:
        value = value.split(",")
        for level in value:
            MappingLevel[level.upper()]
    except KeyError:
        raise ValidationError(
            f"Unknown mappingLevel: {value} Valid values are {MappingLevel.BEGINNER.name}, "
            f"{MappingLevel.INTERMEDIATE.name}, {MappingLevel.ADVANCED.name}, ALL"
        )


def is_known_role(value):
    """ Validates that supplied user role is known value """
    try:
        value = value.split(",")
        for role in value:
            UserRole[role.upper()]
    except KeyError:
        raise ValidationError(
            f"Unknown mappingRole: {value} Valid values are {UserRole.ADMIN.name}, "
            f"{UserRole.READ_ONLY.name}, {UserRole.MAPPER.name}"
        )


class UserDTO(Model):
    """ DTO for User """

    id = LongType()
    username = StringType()
    role = StringType()
    mapping_level = StringType(
        serialized_name="mappingLevel", validators=[is_known_mapping_level]
    )
    projects_mapped = IntType(serialized_name="projectsMapped")
    email_address = EmailType(serialized_name="emailAddress")

    is_email_verified = EmailType(
        serialized_name="isEmailVerified", serialize_when_none=False
    )
    is_expert = BooleanType(serialized_name="isExpert", serialize_when_none=False)
    twitter_id = StringType(serialized_name="twitterId")
    facebook_id = StringType(serialized_name="facebookId")
    linkedin_id = StringType(serialized_name="linkedinId")
    slack_id = StringType(serialized_name="slackId")
    irc_id = StringType(serialized_name="ircId")
    skype_id = StringType(serialized_name="skypeId")
    city = StringType(serialized_name="city")
    country = StringType(serialized_name="country")
    name = StringType(serialized_name="name")
    picture_url = StringType(serialized_name="pictureUrl")
    default_editor = StringType(serialized_name="defaultEditor")
    mentions_notifications = BooleanType(serialized_name="mentionsNotifications")
    comments_notifications = BooleanType(serialized_name="commentsNotifications")
    projects_notifications = BooleanType(serialized_name="projectsNotifications")
    tasks_notifications = BooleanType(serialized_name="tasksNotifications")
    teams_notifications = BooleanType(serialized_name="teamsNotifications")

    # these are read only
    missing_maps_profile = StringType(serialized_name="missingMapsProfile")
    osm_profile = StringType(serialized_name="osmProfile")
    gender = StringType(
        serialized_name="gender",
        choices=("MALE", "FEMALE", "SELF_DESCRIBE", "PREFER_NOT"),
    )
    self_description_gender = StringType(
        serialized_name="selfDescriptionGender", default=None
    )

    def validate_self_description(self, data, value):
        if (
            data["gender"] == "SELF_DESCRIBE"
            and data["self_description_gender"] is None
        ):
            raise ValueError("selfDescription field is not defined")
        return value


class UserCountryContributed(Model):
    """ DTO for country a user has contributed """

    name = StringType(required=True)
    mapped = IntType(required=True)
    validated = IntType(required=True)
    total = IntType(required=True)


class UserCountriesContributed(Model):
    """ DTO for countries a user has contributed """

    def __init__(self):
        super().__init__()
        self.countries_contributed = []

    countries_contributed = ListType(
        ModelType(UserCountryContributed), serialized_name="countries"
    )
    total = IntType()


class UserContributionDTO(Model):
    date = StringType()
    count = IntType()


class UserStatsDTO(Model):
    """ DTO containing statistics about the user """

    total_time_spent = IntType(serialized_name="totalTimeSpent")
    time_spent_mapping = IntType(serialized_name="timeSpentMapping")
    time_spent_validating = IntType(serialized_name="timeSpentValidating")
    projects_mapped = IntType(serialized_name="projectsMapped")
    countries_contributed = ModelType(
        UserCountriesContributed, serialized_name="countriesContributed"
    )
    contributions_by_day = ListType(
        ModelType(UserContributionDTO), serialized_name="contributionsByDay"
    )
    tasks_mapped = IntType(serialized_name="tasksMapped")
    tasks_validated = IntType(serialized_name="tasksValidated")
    tasks_invalidated = IntType(serialized_name="tasksInvalidated")
    tasks_invalidated_by_others = IntType(serialized_name="tasksInvalidatedByOthers")
    tasks_validated_by_others = IntType(serialized_name="tasksValidatedByOthers")
    contributions_interest = ListType(
        ModelType(InterestDTO), serialized_name="ContributionsByInterest"
    )


class UserOSMDTO(Model):
    """ DTO containing OSM details for the user """

    account_created = StringType(required=True, serialized_name="accountCreated")
    changeset_count = IntType(required=True, serialized_name="changesetCount")


class MappedProject(Model):
    """ Describes a single project a user has mapped """

    project_id = IntType(serialized_name="projectId")
    name = StringType()
    tasks_mapped = IntType(serialized_name="tasksMapped")
    tasks_validated = IntType(serialized_name="tasksValidated")
    status = StringType()
    centroid = BaseType()


class UserMappedProjectsDTO(Model):
    """ DTO for projects a user has mapped """

    def __init__(self):
        super().__init__()
        self.mapped_projects = []

    mapped_projects = ListType(
        ModelType(MappedProject), serialized_name="mappedProjects"
    )


class UserSearchQuery(Model):
    """ Describes a user search query, that a user may submit to filter the list of users """

    username = StringType()
    role = StringType(validators=[is_known_role])
    mapping_level = StringType(
        serialized_name="mappingLevel", validators=[is_known_mapping_level]
    )
    page = IntType()

    def __hash__(self):
        """ Make object hashable so we can cache user searches"""
        return hash((self.username, self.role, self.mapping_level, self.page))


class ListedUser(Model):
    """ Describes a user within the User List """

    id = LongType()
    username = StringType()
    role = StringType()
    mapping_level = StringType(serialized_name="mappingLevel")
    picture_url = StringType(serialized_name="pictureUrl")


class UserRegisterEmailDTO(Model):
    """ DTO containing data for user registration with email model """

    id = IntType(serialize_when_none=False)
    email = StringType(required=True)
    success = BooleanType(default=False)
    details = StringType()


class ProjectParticipantUser(Model):
    """ Describes a user who has participated in a project """

    username = StringType()
    project_id = LongType(serialized_name="projectId")
    is_participant = BooleanType(serialized_name="isParticipant")


class UserSearchDTO(Model):
    """ Paginated list of TM users """

    def __init__(self):
        super().__init__()
        self.users = []

    pagination = ModelType(Pagination)
    users = ListType(ModelType(ListedUser))


class UserFilterDTO(Model):
    """ DTO to hold all Tasking Manager users """

    def __init__(self):
        super().__init__()
        self.usernames = []
        self.users = []

    pagination = ModelType(Pagination)
    usernames = ListType(StringType)
    users = ListType(ModelType(ProjectParticipantUser))


class UserTaskDTOs(Model):
    """ Describes an array of Task DTOs"""

    def __init__(self):
        """ DTO constructor initialise all arrays to empty"""
        super().__init__()
        self.user_tasks = []

    user_tasks = ListType(ModelType(TaskDTO), serialized_name="tasks")
    pagination = ModelType(Pagination)
