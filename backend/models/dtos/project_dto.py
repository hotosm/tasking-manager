# from schematics import Model
# from schematics.exceptions import ValidationError
from backend.models.dtos.task_annotation_dto import TaskAnnotationDTO
from backend.models.dtos.stats_dto import Pagination
from backend.models.dtos.team_dto import ProjectTeamDTO
from backend.models.dtos.interests_dto import InterestDTO, ListInterestDTO
from backend.models.postgis.statuses import (
    ProjectStatus,
    ProjectPriority,
    MappingTypes,
    TaskCreationMode,
    Editors,
    MappingPermission,
    ValidationPermission,
    ProjectDifficulty,
)
from backend.models.dtos.campaign_dto import CampaignDTO

from pydantic import BaseModel, Field, ValidationError
from typing import List, Optional
from datetime import datetime
from typing_extensions import Annotated


def is_known_project_status(value):
    """Validates that Project Status is known value"""
    if isinstance(value, list):
        return  # Don't validate the entire list, just the individual values

    try:
        ProjectStatus[value.upper()]
    except KeyError:
        raise ValidationError(
            f"Unknown projectStatus: {value} Valid values are {ProjectStatus.DRAFT.name}, "
            f"{ProjectStatus.PUBLISHED.name}, {ProjectStatus.ARCHIVED.name}"
        )


def is_known_project_priority(value):
    """Validates Project priority is known value"""
    try:
        ProjectPriority[value.upper()]
    except KeyError:
        raise ValidationError(
            f"Unknown projectStatus: {value} Valid values are {ProjectPriority.LOW.name}, "
            f"{ProjectPriority.MEDIUM.name}, {ProjectPriority.HIGH.name}, "
            f"{ProjectPriority.URGENT.name}"
        )


def is_known_mapping_type(value):
    """Validates Mapping Type is known value"""
    if isinstance(value, list):
        return  # Don't validate the entire list, just the individual values

    try:
        MappingTypes[value.upper()]
    except KeyError:
        raise ValidationError(
            f"Unknown mappingType: {value} Valid values are {MappingTypes.ROADS.name}, "
            f"{MappingTypes.BUILDINGS.name}, {MappingTypes.WATERWAYS.name}, "
            f"{MappingTypes.LAND_USE.name}, {MappingTypes.OTHER.name}"
        )


def is_known_editor(value):
    """Validates Editor is known value"""
    if isinstance(value, list):
        return  # Don't validate the entire list, just the individual values

    try:
        Editors[value.upper()]
    except KeyError:
        raise ValidationError(
            f"Unknown editor: {value} Valid values are {Editors.ID.name}, "
            f"{Editors.JOSM.name}, {Editors.POTLATCH_2.name}, "
            f"{Editors.FIELD_PAPERS.name}, "
            f"{Editors.RAPID.name} "
        )


def is_known_task_creation_mode(value):
    """Validates Task Creation Mode is known value"""
    try:
        TaskCreationMode[value.upper()]
    except KeyError:
        raise ValidationError(
            f"Unknown taskCreationMode: {value} Valid values are {TaskCreationMode.GRID.name}, "
            f"{TaskCreationMode.ARBITRARY.name}"
        )


def is_known_mapping_permission(value):
    """Validates Mapping Permission String"""
    try:
        MappingPermission[value.upper()]
    except KeyError:
        raise ValidationError(
            f"Unknown mappingPermission: {value} Valid values are {MappingPermission.ANY.name}, "
            f"{MappingPermission.LEVEL.name}"
        )


def is_known_validation_permission(value):
    """Validates Validation Permission String"""
    try:
        ValidationPermission[value.upper()]
    except KeyError:
        raise ValidationError(
            f"Unknown validationPermission: {value} Valid values are {ValidationPermission.ANY.name}, "
            f"{ValidationPermission.LEVEL.name}, {ValidationPermission.TEAMS.name}, "
            f"{ValidationPermission.TEAMS_LEVEL.name}"
        )


def is_known_project_difficulty(value):
    """Validates that supplied project difficulty is known value"""
    if value.upper() == "ALL":
        return True

    try:
        value = value.split(",")
        for difficulty in value:
            ProjectDifficulty[difficulty.upper()]
    except KeyError:
        raise ValidationError(
            f"Unknown projectDifficulty: {value} Valid values are {ProjectDifficulty.EASY.name}, "
            f"{ProjectDifficulty.MODERATE.name}, {ProjectDifficulty.CHALLENGING.name} and ALL."
        )


