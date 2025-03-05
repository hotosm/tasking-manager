from datetime import date, datetime
from typing import Any, Dict, List, Optional, Union

from fastapi import HTTPException
from pydantic import BaseModel, Field, root_validator

from backend.models.dtos.campaign_dto import CampaignDTO
from backend.models.dtos.interests_dto import InterestDTO
from backend.models.dtos.stats_dto import Pagination
from backend.models.dtos.task_annotation_dto import TaskAnnotationDTO
from backend.models.dtos.team_dto import ProjectTeamDTO
from backend.models.postgis.statuses import (
    Editors,
    MappingPermission,
    MappingTypes,
    ProjectDifficulty,
    ProjectPriority,
    ProjectStatus,
    TaskCreationMode,
    ValidationPermission,
)


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
            ),
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
            ),
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
            ),
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
            ),
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
            ),
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
            ),
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
            ),
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
            ),
        )
    return value


class DraftProjectDTO(BaseModel):
    """Describes JSON model used for creating draft project"""

    cloneFromProjectId: int = Field(None, alias="cloneFromProjectId")
    project_name: str = Field(..., alias="projectName")
    organisation: int = Field(None)
    area_of_interest: dict = Field({}, alias="areaOfInterest")
    tasks: Optional[dict] = Field({})
    has_arbitrary_tasks: bool = Field(False, alias="arbitraryTasks")
    user_id: int = Field(None)

    class Config:
        populate_by_name = True


class ProjectInfoDTO(BaseModel):
    """Contains the localized project info"""

    locale: str
    name: Optional[str] = ""
    short_description: Optional[str] = Field(default="", alias="shortDescription")
    description: Optional[str] = ""
    instructions: Optional[str] = ""
    per_task_instructions: Optional[str] = Field(
        default="", alias="perTaskInstructions"
    )

    class Config:
        populate_by_name = True

    @root_validator(pre=True)
    def replace_none_with_empty_string(cls, values):
        return {
            key: (value if value is not None or key == "locale" else "")
            for key, value in values.items()
        }


class CustomEditorDTO(BaseModel):
    """DTO to define a custom editor"""

    name: str = Field(None)
    description: Optional[str] = Field(None)
    url: str = Field(None)


