from backend.models.dtos.mapping_dto import TaskHistoryDTO, TaskStatusDTO
from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime


class UserContribution(BaseModel):
    """User contribution for a project"""

    def __init__(self, UserContribution):
        super().__init__()
        self.username = UserContribution["username"]
        self.mapping_level = UserContribution["mapping_level"]
        self.picture_url = UserContribution["picture_url"]
        self.mapped = UserContribution["mapped"]
        self.validated = UserContribution["validated"]
        self.bad_imagery = UserContribution["bad_imagery"]
        self.total = UserContribution["total"]
        self.mapped_tasks = UserContribution["mapped_tasks"]
        self.validated_tasks = UserContribution["validated_tasks"]
        self.bad_imagery_tasks = UserContribution["bad_imagery_tasks"]
        self.name = UserContribution["name"]
        self.date_registered = UserContribution["date_registered"]

    username: Optional[str] = None
    mapping_level: Optional[str] = Field(alias="mappingLevel", default=None)
    picture_url: Optional[str] = Field(alias="pictureUrl", default=None)
    mapped: Optional[int] = None
    validated: Optional[int] = None
    bad_imagery: Optional[int] = Field(alias="badImagery", default=None)
    total: Optional[int] = None
    mapped_tasks: Optional[List[int]] = Field(alias="mappedTasks", default=None)
    validated_tasks: Optional[List[int]] = Field(alias="validatedTasks", default=None)
    bad_imagery_tasks: Optional[List[int]] = Field(
        alias="badImageryTasks", default=None
    )
    name: Optional[str] = None
    date_registered: Optional[datetime] = Field(alias="dateRegistered", default=None)


# class UserContribution(BaseModel):
#     """User contribution for a project"""

#     username: Optional[str] = None
#     mapping_level: Optional[str] = Field(None, alias="mappingLevel")
#     picture_url: Optional[str] = Field(None, alias="pictureUrl")
#     mapped: Optional[int] = None
#     validated: Optional[int] = None
#     bad_imagery: Optional[int] = Field(None, alias="badImagery")
#     total: Optional[int] = None
#     mapped_tasks: Optional[List[int]] = Field(default_factory=list, alias="mappedTasks")
#     validated_tasks: Optional[List[int]] = Field(default_factory=list, alias="validatedTasks")
#     bad_imagery_tasks: Optional[List[int]] = Field(default_factory=list, alias="badImageryTasks")
#     name: Optional[str] = None
#     date_registered: Optional[datetime] = Field(None, alias="dateRegistered")

#     class Config:
#         allow_population_by_field_name = True


class ProjectContributionsDTO(BaseModel):
    """DTO for all user contributions on a project"""

    def __init__(self):
        super().__init__()
        self.user_contributions = []

    user_contributions: Optional[List[UserContribution]] = Field(
        alias="userContributions", default=None
    )


class Pagination(BaseModel):
    has_next: Optional[bool] = Field(serialization_alias="hasNext", default=False)
    has_prev: Optional[bool] = Field(serialization_alias="hasPrev", default=False)
    next_num: Optional[int] = Field(serialization_alias="nextNum", default=None)
    page: Optional[int] = None
    pages: Optional[int] = None
    prev_num: Optional[int] = Field(serialization_alias="prevNum", default=None)
    per_page: Optional[int] = Field(serialization_alias="perPage", default=None)
    total: Optional[int] = None

    @staticmethod
    def from_total_count(page: int, per_page: int, total: int) -> "Pagination":
        pages = (total + per_page - 1) // per_page
        has_next = page < pages
        has_prev = page > 1
        next_num = page + 1 if has_next else None
        prev_num = page - 1 if has_prev else None

        return Pagination(
            has_next=has_next,
            has_prev=has_prev,
            next_num=next_num,
            page=page,
            pages=pages,
            prev_num=prev_num,
            per_page=per_page,
            total=total,
        )