class DraftProjectDTO(BaseModel):
    """Describes JSON model used for creating draft project"""

    cloneFromProjectId: int = Field(alias="cloneFromProjectId")
    project_name: str = Field(required=True, alias="projectName")
    organisation: int = Field(required=True)
    area_of_interest: dict = Field(required=True, alias="areaOfInterest")
    tasks: Optional[dict]
    has_arbitrary_tasks: bool = Field(required=True, alias="arbitraryTasks")
    user_id: int = Field(required=True)

class ProjectInfoDTO(BaseModel):
    """Contains the localized project info"""

    locale: str
    name: str = Field(default="")
    short_description: str = Field(default="", serialization_alias="shortDescription")
    description: str = Field(default="")
    instructions: str = Field(default="")
    per_task_instructions: str = Field(default="", serialization_alias="perTaskInstructions")


class CustomEditorDTO(BaseModel):
    """DTO to define a custom editor"""

    name: str = Field(required=True)
    description: Optional[str]
    url: str = Field(required=True)

class ProjectDTO(BaseModel):
    """Describes JSON model for a tasking manager project"""
    
    project_id: Optional[int] = Field(serialization_alias="projectId", default=None)
    project_status: Optional[str] = None
    project_priority: Optional[str] = None
    area_of_interest: Optional[dict] = Field(serialization_alias="areaOfInterest", default={})
    aoi_bbox: List[float] = Field(serialization_alias="aoiBBOX", default=[])
    tasks: Optional[dict] = None  # Replace with the actual type for tasks
    default_locale: Optional[str] = Field(serialization_alias="defaultLocale", default=None)
    project_info: Optional[ProjectInfoDTO] = None
    project_info_locales: List[ProjectInfoDTO] = Field(serialization_alias="projectInfoLocales", default=[])
    difficulty: Optional[str] = None
    mapping_permission: Optional[str] = Field(serialization_alias="mappingPermission", default=None)
    validation_permission: Optional[str] = Field(serialization_alias="validationPermission", default=None)
    enforce_random_task_selection: Optional[bool] = Field(serialization_alias="enforceRandomTaskSelection", default=False)
    private: Optional[bool] = None
    changeset_comment: Optional[str] = Field(serialization_alias="changesetComment", default=None)
    osmcha_filter_id: Optional[str] = Field(serialization_alias="osmchaFilterId", default=None)
    due_date: Optional[str] = Field(serialization_alias="dueDate", default=None)
    imagery: Optional[str] = None
    josm_preset: Optional[str] = Field(serialization_alias="josmPreset", default=None)
    id_presets: Optional[List[str]] = Field(serialization_alias="idPresets", default=[])
    extra_id_params: Optional[str] = Field(serialization_alias="extraIdParams", default=None)
    rapid_power_user: Optional[bool] = Field(serialization_alias="rapidPowerUser", default=False)
    mapping_types: List[str] = Field(serialization_alias="mappingTypes", default=[], validators=[is_known_mapping_type])
    campaigns: List[CampaignDTO] = Field(default=[])
    organisation: Optional[int] = None
    organisation_name: Optional[str] = Field(serialization_alias="organisationName", default=None)
    organisation_slug: Optional[str] = Field(serialization_alias="organisationSlug", default=None)
    organisation_logo: Optional[str] = Field(serialization_alias="organisationLogo", default=None)
    country_tag: List[str] = Field(serialization_alias="countryTag", default=[])
    license_id: Optional[int] = Field(serialization_alias="licenseId", default=None)
    allowed_usernames: List[str] = Field(serialization_alias="allowedUsernames", default=[])
    priority_areas: Optional[dict] = Field(serialization_alias="priorityAreas", default={})
    created: Optional[str] = None
    last_updated: Optional[str] = Field(serialization_alias="lastUpdated", default=None)
    author: Optional[str] = None
    active_mappers: Optional[int] = Field(serialization_alias="activeMappers", default=None)
    percent_mapped: Optional[int] = Field(serialization_alias="percentMapped", default=None)
    percent_validated: Optional[int] = Field(serialization_alias="percentValidated", default=None)
    percent_bad_imagery: Optional[int] = Field(serialization_alias="percentBadImagery", default=None)
    task_creation_mode: Optional[str] = Field(serialization_alias="taskCreationMode", validators=[is_known_task_creation_mode], default=None)
    project_teams: List[ProjectTeamDTO] = Field(serialization_alias="teams", default=[])
    mapping_editors: Optional[List[str]] = Field(serialization_alias="mappingEditors", min_items=1, validators=[is_known_editor], default=[])
    validation_editors: Optional[List[str]] = Field(serialization_alias="validationEditors", min_items=1, validators=[is_known_editor], default=[])
    custom_editor: Optional[CustomEditorDTO] = Field(serialization_alias="customEditor", default=None)
    interests: Optional[List[ListInterestDTO]] = None


