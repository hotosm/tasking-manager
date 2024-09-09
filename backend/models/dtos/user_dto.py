from backend.models.dtos.stats_dto import Pagination
from backend.models.dtos.mapping_dto import TaskDTO
from backend.models.dtos.interests_dto import InterestDTO
from backend.models.postgis.statuses import MappingLevel, UserRole
from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime


def is_known_mapping_level(value):
    """Validates that supplied mapping level is known value"""
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
    """Validates that supplied user role is known value"""
    try:
        value = value.split(",")
        for role in value:
            UserRole[role.upper()]
    except KeyError:
        raise ValidationError(
            f"Unknown mappingRole: {value} Valid values are {UserRole.ADMIN.name}, "
            f"{UserRole.READ_ONLY.name}, {UserRole.MAPPER.name}"
        )


class UserDTO(BaseModel):
    """DTO for User"""

    id: Optional[int] = None
    username: Optional[str] = None
    role: Optional[str] = None
    mapping_level: Optional[str] = Field(
        None, alias="mappingLevel", validators=[is_known_mapping_level]
    )
    projects_mapped: Optional[int] = Field(None, alias="projectsMapped")
    email_address: Optional[str] = Field(None, alias="emailAddress")

    is_email_verified: Optional[str] = Field(
        None, alias="isEmailVerified", serialize_when_none=False
    )
    is_expert: bool = Field(None, alias="isExpert", serialize_when_none=False)
    twitter_id: Optional[str] = Field(None, alias="twitterId")
    facebook_id: Optional[str] = Field(None, alias="facebookId")
    linkedin_id: Optional[str] = Field(None, alias="linkedinId")
    slack_id: Optional[str] = Field(None, alias="slackId")
    irc_id: Optional[str] = Field(None, alias="ircId")
    skype_id: Optional[str] = Field(None, alias="skypeId")
    city: Optional[str] = Field(None, alias="city")
    country: Optional[str] = Field(None, alias="country")
    name: Optional[str] = Field(None, alias="name")
    picture_url: Optional[str] = Field(None, alias="pictureUrl")
    default_editor: Optional[str] = Field(None, alias="defaultEditor")
    mentions_notifications: bool = Field(None, alias="mentionsNotifications")
    projects_comments_notifications: bool = Field(
        None, alias="questionsAndCommentsNotifications"
    )
    projects_notifications: bool = Field(None, alias="projectsNotifications")
    tasks_notifications: bool = Field(None, alias="tasksNotifications")
    tasks_comments_notifications: bool = Field(None, alias="taskCommentsNotifications")
    teams_announcement_notifications: bool = Field(
        None, alias="teamsAnnouncementNotifications"
    )

    # these are read only
    gender: Optional[str] = Field(
        None,
        alias="gender",
        choices=("MALE", "FEMALE", "SELF_DESCRIBE", "PREFER_NOT"),
    )
    self_description_gender: Optional[str] = Field(None, alias="selfDescriptionGender")

    def validate_self_description(self, data, value):
        if (
            data["gender"] == "SELF_DESCRIBE"
            and data["self_description_gender"] is None
        ):
            raise ValueError("selfDescription field is not defined")
        return value


class UserCountryContributed(BaseModel):
    """DTO for country a user has contributed"""

    name: str
    mapped: int
    validated: int
    total: int


class UserCountriesContributed(BaseModel):
    """DTO for countries a user has contributed"""

    def __init__(self):
        super().__init__()
        self.countries_contributed = []

    countries_contributed: List[UserCountryContributed] = Field(alias="countries")
    total: int


class UserContributionDTO(BaseModel):
    date: datetime
    count: int


