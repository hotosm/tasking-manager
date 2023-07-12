from schematics import Model
from schematics.types import StringType, IntType, FloatType, BooleanType, DateType
from schematics.types.compound import ListType, ModelType
from backend.models.dtos.mapping_dto import TaskHistoryDTO, TaskStatusDTO


class UserContribution(Model):
    """User contribution for a project"""

    username = StringType()
    mapping_level = StringType(serialized_name="mappingLevel")
    picture_url = StringType(serialized_name="pictureUrl")
    mapped = IntType()
    validated = IntType()
    bad_imagery = IntType(serialized_name="badImagery")
    total = IntType()
    mapped_tasks = ListType(IntType, serialized_name="mappedTasks")
    validated_tasks = ListType(IntType, serialized_name="validatedTasks")
    bad_imagery_tasks = ListType(IntType, serialized_name="badImageryTasks")
    name = StringType()
    date_registered = DateType(serialized_name="dateRegistered")


class ProjectContributionsDTO(Model):
    """DTO for all user contributions on a project"""

    def __init__(self):
        super().__init__()
        self.user_contributions = []

    user_contributions = ListType(
        ModelType(UserContribution), serialized_name="userContributions"
    )


class Pagination(Model):
    """Properties for paginating results"""

    def __init__(self, paginated_result):
        """Instantiate from a Flask-SQLAlchemy paginated result"""
        super().__init__()

        self.has_next = paginated_result.has_next
        self.has_prev = paginated_result.has_prev
        self.next_num = paginated_result.next_num
        self.page = paginated_result.page
        self.pages = paginated_result.pages
        self.prev_num = paginated_result.prev_num
        self.per_page = paginated_result.per_page
        self.total = paginated_result.total

    has_next = BooleanType(serialized_name="hasNext")
    has_prev = BooleanType(serialized_name="hasPrev")
    next_num = IntType(serialized_name="nextNum")
    page = IntType()
    pages = IntType()
    prev_num = IntType(serialized_name="prevNum")
    per_page = IntType(serialized_name="perPage")
    total = IntType()


class ProjectActivityDTO(Model):
    """DTO to hold all project activity"""

    def __init__(self):
        super().__init__()
        self.activity = []

    pagination = ModelType(Pagination)
    activity = ListType(ModelType(TaskHistoryDTO))


class ProjectLastActivityDTO(Model):
    """DTO to hold latest status from project activity"""

    def __init__(self):
        super().__init__()
        self.activity = []

    activity = ListType(ModelType(TaskStatusDTO))


class OrganizationProjectsStatsDTO(Model):
    draft = IntType()
    published = IntType()
    archived = IntType()
    recent = IntType()  # projects created in the current year
    stale = IntType()  # project without any activity in the last 6 months


class OrganizationTasksStatsDTO(Model):
    ready = IntType()
    locked_for_mapping = IntType(serialized_name="lockedForMapping")
    locked_for_validation = IntType(serialized_name="lockedForValidation")
    mapped = IntType()
    validated = IntType()
    invalidated = IntType()
    badimagery = IntType(serialized_name="badImagery")


class OrganizationStatsDTO(Model):
    projects = ModelType(OrganizationProjectsStatsDTO)
    active_tasks = ModelType(OrganizationTasksStatsDTO, serialized_name="activeTasks")


class OrganizationListStatsDTO(Model):
    def __init__(self, row):
        super().__init__()
        self.organisation = row[0]
        self.projects_created = row[1]

    organisation = StringType()
    projects_created = IntType(serialized_name="projectsCreated")


class CampaignStatsDTO(Model):
    def __init__(self, row):
        super().__init__()
        self.campaign = row[0]
        self.projects_created = row[1]

    campaign = StringType()
    projects_created = IntType(serialized_name="projectsCreated")


class HomePageStatsDTO(Model):
    """DTO for stats we want to display on the homepage"""

    def __init__(self):
        super().__init__()
        self.organisations = []
        self.campaigns = []

    mappers_online = IntType(serialized_name="mappersOnline")
    total_area = IntType(serialized_name="totalArea")
    tasks_mapped = IntType(serialized_name="tasksMapped")
    tasks_validated = IntType(serialized_name="tasksValidated")
    total_mappers = IntType(serialized_name="totalMappers")
    total_validators = IntType(serialized_name="totalValidators")
    total_projects = IntType(serialized_name="totalProjects")
    total_mapped_area = FloatType(serialized_name="totalMappedArea")
    total_validated_area = FloatType(serialized_name="totalValidatedArea")
    total_organisations = IntType(serialized_name="totalOrganisations")
    total_campaigns = IntType(serialized_name="totalCampaigns")
    # avg_completion_time = IntType(serialized_name='averageCompletionTime')
    organisations = ListType(ModelType(OrganizationListStatsDTO))
    campaigns = ListType(ModelType(CampaignStatsDTO))


class TaskStats(Model):
    """DTO for tasks stats for a single day"""

    date = DateType(required=True)
    mapped = IntType(serialized_name="mapped")
    validated = IntType(serialized_name="validated")
    bad_imagery = IntType(serialized_name="badImagery")


class GenderStatsDTO(Model):
    """DTO for genre stats of users."""

    male = IntType()
    female = IntType()
    prefer_not = IntType(serialized_name="preferNotIdentify")
    self_describe = IntType(serialized_name="selfDescribe")


class UserStatsDTO(Model):
    """DTO for user stats."""

    total = IntType()
    beginner = IntType()
    intermediate = IntType()
    advanced = IntType()
    contributed = IntType()
    email_verified = IntType(serialized_name="emailVerified")
    genders = ModelType(GenderStatsDTO)


class TaskStatsDTO(Model):
    """Contains all tasks stats broken down by day"""

    def __init__(self):
        super().__init__()
        self.stats = []

    stats = ListType(ModelType(TaskStats), serialized_name="taskStats")