class ProjectFavoriteDTO(BaseModel):
    """DTO used to favorite a project"""

    project_id: int
    user_id: int


# class ProjectFavoritesDTO(Model):
#     """DTO to retrieve favorited projects"""

#     def __init__(self):
#         super().__init__()
#         self.favorited_projects = []

#     favorited_projects = ListType(
#         ModelType(ProjectDTO), serialized_name="favoritedProjects"
#     )
class ProjectFavoritesDTO(BaseModel):
    def __init__(self, favorited_projects: List[ProjectDTO] = None, **kwargs):
        super().__init__(**kwargs)
        self.favorited_projects = favorited_projects or []

    favorited_projects: List[ProjectDTO] = Field(default=[], alias="favoritedProjects")


class ProjectSearchDTO(BaseModel):
    """Describes the criteria users use to filter active projects"""

    preferred_locale: Optional[str] = "en"
    difficulty: Optional[str] = Field(None, validators=[is_known_project_difficulty])
    action: Optional[str] = None
    mapping_types: List[str] = Field(None, validators=[is_known_mapping_type])
    mapping_types_exact: Optional[bool] = None
    project_statuses: List[str] = Field(None, validators=[is_known_project_status])
    organisation_name: Optional[str] = None
    organisation_id: Optional[int] = None
    team_id: Optional[int] = None
    campaign: Optional[str] = None
    order_by: Optional[str] = None
    order_by_type: Optional[str] = None
    country: Optional[str] = None
    page: Optional[int] = None
    text_search: Optional[str] = None
    mapping_editors: Optional[List] = Field(None, validators=[is_known_editor])
    validation_editors: Optional[List] = Field(None, validators=[is_known_editor])
    teams: List[str] = None
    interests: List[int] = None
    created_by: Optional[int] = None
    mapped_by: Optional[int] = None
    favorited_by: Optional[int] = None
    managed_by: Optional[int] = None
    based_on_user_interests: Optional[int] = None
    omit_map_results: Optional[bool] = None
    last_updated_lte: Optional[str] = None
    last_updated_gte: Optional[str] = None
    created_lte: Optional[str] = None
    created_gte: Optional[str] = None

    def __hash__(self):
        """Make object hashable so we can cache user searches"""
        hashable_mapping_types = ""
        if self.mapping_types:
            for mapping_type in self.mapping_types:
                hashable_mapping_types += mapping_type
        hashable_project_statuses = ""
        if self.project_statuses:
            for project_status in self.project_statuses:
                hashable_project_statuses += project_status
        hashable_teams = ""
        if self.teams:
            for team in self.teams:
                hashable_teams += team
        hashable_mapping_editors = ""
        if self.mapping_editors:
            for mapping_editor in self.mapping_editors:
                hashable_mapping_editors = hashable_mapping_editors + mapping_editor
        hashable_validation_editors = ""
        if self.validation_editors:
            for validation_editor in self.validation_editors:
                hashable_validation_editors = (
                    hashable_validation_editors + validation_editor
                )

        return hash(
            (
                self.preferred_locale,
                self.difficulty,
                hashable_mapping_types,
                hashable_project_statuses,
                hashable_teams,
                self.organisation_name,
                self.campaign,
                self.page,
                self.text_search,
                hashable_mapping_editors,
                hashable_validation_editors,
                self.created_by,
            )
        )


class ProjectSearchBBoxDTO(BaseModel):
    bbox: List[float] = Field(required=True, min_size=4, max_size=4)
    input_srid: int = Field(required=True, choices=[4326])
    preferred_locale: str = Field(required=False, default="en")
    project_author: int = Field(required=False, alias="projectAuthor")


# class ListSearchResultDTO(Model):
#     """Describes one search result"""

