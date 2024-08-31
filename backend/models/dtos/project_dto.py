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

from pydantic import BaseModel, Field, ValidationError, field_validator
from typing import List, Optional, Union
from datetime import datetime
from typing_extensions import Annotated
from fastapi import HTTPException

def is_known_project_status(value: str) -> str:
    """Validates that Project Status is a known value."""
    try:
        ProjectStatus[value.upper()]
    except KeyError:
        raise HTTPException(
            status_code=400,
            detail=(
                f"Unknown projectStatus: {value}. Valid values are: "
                f"{ProjectStatus.DRAFT.name}, "
                f"{ProjectStatus.PUBLISHED.name}, "
                f"{ProjectStatus.ARCHIVED.name}."
            )
        )
    return value

def is_known_project_priority(value: str) -> str:
    """Validates that Project Priority is a known value."""
    try:
        ProjectPriority[value.upper()]
    except KeyError:
        raise HTTPException(
            status_code=400,
            detail=(
                f"Unknown projectPriority: {value}. Valid values are: "
                f"{ProjectPriority.LOW.name}, "
                f"{ProjectPriority.MEDIUM.name}, "
                f"{ProjectPriority.HIGH.name}, "
                f"{ProjectPriority.URGENT.name}."
            )
        )
    return value

def is_known_mapping_type(value: str) -> str:
    """Validates that Mapping Type is a known value."""
    try:
        MappingTypes[value.upper()]
    except KeyError:
        raise HTTPException(
            status_code=400,
            detail=(
                f"Unknown mappingType: {value}. Valid values are: "
                f"{MappingTypes.ROADS.name}, "
                f"{MappingTypes.BUILDINGS.name}, "
                f"{MappingTypes.WATERWAYS.name}, "
                f"{MappingTypes.LAND_USE.name}, "
                f"{MappingTypes.OTHER.name}."
            )
        )
    return value

def is_known_editor(value: str) -> str:
    """Validates that Editor is a known value."""
    try:
        Editors[value.upper()]
    except KeyError:
        raise HTTPException(
            status_code=400,
            detail=(
                f"Unknown editor: {value}. Valid values are: "
                f"{Editors.ID.name}, "
                f"{Editors.JOSM.name}, "
                f"{Editors.POTLATCH_2.name}, "
                f"{Editors.FIELD_PAPERS.name}, "
                f"{Editors.RAPID.name}."
            )
        )
    return value

def is_known_task_creation_mode(value: str) -> str:
    """Validates that Task Creation Mode is a known value."""
    try:
        TaskCreationMode[value.upper()]
    except KeyError:
        raise HTTPException(
            status_code=400,
            detail=(
                f"Unknown taskCreationMode: {value}. Valid values are: "
                f"{TaskCreationMode.GRID.name}, "
                f"{TaskCreationMode.ARBITRARY.name}."
            )
        )
    return value

def is_known_mapping_permission(value: str) -> str:
    """Validates that Mapping Permission is a known value."""
    try:
        MappingPermission[value.upper()]
    except KeyError:
        raise HTTPException(
            status_code=400,
            detail=(
                f"Unknown mappingPermission: {value}. Valid values are: "
                f"{MappingPermission.ANY.name}, "
                f"{MappingPermission.LEVEL.name}."
            )
        )
    return value

def is_known_validation_permission(value: str) -> str:
    """Validates that Validation Permission is a known value."""
    try:
        ValidationPermission[value.upper()]
    except KeyError:
        raise HTTPException(
            status_code=400,
            detail=(
                f"Unknown validationPermission: {value}. Valid values are: "
                f"{ValidationPermission.ANY.name}, "
                f"{ValidationPermission.LEVEL.name}, "
                f"{ValidationPermission.TEAMS.name}, "
                f"{ValidationPermission.TEAMS_LEVEL.name}."
            )
        )
    return value

def is_known_project_difficulty(value: str) -> str:
    """Validates that Project Difficulty is a known value."""
    if value.upper() == "ALL":
        return value

    try:
        value_list = value.split(",")
        for difficulty in value_list:
            ProjectDifficulty[difficulty.upper()]
    except KeyError:
        raise HTTPException(
            status_code=400,
            detail=(
                f"Unknown projectDifficulty: {value}. Valid values are: "
                f"{ProjectDifficulty.EASY.name}, "
                f"{ProjectDifficulty.MODERATE.name}, "
                f"{ProjectDifficulty.CHALLENGING.name}, and ALL."
            )
        )
    return value

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
    name: Optional[str] = ""  # Optional, with default as empty string
    short_description: Optional[str] = Field(default="", serialization_alias="shortDescription")  # Optional, with default as empty string
    description: Optional[str] = ""  # Optional, with default as empty string
    instructions: Optional[str] = ""  # Optional, with default as empty string
    per_task_instructions: Optional[str] = Field(default="", serialization_alias="perTaskInstructions")

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
    country_tag: Optional[List[str]] = Field(serialization_alias="countryTag", default=[])
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
    bbox: List[float] = Field(..., min_items=4, max_items=4)
    input_srid: int = Field(..., choices=[4326])
    preferred_locale: Optional[str] = Field(default="en")
    project_author: Optional[int] = Field(default=None, serialization_alias="projectAuthor")

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