class ProjectActivityDTO(BaseModel):
    """DTO to hold all project activity"""

    pagination: Optional[Pagination] = None
    activity: Optional[List[TaskHistoryDTO]] = None


class ProjectLastActivityDTO(BaseModel):
    """DTO to hold latest status from project activity"""

    activity: Optional[List[TaskStatusDTO]] = Field(default_factory=list)


class OrganizationProjectsStatsDTO(BaseModel):
    draft: Optional[int] = None
    published: Optional[int] = None
    archived: Optional[int] = None
    recent: Optional[int] = None
    stale: Optional[int] = None


class OrganizationTasksStatsDTO(BaseModel):
    ready: Optional[int] = 0
    locked_for_mapping: Optional[int] = Field(0, serialization_alias="lockedForMapping")
    locked_for_validation: Optional[int] = Field(
        0, serialization_alias="lockedForValidation"
    )
    mapped: Optional[int] = 0
    validated: Optional[int] = 0
    invalidated: Optional[int] = 0
    badimagery: Optional[int] = Field(0, serialization_alias="badImagery")


class OrganizationStatsDTO(BaseModel):
    projects: Optional[OrganizationProjectsStatsDTO] = None
    active_tasks: Optional[OrganizationTasksStatsDTO] = Field(
        None, serialization_alias="activeTasks"
    )


class OrganizationListStatsDTO(BaseModel):
    def __init__(self, row):
        super().__init__()
        self.organisation = row[0]
        self.projects_created = row[1]

    organisation: str
    projects_created: int = Field(alias="projectsCreated")


class CampaignStatsDTO(BaseModel):
    def __init__(self, row):
        super().__init__()
        self.campaign = row[0]
        self.projects_created = row[1]

    campaign: str
    projects_created: int = Field(alias="projectsCreated")


class HomePageStatsDTO(BaseModel):
    """DTO for stats we want to display on the homepage"""

    def __init__(self):
        super().__init__()
        self.organisations = []
        self.campaigns = []

    mappers_online: Optional[int] = Field(None, alias="mappersOnline")
    total_area: Optional[int] = Field(None, alias="totalArea")
    tasks_mapped: Optional[int] = Field(None, alias="tasksMapped")
    tasks_validated: Optional[int] = Field(None, alias="tasksValidated")
    total_mappers: Optional[int] = Field(None, alias="totalMappers")
    total_validators: Optional[int] = Field(None, alias="totalValidators")
    total_projects: Optional[int] = Field(None, alias="totalProjects")
    total_mapped_area: Optional[float] = Field(None, alias="totalMappedArea")
    total_validated_area: Optional[float] = Field(None, alias="totalValidatedArea")
    total_organisations: Optional[int] = Field(None, alias="totalOrganisations")
    total_campaigns: Optional[int] = Field(None, alias="totalCampaigns")
    avg_completion_time: Optional[int] = Field(None, alias="averageCompletionTime")
    organisations: Optional[List[OrganizationListStatsDTO]] = None
    campaigns: Optional[List[CampaignStatsDTO]] = None


class TaskStats(BaseModel):
    """DTO for tasks stats for a single day"""

    date: datetime
    mapped: int = Field(alias="mapped")
    validated: int = Field(alias="validated")
    bad_imagery: int = Field(alias="badImagery")


class GenderStatsDTO(BaseModel):
    """DTO for genre stats of users."""

    male: int
    female: int
    prefer_not: int = Field(alias="preferNotIdentify")
    self_describe: int = Field(alias="selfDescribe")


class UserStatsDTO(BaseModel):
    """DTO for user stats."""

    total: int
    beginner: int
    intermediate: int
    advanced: int
    contributed: int
    email_verified: int = Field(alias="emailVerified")
    genders: GenderStatsDTO


class TaskStatsDTO(BaseModel):
    """Contains all tasks stats broken down by day"""

    def __init__(self):
        super().__init__()
        self.stats = []

    stats: List[TaskStats] = Field(alias="taskStats")