#     project_id = IntType(required=True, serialized_name="projectId")
#     locale = StringType(required=True)
#     name = StringType(default="")
#     short_description = StringType(serialized_name="shortDescription", default="")
#     difficulty = StringType(required=True, serialized_name="difficulty")
#     priority = StringType(required=True)
#     organisation_name = StringType(serialized_name="organisationName")
#     organisation_logo = StringType(serialized_name="organisationLogo")
#     campaigns = ListType(ModelType(CampaignDTO), default=[])
#     percent_mapped = IntType(serialized_name="percentMapped")
#     percent_validated = IntType(serialized_name="percentValidated")
#     status = StringType(serialized_name="status")
#     active_mappers = IntType(serialized_name="activeMappers")
#     last_updated = UTCDateTimeType(serialized_name="lastUpdated")
#     due_date = UTCDateTimeType(serialized_name="dueDate")
#     total_contributors = IntType(serialized_name="totalContributors")
#     country = StringType(serialize_when_none=False)
class ListSearchResultDTO(BaseModel):
    project_id: Optional[int] = Field(alias="projectId", default=None)
    locale: Optional[str] = None
    name: Optional[str] = Field(default="")
    short_description: str = Field(default="", alias="shortDescription")
    difficulty: Optional[str] = None
    priority: Optional[str] = None
    organisation_name: Optional[str] = Field(alias="organisationName", default=None)
    organisation_logo: Optional[str] = Field(alias="organisationLogo", default=None)
    campaigns: Optional[List[CampaignDTO]] = Field(default=[])
    percent_mapped: Optional[int] = Field(alias="percentMapped", default=None)
    percent_validated: Optional[int] = Field(alias="percentValidated", default=None)
    status: Optional[str] = None
    active_mappers: Optional[int] = Field(alias="activeMappers", default=None)
    last_updated: Optional[str] = Field(alias="lastUpdated", default=None)
    due_date: Optional[str] = Field(alias="dueDate", default=None)
    total_contributors: Optional[int] = Field(alias="totalContributors", default=None)
    country: Optional[str] = Field(default="", serialize=False)


# class ProjectSearchResultsDTO(Model):
#     """Contains all results for the search criteria"""

#     def __init__(self):
#         """DTO constructor initialise all arrays to empty"""
#         super().__init__()
#         self.results = []
#         self.map_results = []

#     map_results = BaseType(serialized_name="mapResults")
#     results = ListType(ModelType(ListSearchResultDTO))
#     pagination = ModelType(Pagination)
class ProjectSearchResultsDTO(BaseModel):
    # def __init__(self, results: List[ListSearchResultDTO] = None, map_results: List = None, pagination: Pagination = None, **kwargs):
    #     """DTO constructor initialise all arrays to empty"""
    #     super().__init__(**kwargs)
    #     self.results = results or []
    #     self.map_results = map_results or []
    #     self.pagination = pagination or Pagination()

    map_results: Optional[List] = []
    results: Optional[List[ListSearchResultDTO]] = []
    pagination: Optional[Pagination] = {}


class LockedTasksForUser(BaseModel):
    """Describes all tasks locked by an individual user"""

    def __init__(self):
        """DTO constructor initialise all arrays to empty"""
        super().__init__()
        self.locked_tasks = []

    locked_tasks: Optional[List[int]] = Field([], alias="lockedTasks")
    project: Optional[int] = Field(None, alias="projectId")
    task_status: Optional[str] = Field(None, alias="taskStatus")


class ProjectComment(BaseModel):
    """Describes an individual user comment on a project task"""

    comment: str
    comment_date: datetime = Field(alias="commentDate")
    user_name: str = Field(alias="userName")
    task_id: int = Field(alias="taskId")


class ProjectCommentsDTO(BaseModel):
    """Contains all comments on a project"""

    def __init__(self):
        """DTO constructor initialise all arrays to empty"""
        super().__init__()
        self.comments = []

    comments: List[ProjectComment]


class ProjectContribDTO(BaseModel):
    date: datetime
    mapped: int
    validated: int
    cumulative_mapped: Optional[int]
    cumulative_validated: Optional[int]
    total_tasks: Optional[int]


class ProjectContribsDTO(BaseModel):
    """Contains all contributions on a project by day"""

    stats: Optional[List[ProjectContribDTO]] = None