class ProjectDTO(BaseModel):
    """Describes JSON model for a tasking manager project"""

    project_id: Optional[int] = Field(None, alias="projectId")
    project_status: str = Field(alias="status")
    project_priority: str = Field(alias="projectPriority")
    area_of_interest: Optional[dict] = Field(None, alias="areaOfInterest")
    aoi_bbox: Optional[List[float]] = Field(None, alias="aoiBBOX")
    tasks: Optional[dict] = None
    default_locale: str = Field(alias="defaultLocale")
    project_info: Optional[ProjectInfoDTO] = Field(None, alias="projectInfo")
    project_info_locales: Optional[List[ProjectInfoDTO]] = Field(
        None, alias="projectInfoLocales"
    )
    difficulty: str = Field(alias="difficulty")
    mapping_permission: str = Field(alias="mappingPermission")
    validation_permission: str = Field(alias="validationPermission")
    enforce_random_task_selection: Optional[bool] = Field(
        False, alias="enforceRandomTaskSelection"
    )
    private: bool
    changeset_comment: Optional[str] = Field(None, alias="changesetComment")
    osmcha_filter_id: Optional[str] = Field(None, alias="osmchaFilterId")
    due_date: Optional[datetime] = Field(None, alias="dueDate")
    imagery: Optional[str] = None
    josm_preset: Optional[str] = Field(None, alias="josmPreset")
    id_presets: Optional[List[str]] = Field(default=[], alias="idPresets")
    extra_id_params: Optional[str] = Field(None, alias="extraIdParams")
    rapid_power_user: Optional[bool] = Field(False, alias="rapidPowerUser")
    mapping_types: List[str] = Field(default=[], alias="mappingTypes")
    campaigns: List[CampaignDTO] = Field(default=[])
    organisation: Optional[int] = None
    organisation_name: Optional[str] = Field(None, alias="organisationName")
    organisation_slug: Optional[str] = Field(None, alias="organisationSlug")
    organisation_logo: Optional[str] = Field(None, alias="organisationLogo")
    country_tag: Optional[List[str]] = Field(None, alias="countryTag")
    license_id: Optional[int] = Field(None, alias="licenseId")
    allowed_usernames: Optional[List[str]] = Field(default=[], alias="allowedUsernames")
    priority_areas: Optional[List[Dict]] = Field(None, alias="priorityAreas")
    created: Optional[datetime] = None
    last_updated: Optional[datetime] = Field(None, alias="lastUpdated")
    author: Optional[str] = None
    active_mappers: Optional[int] = Field(None, alias="activeMappers")
    percent_mapped: Optional[int] = Field(None, alias="percentMapped")
    percent_validated: Optional[int] = Field(None, alias="percentValidated")
    percent_bad_imagery: Optional[int] = Field(None, alias="percentBadImagery")
    task_creation_mode: str = Field(alias="taskCreationMode")
    project_teams: Optional[List[ProjectTeamDTO]] = Field(None, alias="teams")
    mapping_editors: List[str] = Field(alias="mappingEditors")
    validation_editors: List[str] = Field(alias="validationEditors")
    custom_editor: Optional[CustomEditorDTO] = Field(None, alias="customEditor")
    interests: Optional[List[InterestDTO]] = None

    class Config:
        populate_by_name = True

    # TODO CHeck validators.
    # @validator('project_status')
    # def validate_project_status(cls, value):
    #     if not is_known_project_status(value):
    #         raise ValueError('Invalid project status')
    #     return value

    # @validator('project_priority')
    # def validate_project_priority(cls, value):
    #     if not is_known_project_priority(value):
    #         raise ValueError('Invalid project priority')
    #     return value

    # @validator('difficulty')
    # def validate_difficulty(cls, value):
    #     if not is_known_project_difficulty(value):
    #         raise ValueError('Invalid project difficulty')
    #     return value

    # @validator('mapping_permission')
    # def validate_mapping_permission(cls, value):
    #     if not is_known_mapping_permission(value):
    #         raise ValueError('Invalid mapping permission')
    #     return value

    # @validator('validation_permission')
    # def validate_validation_permission(cls, value):
    #     if not is_known_validation_permission(value):
    #         raise ValueError('Invalid validation permission')
    #     return value

    # @validator('mapping_types', each_item=True)
    # def validate_mapping_types(cls, value):
    #     if not is_known_mapping_type(value):
    #         raise ValueError('Invalid mapping type')
    #     return value

    # @validator('task_creation_mode')
    # def validate_task_creation_mode(cls, value):
    #     if not is_known_task_creation_mode(value):
    #         raise ValueError('Invalid task creation mode')
    #     return value

    # @validator('mapping_editors', 'validation_editors', each_item=True)
    # def validate_editors(cls, value):
    #     if not is_known_editor(value):
    #         raise ValueError('Invalid editor')
    #     return value


class ProjectFavoriteDTO(BaseModel):
    """DTO used to favorite a project"""

    project_id: int
    user_id: int