class UserStatsDTO(BaseModel):
    """DTO containing statistics about the user"""

    total_time_spent: int = Field(alias="totalTimeSpent")
    time_spent_mapping: int = Field(alias="timeSpentMapping")
    time_spent_validating: int = Field(alias="timeSpentValidating")
    projects_mapped: int = Field(alias="projectsMapped")
    countries_contributed: UserCountriesContributed = Field(
        alias="countriesContributed"
    )
    contributions_by_day: List[UserContributionDTO] = Field(alias="contributionsByDay")
    tasks_mapped: int = Field(alias="tasksMapped")
    tasks_validated: int = Field(alias="tasksValidated")
    tasks_invalidated: int = Field(alias="tasksInvalidated")
    tasks_invalidated_by_others: int = Field(alias="tasksInvalidatedByOthers")
    tasks_validated_by_others: int = Field(alias="tasksValidatedByOthers")
    contributions_interest: List[InterestDTO] = Field(alias="ContributionsByInterest")


class UserOSMDTO(BaseModel):
    """DTO containing OSM details for the user"""

    account_created: Optional[str] = Field(None, alias="accountCreated")
    changeset_count: Optional[int] = Field(None, alias="changesetCount")


class MappedProject(BaseModel):
    """Describes a single project a user has mapped"""

    project_id: Optional[int] = Field(None, alias="projectId")
    name: Optional[str] = None
    tasks_mapped: Optional[int] = Field(None, alias="tasksMapped")
    tasks_validated: Optional[int] = Field(None, alias="tasksValidated")
    status: Optional[str] = None
    centroid: Optional[str] = None

    class Config:
        populate_by_name = True


class UserMappedProjectsDTO(BaseModel):
    """DTO for projects a user has mapped"""

    mapped_projects: Optional[List[MappedProject]] = Field(
        default_factory=list, alias="mappedProjects"
    )

    class Config:
        populate_by_name = True


class UserSearchQuery(BaseModel):
    """Describes a user search query, that a user may submit to filter the list of users"""

    username: Optional[str] = None
    role: Optional[str] = Field(None, validators=[is_known_role])
    mapping_level: Optional[str] = Field(
        None, alias="mappingLevel", validators=[is_known_mapping_level]
    )
    page: Optional[int] = None
    pagination: bool = True
    per_page: Optional[int] = Field(default=20, alias="perPage")

    def __hash__(self):
        """Make object hashable so we can cache user searches"""
        return hash((self.username, self.role, self.mapping_level, self.page))


class ListedUser(BaseModel):
    """Describes a user within the User List"""

    id: Optional[float] = None
    username: Optional[str] = None
    role: Optional[str] = None
    mapping_level: Optional[str] = Field(None, alias="mappingLevel")
    picture_url: Optional[str] = Field(None, alias="pictureUrl")


class UserRegisterEmailDTO(BaseModel):
    """DTO containing data for user registration with email model"""

    id: int = Field(serialize_when_none=False)
    email: str
    success: bool = False
    details: str


class ProjectParticipantUser(BaseModel):
    """Describes a user who has participated in a project"""

    username: str
    project_id: float = Field(alias="projectId")
    is_participant: bool = Field(alias="isParticipant")


class UserSearchDTO(BaseModel):
    """Paginated list of TM users"""

    def __init__(self):
        super().__init__()
        self.users = []

    pagination: Optional[Pagination] = None
    users: Optional[List[ListedUser]] = None


class UserFilterDTO(BaseModel):
    """DTO to hold all Tasking Manager users"""

    def __init__(self):
        super().__init__()
        self.usernames = []
        self.users = []

    pagination: Optional[Pagination] = None
    usernames: Optional[List[str]] = None
    users: Optional[List[ProjectParticipantUser]] = None


class UserTaskDTOs(BaseModel):
    """Describes an array of Task DTOs"""

    def __init__(self):
        """DTO constructor initialise all arrays to empty"""
        super().__init__()
        self.user_tasks = []

    user_tasks: List[TaskDTO] = Field(alias="tasks")
    pagination: Pagination


class AuthUserDTO(BaseModel):
    """A minimal user model with only id."""

    id: int