class ProjectSummary(BaseModel):
    """Model used for PM dashboard"""

    project_id: int = Field(required=True, alias="projectId")
    default_locale: str = Field(alias="defaultLocale")
    author: str
    created: datetime
    due_date: datetime = Field(alias="dueDate")
    last_updated: datetime = Field(alias="lastUpdated")
    priority: str = Field(alias="projectPriority")
    campaigns: List[CampaignDTO] = []
    organisation: int
    organisation_name: str = Field(alias="organisationName")
    organisation_slug: str = Field(alias="organisationSlug")
    organisation_logo: str = Field(alias="organisationLogo")
    country_tag: List[str] = Field(alias="countryTag")
    osmcha_filter_id: str = Field(alias="osmchaFilterId")
    mapping_types: List[str] = Field(alias="mappingTypes", validators=[is_known_mapping_type])

    changeset_comment: str = Field(alias="changesetComment")
    percent_mapped: int = Field(alias="percentMapped")
    percent_validated: int = Field(alias="percentValidated")
    percent_bad_imagery: int = Field(alias="percentBadImagery")
    aoi_centroid: str = Field(alias="aoiCentroid")
    difficulty: str = Field(alias="difficulty")
    mapping_permission: int = Field(
        alias="mappingPermission", validators=[is_known_mapping_permission]
    )
    validation_permission: int = Field(
        alias="validationPermission",
        validators=[is_known_validation_permission],
    )
    allowed_usernames: List[str] = Field(
        alias="allowedUsernames", default=[]
    )
    random_task_selection_enforced: bool = Field(
        required=False, default=False, alias="enforceRandomTaskSelection"
    )
    private: bool = Field(alias="private")
    allowed_users: List[str] = Field(alias="allowedUsernames", default=[])
    project_teams: List[ProjectTeamDTO] = Field(alias="teams")
    project_info: ProjectInfoDTO = Field(alias="projectInfo", serialize_when_none=False)
    short_description: str = Field(alias="shortDescription")
    status: str
    imagery: str
    license_id: int = Field(alias="licenseId")
    id_presets: List[str] = Field(alias="idPresets", default=[])
    extra_id_params: str = Field(alias="extraIdParams")
    rapid_power_user: bool = Field(
        alias="rapidPowerUser", default=False, required=False
    )
    mapping_editors: List[str] = Field(
        min_size=1,
        required=True,
        alias="mappingEditors",
        validators=[is_known_editor],
    )
    validation_editors: List[str] = Field(
        min_size=1,
        required=True,
        alias="validationEditors",
        validators=[is_known_editor],
    )
    custom_editor: CustomEditorDTO = Field(alias="customEditor", serialize_when_none=False)


class PMDashboardDTO(BaseModel):
    """DTO for constructing the PM Dashboard"""

    def __init__(self):
        """DTO constructor initialise all arrays to empty"""
        super().__init__()
        self.draft_projects = []
        self.archived_projects = []
        self.active_projects = []

    draft_projects: List[ProjectSummary] = Field(alias="draftProjects")
    active_projects: List[ProjectSummary] = Field(alias="activeProjects")
    archived_projects: List[ProjectSummary] = Field(alias="archivedProjects")


class ProjectTaskAnnotationsDTO(BaseModel):
    """DTO for task annotations of a project"""

    def __init__(self):
        """DTO constructor set task arrays to empty"""
        super().__init__()
        self.tasks = []

    project_id: Optional[int] = Field(None, alias="projectId")
    tasks: Optional[List[TaskAnnotationDTO]] = Field(None, alias="tasks")


class ProjectStatsDTO(BaseModel):
    """DTO for detailed stats on a project"""

    project_id: Optional[int] = Field(alias="projectId", default=None)
    area: float = Field(None, alias="projectArea(in sq.km)")
    total_mappers: int = Field(None, alias="totalMappers")
    total_tasks: int = Field(None, alias="totalTasks")
    total_comments: int = Field(None, alias="totalComments")
    total_mapping_time: int = Field(None, alias="totalMappingTime")
    total_validation_time: int = Field(None, alias="totalValidationTime")
    total_time_spent: int = Field(None, alias="totalTimeSpent")
    average_mapping_time: int = Field(None, alias="averageMappingTime")
    average_validation_time: int = Field(None, alias="averageValidationTime")
    percent_mapped: int = Field(None, alias="percentMapped")
    percent_validated: int = Field(None, alias="percentValidated")
    percent_bad_imagery: int = Field(None, alias="percentBadImagery")
    aoi_centroid: str = Field(None, alias="aoiCentroid")
    time_to_finish_mapping: int = Field(None, alias="timeToFinishMapping")
    time_to_finish_validating: int = Field(None, alias="timeToFinishValidating")


class ProjectUserStatsDTO(BaseModel):
    """DTO for time spent by users on a project"""

    time_spent_mapping: int = Field(alias="timeSpentMapping")
    time_spent_validating: int = Field(alias="timeSpentValidating")
    total_time_spent: int = Field(alias="totalTimeSpent")
