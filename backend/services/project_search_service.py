import pandas as pd
from backend.models.postgis.user import User
from flask import current_app
import math
import geojson
from geoalchemy2 import shape
from sqlalchemy import func, distinct, desc, or_, and_
from shapely.geometry import Polygon, box
from cachetools import TTLCache, cached

from backend import db
from backend.exceptions import NotFound
from backend.api.utils import validate_date_input
from backend.models.dtos.project_dto import (
    ProjectSearchDTO,
    ProjectSearchResultsDTO,
    ListSearchResultDTO,
    Pagination,
    ProjectSearchBBoxDTO,
)
from backend.models.postgis.project import Project, ProjectInfo, ProjectTeams
from backend.models.postgis.partner import Partner
from backend.models.postgis.statuses import (
    ProjectStatus,
    MappingLevel,
    MappingTypes,
    ProjectPriority,
    UserRole,
    TeamRoles,
    ValidationPermission,
    MappingPermission,
    ProjectDifficulty,
)
from backend.models.postgis.project_partner import ProjectPartnership
from backend.models.postgis.campaign import Campaign
from backend.models.postgis.organisation import Organisation
from backend.models.postgis.task import TaskHistory
from backend.models.postgis.utils import (
    ST_Intersects,
    ST_MakeEnvelope,
    ST_Transform,
    ST_Area,
)
from backend.models.postgis.interests import project_interests
from backend.services.users.user_service import UserService

search_cache = TTLCache(maxsize=128, ttl=300)
csv_download_cache = TTLCache(maxsize=16, ttl=600)

# max area allowed for passed in bbox, calculation shown to help future maintenance
# client resolution (mpp)* arbitrary large map size on a large screen in pixels * 50% buffer, all squared
MAX_AREA = math.pow(1250 * 4275 * 1.5, 2)


class ProjectSearchServiceError(Exception):
    """Custom Exception to notify callers an error occurred when handling mapping"""

    def __init__(self, message):
        if current_app:
            current_app.logger.debug(message)


class BBoxTooBigError(Exception):
    """Custom Exception to notify callers an error occurred when handling mapping"""

    def __init__(self, message):
        if current_app:
            current_app.logger.debug(message)