class ProjectSearchResultsDTO(BaseModel):
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
    project_id: int = Field(..., serialization_alias="projectId")
    default_locale: Optional[str] = Field(None, serialization_alias="defaultLocale")
    author: Optional[str] = None
    created: Optional[datetime] = None
    due_date: Optional[datetime] = Field(None, serialization_alias="dueDate")
    last_updated: Optional[datetime] = Field(None, serialization_alias="lastUpdated")
    priority: Optional[str] = Field(None, serialization_alias="projectPriority")
    campaigns: List[CampaignDTO] = Field(default_factory=list)
    organisation: Optional[int] = None
    organisation_name: Optional[str] = Field(None, serialization_alias="organisationName")
    organisation_slug: Optional[str] = Field(None, serialization_alias="organisationSlug")
    organisation_logo: Optional[str] = Field(None, serialization_alias="organisationLogo")
    country_tag: List[str] = Field(default_factory=list, serialization_alias="countryTag")
    osmcha_filter_id: Optional[str] = Field(None, serialization_alias="osmchaFilterId")
    mapping_types: List[str] = Field(default_factory=list, serialization_alias="mappingTypes")
    changeset_comment: Optional[str] = Field(None, serialization_alias="changesetComment")
    percent_mapped: Optional[int] = Field(None, serialization_alias="percentMapped")
    percent_validated: Optional[int] = Field(None, serialization_alias="percentValidated")
    percent_bad_imagery: Optional[int] = Field(None, serialization_alias="percentBadImagery")
    aoi_centroid: Optional[Union[dict, None]] = Field(None, serialization_alias="aoiCentroid")
    difficulty: Optional[str] = Field(None, serialization_alias="difficulty")
    mapping_permission: Optional[int] = Field(None, serialization_alias="mappingPermission")
    validation_permission: Optional[int] = Field(None, serialization_alias="validationPermission")
    allowed_usernames: List[str] = Field(default_factory=list, serialization_alias="allowedUsernames")
    random_task_selection_enforced: bool = Field(default=False, serialization_alias="enforceRandomTaskSelection")
    private: Optional[bool] = Field(None, serialization_alias="private")
    allowed_users: List[str] = Field(default_factory=list, serialization_alias="allowedUsernames")
    project_teams: List[ProjectTeamDTO] = Field(default_factory=list, serialization_alias="teams")
    project_info: Optional[ProjectInfoDTO] = Field(None, serialization_alias="projectInfo")
    short_description: Optional[str] = Field(None, serialization_alias="shortDescription")
    status: Optional[str] = None
    imagery: Optional[str] = None
    license_id: Optional[int] = Field(None, serialization_alias="licenseId")
    id_presets: List[str] = Field(default_factory=list, serialization_alias="idPresets")
    extra_id_params: Optional[str] = Field(None, serialization_alias="extraIdParams")
    rapid_power_user: bool = Field(default=False, serialization_alias="rapidPowerUser")
    mapping_editors: List[str] = Field(..., min_items=1, serialization_alias="mappingEditors")
    validation_editors: List[str] = Field(..., min_items=1, serialization_alias="validationEditors")
    custom_editor: Optional[CustomEditorDTO] = Field(None, serialization_alias="customEditor")

    #TODO: Make Validators work.

    # @field_validator('mapping_types', 'mapping_editors', 'validation_editors', mode='plain')
    # def validate_list_fields(cls, v, field):
    #     print(field,'-----')
    #     field_name = field.field_name
    #     if field_name == 'mapping_types' and not is_known_mapping_type(v):
    #         raise ValueError(f"Invalid value in {field_name}")
    #     if field_name in ['mapping_editors', 'validation_editors'] and not is_known_editor(v):
    #         raise ValueError(f"Invalid value in {field_name}")
    #     return v
    
    # @field_validator('mapping_permission', 'validation_permission', mode='plain')
    # def validate_permissions(cls, v, field):
    #     if field.name == 'mapping_permission' and not is_known_mapping_permission(v):
    #         raise ValueError(f"Invalid value in {field.name}")
    #     if field.name == 'validation_permission' and not is_known_validation_permission(v):
    #         raise ValueError(f"Invalid value in {field.name}")
    #     return v


class PMDashboardDTO(BaseModel):
    """DTO for constructing the PM Dashboard"""

    draft_projects: Optional[List[ProjectSummary]] = Field(default_factory=list, alias="draftProjects")
    active_projects: Optional[List[ProjectSummary]] = Field(default_factory=list, alias="activeProjects")
    archived_projects: Optional[List[ProjectSummary]] = Field(default_factory=list, alias="archivedProjects")

    class Config:
        allow_population_by_field_name = True

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