class ProjectFavoritesDTO(BaseModel):
    def __init__(self, favorited_projects: List[ProjectDTO] = None, **kwargs):
        super().__init__(**kwargs)
        self.favorited_projects = favorited_projects or []

    favorited_projects: List[ProjectDTO] = Field(default=[], alias="favoritedProjects")

    class Config:
        populate_by_name = True


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
    partner_id: Optional[int] = None
    partnership_from: Optional[str] = None
    partnership_to: Optional[str] = None
    download_as_csv: Optional[bool] = None

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
    project_author: Optional[int] = Field(default=None, alias="projectAuthor")

    class Config:
        populate_by_name = True


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
    last_updated: Optional[datetime] = Field(alias="lastUpdated", default=None)
    due_date: Optional[datetime] = Field(alias="dueDate", default=None)
    total_contributors: Optional[int] = Field(alias="totalContributors", default=None)
    country: Optional[List[str]] = Field(default=None)

    # csv fields
    creation_date: Optional[datetime] = Field(alias="creationDate", default=None)
    author: Optional[str] = None
    partner_names: Optional[List[str]] = Field(default=None, alias="partnerNames")
    total_area: Optional[float] = Field(None, alias="totalAreaSquareKilometers")

    class Config:
        populate_by_name = True

        json_encoders = {datetime: lambda v: v.isoformat() + "Z" if v else None}


class ProjectSearchResultsDTO(BaseModel):
    """Contains all results for the search criteria"""

    map_results: Optional[Any] = Field(default_factory=list, alias="mapResults")
    results: Optional[List["ListSearchResultDTO"]] = Field(default_factory=list)
    pagination: Optional["Pagination"] = Field(default_factory=dict)

    class Config:
        populate_by_name = True


class LockedTasksForUser(BaseModel):
    """Describes all tasks locked by an individual user"""

    locked_tasks: Optional[List[int]] = Field([], alias="lockedTasks")
    project: Optional[int] = Field(None, alias="projectId")
    task_status: Optional[str] = Field(None, alias="taskStatus")

    class Config:
        populate_by_name = True


class ProjectComment(BaseModel):
    """Describes an individual user comment on a project task"""

    comment: str
    comment_date: datetime = Field(alias="commentDate")
    user_name: str = Field(alias="userName")
    task_id: int = Field(alias="taskId")

    class Config:
        populate_by_name = True


class ProjectCommentsDTO(BaseModel):
    """Contains all comments on a project"""

    def __init__(self):
        """DTO constructor initialise all arrays to empty"""
        super().__init__()
        self.comments = []

    comments: List[ProjectComment]


class ProjectContribDTO(BaseModel):
    date: date
    mapped: int
    validated: int
    cumulative_mapped: Optional[int] = None
    cumulative_validated: Optional[int] = None
    total_tasks: Optional[int] = None


class ProjectContribsDTO(BaseModel):
    """Contains all contributions on a project by day"""

    stats: Optional[List[ProjectContribDTO]] = None