class ProjectSearchService:
    @staticmethod
    def create_search_query(user=None, as_csv: bool = False):
        if as_csv:
            query = (
                db.session.query(
                    Project.id.label("id"),
                    ProjectInfo.name.label("project_name"),
                    Project.difficulty,
                    Project.priority,
                    Project.default_locale,
                    Project.centroid.ST_AsGeoJSON().label("centroid"),
                    Project.organisation_id,
                    Project.tasks_bad_imagery,
                    Project.tasks_mapped,
                    Project.tasks_validated,
                    Project.percent_mapped,
                    Project.percent_validated,
                    Project.status,
                    Project.total_tasks,
                    Project.last_updated,
                    Project.due_date,
                    Project.country,
                    Organisation.name.label("organisation_name"),
                    Organisation.logo.label("organisation_logo"),
                    User.name.label("author_name"),
                    User.username.label("author_username"),
                    Project.created.label("creation_date"),
                    func.coalesce(
                        func.sum(func.ST_Area(Project.geometry, True) / 1000000)
                    ).label("total_area"),
                )
                .filter(Project.geometry is not None)
                .outerjoin(Organisation, Organisation.id == Project.organisation_id)
                .outerjoin(User, User.id == Project.author_id)
                .group_by(
                    Organisation.id,
                    Project.id,
                    ProjectInfo.name,
                    User.username,
                    User.name,
                )
            )
        else:
            query = (
                db.session.query(
                    Project.id.label("id"),
                    Project.difficulty,
                    Project.priority,
                    Project.default_locale,
                    Project.centroid.ST_AsGeoJSON().label("centroid"),
                    Project.organisation_id,
                    Project.tasks_bad_imagery,
                    Project.tasks_mapped,
                    Project.tasks_validated,
                    Project.status,
                    Project.total_tasks,
                    Project.last_updated,
                    Project.due_date,
                    Project.country,
                    Organisation.name.label("organisation_name"),
                    Organisation.logo.label("organisation_logo"),
                )
                .filter(Project.geometry is not None)
                .outerjoin(Organisation, Organisation.id == Project.organisation_id)
                .group_by(Organisation.id, Project.id)
            )

        # Get public projects only for anonymous user.
        if user is None:
            query = query.filter(Project.private.is_(False))

        if user is not None and user.role != UserRole.ADMIN.value:
            # Get also private projects of teams that the user is member.
            project_ids = [[p.project_id for p in t.team.projects] for t in user.teams]

            # Get projects that belong to user organizations.
            orgs_projects_ids = [[p.id for p in u.projects] for u in user.organisations]

            project_ids.extend(orgs_projects_ids)

            project_ids = tuple(
                set([item for sublist in project_ids for item in sublist])
            )

            query = query.filter(
                or_(Project.private.is_(False), Project.id.in_(project_ids))
            )

        # If the user is admin, no filter.
        return query

    @staticmethod
    def create_result_dto(
        project: Project,
        preferred_locale: str,
        total_contributors: int,
        with_partner_names: bool = False,
        with_author_name: bool = True,
    ) -> ListSearchResultDTO:
        project_info_dto = ProjectInfo.get_dto_for_locale(
            project.id, preferred_locale, project.default_locale
        )
        project_obj = Project.get(project.id)
        list_dto = ListSearchResultDTO()
        list_dto.project_id = project.id
        list_dto.locale = project_info_dto.locale
        list_dto.name = project_info_dto.name
        list_dto.priority = ProjectPriority(project.priority).name
        list_dto.difficulty = ProjectDifficulty(project.difficulty).name
        list_dto.short_description = project_info_dto.short_description
        list_dto.last_updated = project.last_updated
        list_dto.due_date = project.due_date
        list_dto.percent_mapped = project_obj.calculate_tasks_percent(
            "mapped",
        )
        list_dto.percent_validated = project_obj.calculate_tasks_percent(
            "validated",
        )
        list_dto.status = ProjectStatus(project.status).name
        list_dto.active_mappers = Project.get_active_mappers(project.id)
        list_dto.total_contributors = total_contributors
        list_dto.country = project.country
        list_dto.organisation_name = project.organisation_name
        list_dto.organisation_logo = project.organisation_logo
        list_dto.campaigns = Project.get_project_campaigns(project.id)

        list_dto.creation_date = project_obj.created

        if with_author_name:
            list_dto.author = project_obj.author.name or project_obj.author.username

        if with_partner_names:
            list_dto.partner_names = list(
                set(
                    map(
                        lambda p: Partner.get_by_id(p.partner_id).name,
                        project_obj.partnerships,
                    )
                )
            )

        # Use postgis to compute the total area of the geometry in square kilometers
        list_dto.total_area = project_obj.query.with_entities(
            func.coalesce(func.sum(func.ST_Area(project_obj.geometry, True) / 1000000))
        ).scalar()
        list_dto.total_area = round(list_dto.total_area, 3)

        return list_dto

    @staticmethod
    def get_total_contributions(paginated_results):
        paginated_projects_ids = [p.id for p in paginated_results]

        # We need to make a join to return projects without contributors.
        project_contributors_count = (
            Project.query.with_entities(
                Project.id, func.count(distinct(TaskHistory.user_id)).label("total")
            )
            .filter(Project.id.in_(paginated_projects_ids))
            .outerjoin(
                TaskHistory,
                and_(
                    TaskHistory.project_id == Project.id,
                    TaskHistory.action != "COMMENT",
                ),
            )
            .group_by(Project.id)
            .all()
        )

        return [p.total for p in project_contributors_count]

    @staticmethod
    @cached(csv_download_cache)
    def search_projects_as_csv(search_dto: ProjectSearchDTO, user) -> str:
        all_results, _ = ProjectSearchService._filter_projects(search_dto, user, True)
        rows = [row._asdict() for row in all_results]
        is_user_admin = user is not None and user.role == UserRole.ADMIN.value

        for row in rows:
            row["priority"] = ProjectPriority(row["priority"]).name
            row["difficulty"] = ProjectDifficulty(row["difficulty"]).name
            row["status"] = ProjectStatus(row["status"]).name
            row["total_area"] = round(row["total_area"], 3)
            row["total_contributors"] = Project.get_project_total_contributions(
                row["id"]
            )
            row["author"] = row["author_name"] or row["author_username"]

            if is_user_admin:
                partners_names = (
                    ProjectPartnership.query.with_entities(
                        ProjectPartnership.project_id, Partner.name
                    )
                    .join(Partner, ProjectPartnership.partner_id == Partner.id)
                    .filter(ProjectPartnership.project_id == row["id"])
                    .group_by(ProjectPartnership.project_id, Partner.name)
                    .all()
                )
                row["partner_names"] = [pn for (_, pn) in partners_names]

        df = pd.json_normalize(rows)
        columns_to_drop = [
            "default_locale",
            "organisation_id",
            "organisation_logo",
            "tasks_bad_imagery",
            "tasks_mapped",
            "tasks_validated",
            "total_tasks",
            "centroid",
            "author_name",
            "author_username",
        ]

        colummns_to_rename = {
            "id": "projectId",
            "organisation_name": "organisationName",
            "last_updated": "lastUpdated",
            "due_date": "dueDate",
            "percent_mapped": "percentMapped",
            "percent_validated": "percentValidated",
            "total_area": "totalArea",
            "total_contributors": "totalContributors",
            "partner_names": "partnerNames",
            "project_name": "name",
        }

        df.drop(
            columns=columns_to_drop,
            inplace=True,
            axis=1,
        )
        df.rename(columns=colummns_to_rename, inplace=True)
        return df.to_csv(index=False)

    @staticmethod
    @cached(search_cache)
    def search_projects(search_dto: ProjectSearchDTO, user) -> ProjectSearchResultsDTO:
        """Searches all projects for matches to the criteria provided by the user"""
        all_results, paginated_results = ProjectSearchService._filter_projects(
            search_dto, user
        )
        if paginated_results.total == 0:
            raise NotFound(sub_code="PROJECTS_NOT_FOUND")

        dto = ProjectSearchResultsDTO()
        dto.results = [
            ProjectSearchService.create_result_dto(
                p,
                search_dto.preferred_locale,
                Project.get_project_total_contributions(p[0]),
                with_partner_names=(
                    user is not None and user.role == UserRole.ADMIN.value
                ),
                with_author_name=True,
            )
            for p in paginated_results.items
        ]
        dto.pagination = Pagination(paginated_results)
        if search_dto.omit_map_results:
            return dto

        features = []
        for project in all_results:
            # This loop creates a geojson feature collection so you can see all active projects on the map
            properties = {
                "projectId": project.id,
                "priority": ProjectPriority(project.priority).name,
            }
            # centroid = project.centroid
            feature = geojson.Feature(
                geometry=geojson.loads(project.centroid), properties=properties
            )
            features.append(feature)
        feature_collection = geojson.FeatureCollection(features)
        dto.map_results = feature_collection

        return dto

    @staticmethod
    def _filter_projects(search_dto: ProjectSearchDTO, user, as_csv=False):
        """Filters all projects based on criteria provided by user"""

        query = ProjectSearchService.create_search_query(user, as_csv)

        query = query.join(ProjectInfo).filter(
            ProjectInfo.locale.in_([search_dto.preferred_locale, "en"])
        )
        project_status_array = []
        if search_dto.project_statuses:
            project_status_array = [
                ProjectStatus[project_status].value
                for project_status in search_dto.project_statuses
            ]
            query = query.filter(Project.status.in_(project_status_array))
        else:
            if not search_dto.created_by:
                project_status_array = [ProjectStatus.PUBLISHED.value]
                query = query.filter(Project.status.in_(project_status_array))

        if not search_dto.based_on_user_interests:
            # Only filter by interests if not based on user interests is provided
            if search_dto.interests:
                query = query.join(
                    project_interests, project_interests.c.project_id == Project.id
                ).filter(project_interests.c.interest_id.in_(search_dto.interests))
        else:
            user = UserService.get_user_by_id(search_dto.based_on_user_interests)
            query = query.join(
                project_interests, project_interests.c.project_id == Project.id
            ).filter(
                project_interests.c.interest_id.in_(
                    [interest.id for interest in user.interests]
                )
            )
        if search_dto.created_by:
            query = query.filter(Project.author_id == search_dto.created_by)
        if search_dto.mapped_by:
            projects_mapped = UserService.get_projects_mapped(search_dto.mapped_by)
            query = query.filter(Project.id.in_(projects_mapped))
        if search_dto.favorited_by:
            projects_favorited = user.favorites
            query = query.filter(
                Project.id.in_([project.id for project in projects_favorited])
            )
        if search_dto.difficulty and search_dto.difficulty.upper() != "ALL":
            query = query.filter(
                Project.difficulty == ProjectDifficulty[search_dto.difficulty].value
            )
        if search_dto.action and search_dto.action != "any":
            if search_dto.action == "map":
                query = ProjectSearchService.filter_projects_to_map(query, user)
            if search_dto.action == "validate":
                query = ProjectSearchService.filter_projects_to_validate(query, user)

        if search_dto.organisation_name:
            query = query.filter(Organisation.name == search_dto.organisation_name)

        if search_dto.organisation_id:
            query = query.filter(Organisation.id == search_dto.organisation_id)

        if search_dto.team_id:
            query = query.join(
                ProjectTeams, ProjectTeams.project_id == Project.id
            ).filter(ProjectTeams.team_id == search_dto.team_id)

        if search_dto.campaign:
            query = query.join(Campaign, Project.campaign).group_by(Campaign.name)
            query = query.filter(Campaign.name == search_dto.campaign)

        if search_dto.mapping_types:
            # Construct array of mapping types for query
            mapping_type_array = []

            if search_dto.mapping_types_exact:
                mapping_type_array = [
                    {
                        MappingTypes[mapping_type].value
                        for mapping_type in search_dto.mapping_types
                    }
                ]
                query = query.filter(Project.mapping_types.in_(mapping_type_array))
            else:
                mapping_type_array = [
                    MappingTypes[mapping_type].value
                    for mapping_type in search_dto.mapping_types
                ]
                query = query.filter(Project.mapping_types.overlap(mapping_type_array))

        if search_dto.text_search:
            # We construct an OR search, so any projects that contain or more of the search terms should be returned
            invalid_ts_chars = "@|&!><\\():"
            search_text = "".join(
                char for char in search_dto.text_search if char not in invalid_ts_chars
            )
            or_search = " | ".join([x for x in search_text.split(" ") if x != ""])
            opts = [
                ProjectInfo.text_searchable.match(
                    or_search, postgresql_regconfig="english"
                ),
                ProjectInfo.name.ilike(f"%{or_search}%"),
            ]
            try:
                opts.append(Project.id == int(search_dto.text_search))
            except ValueError:
                pass

            query = query.filter(or_(*opts))

        if search_dto.country:
            # Unnest country column array.
            sq = Project.query.with_entities(
                Project.id, func.unnest(Project.country).label("country")
            ).subquery()
            query = query.filter(
                func.lower(sq.c.country) == search_dto.country.lower()
            ).filter(Project.id == sq.c.id)

        if search_dto.last_updated_gte:
            last_updated_gte = validate_date_input(search_dto.last_updated_gte)
            query = query.filter(Project.last_updated >= last_updated_gte)

        if search_dto.last_updated_lte:
            last_updated_lte = validate_date_input(search_dto.last_updated_lte)
            query = query.filter(Project.last_updated <= last_updated_lte)

        if search_dto.created_gte:
            created_gte = validate_date_input(search_dto.created_gte)
            query = query.filter(Project.created >= created_gte)

        if search_dto.created_lte:
            created_lte = validate_date_input(search_dto.created_lte)
            query = query.filter(Project.created <= created_lte)

        if search_dto.partner_id:
            query = query.join(
                ProjectPartnership, ProjectPartnership.project_id == Project.id
            ).filter(ProjectPartnership.partner_id == search_dto.partner_id)

            if search_dto.partnership_from:
                partnership_from = validate_date_input(search_dto.partnership_from)
                query = query.filter(ProjectPartnership.started_on <= partnership_from)

            if search_dto.partnership_to:
                partnership_to = validate_date_input(search_dto.partnership_to)
                query = query.filter(
                    (ProjectPartnership.ended_on.is_(None))
                    | (ProjectPartnership.ended_on >= partnership_to)
                )

        order_by = search_dto.order_by

        if search_dto.order_by == "percent_mapped":
            if search_dto.order_by_type == "DESC":
                order_by = Project.percent_mapped.desc()
            else:
                order_by = Project.percent_mapped.asc()
            query = query.order_by(order_by)
        elif search_dto.order_by == "percent_validated":
            if search_dto.order_by_type == "DESC":
                order_by = Project.percent_validated.desc()
            else:
                order_by = Project.percent_validated.asc()
            query = query.order_by(order_by)
        else:
            if search_dto.order_by_type == "DESC":
                order_by = desc(search_dto.order_by)
            query = query.order_by(order_by).distinct(search_dto.order_by, Project.id)

        if search_dto.managed_by and user.role != UserRole.ADMIN.value:
            # Get all the projects associated with the user and team.
            orgs_projects_ids = [[p.id for p in u.projects] for u in user.organisations]
            orgs_projects_ids = [
                item for sublist in orgs_projects_ids for item in sublist
            ]

            team_project_ids = [
                [
                    p.project_id
                    for p in u.team.projects
                    if p.role == TeamRoles.PROJECT_MANAGER.value
                ]
                for u in user.teams
            ]
            team_project_ids = [
                item for sublist in team_project_ids for item in sublist
            ]

            orgs_projects_ids.extend(team_project_ids)
            ids = tuple(set(orgs_projects_ids))
            query = query.filter(Project.id.in_(ids))

        all_results = []
        if not search_dto.omit_map_results:
            query_result = query
            query_result.column_descriptions.clear()
            query_result.add_columns(
                Project.id,
                Project.centroid.ST_AsGeoJSON().label("centroid"),
                Project.priority,
            )
            all_results = query_result.all()

        paginated_results = query.paginate(
            page=search_dto.page, per_page=14, error_out=True
        )

        return all_results, paginated_results

    @staticmethod
    def filter_by_user_permission(query, user, permission: str):
        """Filter projects a user can map or validate, based on their permissions."""
        if user and user.role != UserRole.ADMIN.value:
            if permission == "validation_permission":
                permission_class = ValidationPermission
                team_roles = [
                    TeamRoles.VALIDATOR.value,
                    TeamRoles.PROJECT_MANAGER.value,
                ]
            else:
                permission_class = MappingPermission
                team_roles = [
                    TeamRoles.MAPPER.value,
                    TeamRoles.VALIDATOR.value,
                    TeamRoles.PROJECT_MANAGER.value,
                ]

            selection = []
            # get ids of projects assigned to the user's teams
            [
                [
                    selection.append(team_project.project_id)
                    for team_project in user_team.team.projects
                    if team_project.project_id not in selection
                    and team_project.role in team_roles
                ]
                for user_team in user.teams
            ]
            if user.mapping_level == MappingLevel.BEGINNER.value:
                # if user is beginner, get only projects with ANY or TEAMS mapping permission
                # in the later case, only those that are associated with user teams
                query = query.filter(
                    or_(
                        and_(
                            Project.id.in_(selection),
                            getattr(Project, permission)
                            == permission_class.TEAMS.value,
                        ),
                        getattr(Project, permission) == permission_class.ANY.value,
                    )
                )
            else:
                # if user is intermediate or advanced, get projects with ANY or LEVEL permission
                # and projects associated with user teams
                query = query.filter(
                    or_(
                        Project.id.in_(selection),
                        getattr(Project, permission).in_(
                            [
                                permission_class.ANY.value,
                                permission_class.LEVEL.value,
                            ]
                        ),
                    )
                )

        return query

    @staticmethod
    def filter_projects_to_map(query, user):
        """Filter projects that needs mapping and can be mapped by the current user."""
        query = query.filter(
            Project.tasks_mapped + Project.tasks_validated
            < Project.total_tasks - Project.tasks_bad_imagery
        )
        return ProjectSearchService.filter_by_user_permission(
            query, user, "mapping_permission"
        )

    @staticmethod
    def filter_projects_to_validate(query, user):
        """Filter projects that needs validation and can be validated by the current user."""
        query = query.filter(
            Project.tasks_validated < Project.total_tasks - Project.tasks_bad_imagery
        )
        return ProjectSearchService.filter_by_user_permission(
            query, user, "validation_permission"
        )

    @staticmethod
    def get_projects_geojson(
        search_bbox_dto: ProjectSearchBBoxDTO,
    ) -> geojson.FeatureCollection:
        """Search for projects meeting the provided criteria. Returns a GeoJSON feature collection."""

        # make a polygon from provided bounding box
        polygon = ProjectSearchService._make_4326_polygon_from_bbox(
            search_bbox_dto.bbox, search_bbox_dto.input_srid
        )

        # validate the bbox area is less than or equal to the max area allowed to prevent
        # abuse of the api or performance issues from large requests
        if not ProjectSearchService.validate_bbox_area(polygon):
            raise BBoxTooBigError(
                "BBoxTooBigError- Requested bounding box is too large"
            )

        # get projects intersecting the polygon for created by the author_id
        intersecting_projects = ProjectSearchService._get_intersecting_projects(
            polygon, search_bbox_dto.project_author
        )

        # allow an empty feature collection to be returned if no intersecting features found, since this is primarily
        # for returning data to show on a map
        features = []
        for project in intersecting_projects:
            try:
                localDTO = ProjectInfo.get_dto_for_locale(
                    project.id, search_bbox_dto.preferred_locale, project.default_locale
                )
            except Exception:
                pass

            properties = {
                "projectId": project.id,
                "projectStatus": ProjectStatus(project.status).name,
                "projectName": localDTO.name,
            }
            feature = geojson.Feature(
                geometry=geojson.loads(project.geometry), properties=properties
            )
            features.append(feature)

        return geojson.FeatureCollection(features)

    @staticmethod
    def _get_intersecting_projects(search_polygon: Polygon, author_id: int):
        """Executes a database query to get the intersecting projects created by the author if provided"""

        query = db.session.query(
            Project.id,
            Project.status,
            Project.default_locale,
            Project.geometry.ST_AsGeoJSON().label("geometry"),
        ).filter(
            ST_Intersects(
                Project.geometry,
                ST_MakeEnvelope(
                    search_polygon.bounds[0],
                    search_polygon.bounds[1],
                    search_polygon.bounds[2],
                    search_polygon.bounds[3],
                    4326,
                ),
            )
        )

        if author_id:
            query = query.filter(Project.author_id == author_id)

        return query.all()

    @staticmethod
    def _make_4326_polygon_from_bbox(bbox: list, srid: int) -> Polygon:
        """make a shapely Polygon in SRID 4326 from bbox and srid"""
        try:
            polygon = box(bbox[0], bbox[1], bbox[2], bbox[3])
            if not srid == 4326:
                geometry = shape.from_shape(polygon, srid)
                with db.engine.connect() as conn:
                    geom_4326 = conn.execute(ST_Transform(geometry, 4326)).scalar()
                polygon = shape.to_shape(geom_4326)
        except Exception as e:
            current_app.logger.error(f"InvalidData- error making polygon: {e}")
            raise ProjectSearchServiceError(f"InvalidData- error making polygon: {e}")
        return polygon

    @staticmethod
    def _get_area_sqm(polygon: Polygon) -> float:
        """get the area of the polygon in square metres"""
        with db.engine.connect() as conn:
            return conn.execute(
                ST_Area(ST_Transform(shape.from_shape(polygon, 4326), 3857))
            ).scalar()

    @staticmethod
    def validate_bbox_area(polygon: Polygon) -> bool:
        """check polygon does not exceed maximim allowed area"""
        area = ProjectSearchService._get_area_sqm(polygon)
        return area <= MAX_AREA
