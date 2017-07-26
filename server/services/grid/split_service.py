import geojson
from shapely.geometry import Polygon, MultiPolygon
from server import db
from flask import current_app
from geoalchemy2 import shape
from server.models.dtos.grid_dto import SplitTaskDTO
from server.models.dtos.mapping_dto import TaskDTOs
from server.models.postgis.utils import ST_Transform
from server.models.postgis.task import Task, TaskStatus
from server.models.postgis.project import Project
from server.models.postgis.utils import NotFound


class SplitServiceError(Exception):
    """ Custom Exception to notify callers an error occurred when handling splitting tasks """

    def __init__(self, message):
        if current_app:
            current_app.logger.error(message)


class SplitService:
    @staticmethod
    def _create_split_tasks(x, y, zoom) -> list:
        """
        function for splitting a task square geometry into 4 smaller squares
        :param geom_to_split: {geojson.Feature} the geojson feature to b split
        :return: list of {geojson.Feature}
        """
        try:
            split_geoms = []
            for i in range(0, 2):
                for j in range(0, 2):
                    new_x = x * 2 + i
                    new_y = y * 2 + j
                    new_zoom = zoom + 1
                    new_square = SplitService._create_square(new_x, new_y, new_zoom)
                    feature = geojson.Feature()
                    feature.geometry = new_square
                    feature.properties = {
                        'x': new_x,
                        'y': new_y,
                        'zoom': new_zoom,
                        'splittable': True
                    }
                    split_geoms.append(feature)

            return split_geoms
        except Exception as e:
            raise SplitServiceError(f'unhandled error splitting tile: {str(e)}')

    @staticmethod
    def _create_square(x, y, zoom) -> geojson.MultiPolygon:
        """
        Function for creating a geojson.MultiPolygon square representing a single OSM tile grid square
        :param x: osm tile grid x
        :param y: osm tile grid y
        :param zoom: osm tile grid zoom level
        :return: geojson.MultiPolygon in EPSG:4326
        """
        # Maximum resolution
        MAXRESOLUTION = 156543.0339

        # X/Y axis limit
        max = MAXRESOLUTION * 256 / 2

        # calculate extents
        step = max / (2 ** (zoom - 1))
        xmin = x * step - max
        ymin = y * step - max
        xmax = (x + 1) * step - max
        ymax = (y + 1) * step - max

        # make a shapely multipolygon
        multipolygon = MultiPolygon([Polygon([(xmin, ymin), (xmax, ymin),
                                              (xmax, ymax), (xmin, ymax)])])

        # use the database to transform the geometry from 3857 to 4326
        transformed_geometry = ST_Transform(shape.from_shape(multipolygon, 3857), 4326)

        # use DB to get the geometry as geojson
        return geojson.loads(db.engine.execute(transformed_geometry.ST_AsGeoJSON()).scalar())

    @staticmethod
    def split_task(split_task_dto: SplitTaskDTO) -> TaskDTOs:
        """
        Replaces a task square with 4 smaller tasks at the next OSM tile grid zoom level
        Validates that task is:
         - locked for mapping by current user
         - splittable (splittable property is True)
        :param split_task_dto:
        :return: new tasks in a DTO
        """
        # get the task to be split
        original_task = Task.get(split_task_dto.task_id, split_task_dto.project_id)
        if original_task is None:
            raise NotFound()

        # check it's splittable
        if not original_task.splittable:
            raise SplitServiceError('Task is not splittable')

        # check its locked for mapping by the current user
        if TaskStatus(original_task.task_status) != TaskStatus.LOCKED_FOR_MAPPING:
            raise SplitServiceError('Status must be LOCKED_FOR_MAPPING to split')

        if original_task.locked_by != split_task_dto.user_id:
            raise SplitServiceError('Attempting to split a task owned by another user')

        # create new geometries from the task geometry
        try:
            new_tasks_geojson = SplitService._create_split_tasks(original_task.x, original_task.y, original_task.zoom)
        except Exception as e:
            raise SplitServiceError(f'Error splitting task{str(e)}')

        # create new tasks from the new geojson
        i = Task.get_max_task_id_for_project(split_task_dto.project_id)
        new_tasks_dto = []
        for new_task_geojson in new_tasks_geojson:
            # insert new tasks into database
            i = i + 1
            new_task = Task.from_geojson_feature(i, new_task_geojson)
            new_task.project_id = split_task_dto.project_id
            new_task.task_status = TaskStatus.READY.value
            new_task.create()
            new_tasks_dto.append(new_task.as_dto_with_instructions(split_task_dto.preferred_locale))

        # delete original task from the database
        original_task.delete()

        # update project task counts
        project = Project.get(split_task_dto.project_id)
        project.total_tasks = project.tasks.count()
        # update bad imagery because we may have split a bad imagery tile
        project.tasks_bad_imagery = project.tasks.filter(Task.task_status == TaskStatus.BADIMAGERY.value).count()
        project.save()

        # return the new tasks in a DTO
        task_dtos = TaskDTOs()
        task_dtos.tasks = new_tasks_dto
        return task_dtos