class ProjectSummary(BaseModel):
    project_id: int = Field(..., alias="projectId")
    default_locale: Optional[str] = Field(None, alias="defaultLocale")
    author: Optional[str] = None
    created: Optional[datetime] = None
    due_date: Optional[datetime] = Field(None, alias="dueDate")
    last_updated: Optional[datetime] = Field(None, alias="lastUpdated")
    priority: Optional[str] = Field(None, alias="projectPriority")
    campaigns: List[CampaignDTO] = Field(default_factory=list)
    organisation: Optional[int] = None
    organisation_name: Optional[str] = Field(None, alias="organisationName")
    organisation_slug: Optional[str] = Field(None, alias="organisationSlug")
    organisation_logo: Optional[str] = Field(None, alias="organisationLogo")
    country_tag: List[str] = Field(default_factory=list, alias="countryTag")
    osmcha_filter_id: Optional[str] = Field(None, alias="osmchaFilterId")
    mapping_types: List[str] = Field(default_factory=list, alias="mappingTypes")
    changeset_comment: Optional[str] = Field(None, alias="changesetComment")
    percent_mapped: Optional[int] = Field(None, alias="percentMapped")
    percent_validated: Optional[int] = Field(None, alias="percentValidated")
    percent_bad_imagery: Optional[int] = Field(None, alias="percentBadImagery")
    aoi_centroid: Optional[Union[dict, None]] = Field(None, alias="aoiCentroid")
    difficulty: Optional[str] = Field(None, alias="difficulty")
    mapping_permission: Optional[str] = Field(None, alias="mappingPermission")
    validation_permission: Optional[str] = Field(None, alias="validationPermission")
    allowed_usernames: List[str] = Field(default_factory=list, alias="allowedUsernames")
    random_task_selection_enforced: bool = Field(
        default=False, alias="enforceRandomTaskSelection"
    )
    private: Optional[bool] = Field(None, alias="private")
    allowed_users: List[str] = Field(default_factory=list, alias="allowedUsernames")
    project_teams: List[ProjectTeamDTO] = Field(default_factory=list, alias="teams")
    project_info: Optional[ProjectInfoDTO] = Field(None, alias="projectInfo")
    short_description: Optional[str] = Field(None, alias="shortDescription")
    status: Optional[str] = None
    imagery: Optional[str] = None
    license_id: Optional[int] = Field(None, alias="licenseId")
    id_presets: List[str] = Field(default_factory=list, alias="idPresets")
    extra_id_params: Optional[str] = Field(None, alias="extraIdParams")
    rapid_power_user: bool = Field(default=False, alias="rapidPowerUser")
    mapping_editors: List[str] = Field(..., min_items=1, alias="mappingEditors")
    validation_editors: List[str] = Field(..., min_items=1, alias="validationEditors")
    custom_editor: Optional[CustomEditorDTO] = Field(None, alias="customEditor")

    class Config:
        populate_by_name = True

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

    draft_projects: Optional[List[ProjectSummary]] = Field(
        default_factory=list, alias="draftProjects"
    )
    active_projects: Optional[List[ProjectSummary]] = Field(
        default_factory=list, alias="activeProjects"
    )
    archived_projects: Optional[List[ProjectSummary]] = Field(
        default_factory=list, alias="archivedProjects"
    )

    class Config:
        populate_by_name = True


class ProjectTaskAnnotationsDTO(BaseModel):
    """DTO for all task annotations on a project"""

    project_id: Optional[int] = Field(None, alias="projectId")
    tasks: Optional[List[TaskAnnotationDTO]] = Field(default_factory=list)

    class Config:
        populate_by_name = True


class ProjectStatsDTO(BaseModel):
    """DTO for detailed stats on a project"""

    project_id: Optional[int] = Field(None, alias="projectId")
    area: Optional[float] = Field(None, alias="projectArea(in sq.km)")
    total_mappers: Optional[int] = Field(None, alias="totalMappers")
    total_tasks: Optional[int] = Field(None, alias="totalTasks")
    total_comments: Optional[int] = Field(None, alias="totalComments")
    total_mapping_time: Optional[int] = Field(None, alias="totalMappingTime")
    total_validation_time: Optional[int] = Field(None, alias="totalValidationTime")
    total_time_spent: Optional[int] = Field(None, alias="totalTimeSpent")
    average_mapping_time: Optional[int] = Field(None, alias="averageMappingTime")
    average_validation_time: Optional[int] = Field(None, alias="averageValidationTime")
    percent_mapped: Optional[int] = Field(None, alias="percentMapped")
    percent_validated: Optional[int] = Field(None, alias="percentValidated")
    percent_bad_imagery: Optional[int] = Field(None, alias="percentBadImagery")
    aoi_centroid: Optional[str] = Field(None, alias="aoiCentroid")
    time_to_finish_mapping: Optional[int] = Field(None, alias="timeToFinishMapping")
    time_to_finish_validating: Optional[int] = Field(
        None, alias="timeToFinishValidating"
    )

    class Config:
        populate_by_name = True


class ProjectUserStatsDTO(BaseModel):
    """DTO for time spent by users on a project"""

    time_spent_mapping: Optional[int] = Field(default=0, alias="timeSpentMapping")
    time_spent_validating: Optional[int] = Field(default=0, alias="timeSpentValidating")
    total_time_spent: Optional[int] = Field(default=0, alias="totalTimeSpent")

    class Config:
        populate_by_name = True
