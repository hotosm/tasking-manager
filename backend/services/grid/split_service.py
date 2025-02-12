import geojson
from shapely.geometry import Polygon, MultiPolygon, LineString, shape as shapely_shape
from shapely.ops import split
from backend import db

# from flask import current_app
from geoalchemy2 import shape

from backend.exceptions import NotFound
from backend.models.dtos.grid_dto import SplitTaskDTO
from backend.models.dtos.mapping_dto import TaskDTOs
from backend.models.postgis.utils import ST_Transform, ST_Area, ST_GeogFromWKB
from backend.models.postgis.task import Task, TaskStatus, TaskAction
from backend.models.postgis.project import Project
from backend.models.postgis.utils import InvalidGeoJson


class SplitServiceError(Exception):
    """Custom Exception to notify callers an error occurred when handling splitting tasks"""

    def __init__(self, message):
        if current_app:
            current_app.logger.debug(message)


class SplitService:
    @staticmethod
    def _create_split_tasks(x, y, zoom, task) -> list:
        """
        function for splitting a task square geometry into 4 smaller squares
        :param geom_to_split: {geojson.Feature} the geojson feature to b split
        :return: list of {geojson.Feature}
        """
        # If the task's geometry doesn't correspond to an OSM tile identified by an
        # x, y, zoom then we need to take a different approach to splitting
        if x is None or y is None or zoom is None or not task.is_square:
            return SplitService._create_split_tasks_from_geometry(task)

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
                        "x": new_x,
                        "y": new_y,
                        "zoom": new_zoom,
                        "isSquare": True,
                    }

                    if len(feature.geometry.coordinates) > 0:
                        split_geoms.append(feature)

            return split_geoms
        except Exception as e:
            raise SplitServiceError(f"unhandled error splitting tile: {str(e)}")

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
        multipolygon = MultiPolygon(
            [Polygon([(xmin, ymin), (xmax, ymin), (xmax, ymax), (xmin, ymax)])]
        )

        # use the database to transform the geometry from 3857 to 4326
        transformed_geometry = ST_Transform(shape.from_shape(multipolygon, 3857), 4326)

        # use DB to get the geometry as geojson
        with db.engine.connect() as conn:
            return geojson.loads(
                conn.execute(transformed_geometry.ST_AsGeoJSON()).scalar()
            )

    @staticmethod
    def _create_split_tasks_from_geometry(task) -> list:
        """
        Splits a task into 4 smaller tasks based purely on the task's geometry rather than
        an OSM tile identified by x, y, zoom
        :return: list of {geojson.Feature}
        """
        # Load the task's geometry and calculate its centroid and bbox
        query = session.query(
            Task.id, Task.geometry.ST_AsGeoJSON().label("geometry")
        ).filter(Task.id == task.id, Task.project_id == task.project_id)
        task_geojson = geojson.loads(query[0].geometry)
        geometry = shapely_shape(task_geojson)
        centroid = geometry.centroid
        minx, miny, maxx, maxy = geometry.bounds

        # split geometry in half vertically, then split those halves in half horizontally
        split_geometries = []
        vertical_dividing_line = LineString([(centroid.x, miny), (centroid.x, maxy)])
        horizontal_dividing_line = LineString([(minx, centroid.y), (maxx, centroid.y)])

        vertical_halves = SplitService._as_halves(
            split(geometry, vertical_dividing_line), centroid, "x"
        )
        for half in vertical_halves:
            split_geometries += SplitService._as_halves(
                split(half, horizontal_dividing_line), centroid, "y"
            )

        # convert split geometries into GeoJSON features expected by Task
        split_features = []
        for split_geometry in split_geometries:
            feature = geojson.Feature()
            # Tasks expect multipolygons. Convert and use the database to get as GeoJSON
            multipolygon_geometry = shape.from_shape(split_geometry, 4326)
            with db.engine.connect() as conn:
                feature.geometry = geojson.loads(
                    conn.execute(multipolygon_geometry.ST_AsGeoJSON()).scalar()
                )
            feature.properties["x"] = None
            feature.properties["y"] = None
            feature.properties["zoom"] = None
            feature.properties["isSquare"] = False
            split_features.append(feature)
        return split_features

    @staticmethod
    def _as_halves(geometries, centroid, axis) -> list:
        """
        Divides the given geometries into two groups -- one with geometries less
        than or equal to the centroid position (along the given axis) and one
        with geometries greater than the centroid position -- and returns a tuple
        of two MultiPolygons
        """
        first_half = [
            g
            for g in geometries.geoms
            if getattr(g.centroid, axis) <= getattr(centroid, axis)
        ]
        second_half = [
            g
            for g in geometries.geoms
            if getattr(g.centroid, axis) > getattr(centroid, axis)
        ]
        return (MultiPolygon(first_half), MultiPolygon(second_half))

    @staticmethod
    def split_task(split_task_dto: SplitTaskDTO) -> TaskDTOs:
        """
        Replaces a task square with 4 smaller tasks at the next OSM tile grid zoom level
        Validates that task is:
         - locked for mapping by current user
        :param split_task_dto:
        :return: new tasks in a DTO
        """
        # get the task to be split
        original_task = Task.get(split_task_dto.task_id, split_task_dto.project_id)
        if original_task is None:
            raise NotFound(sub_code="TASK_NOT_FOUND", task_id=split_task_dto.task_id)

        original_geometry = shape.to_shape(original_task.geometry)

        # Fetch the task geometry in meters
        with db.engine.connect() as conn:
            original_task_area_m = conn.execute(
                ST_Area(ST_GeogFromWKB(original_task.geometry))
            ).scalar()

        if (
            original_task.zoom and original_task.zoom >= 18
        ) or original_task_area_m < 25000:
            raise SplitServiceError("SmallToSplit- Task is too small to be split")

        # check its locked for mapping by the current user
        if TaskStatus(original_task.task_status) != TaskStatus.LOCKED_FOR_MAPPING:
            raise SplitServiceError(
                "LockToSplit- Status must be LOCKED_FOR_MAPPING to split"
            )

        if original_task.locked_by != split_task_dto.user_id:
            raise SplitServiceError(
                "SplitOtherUserTask- Attempting to split a task owned by another user"
            )

        # create new geometries from the task geometry
        try:
            new_tasks_geojson = SplitService._create_split_tasks(
                original_task.x, original_task.y, original_task.zoom, original_task
            )
        except Exception as e:
            raise SplitServiceError(f"Error splitting task{str(e)}")

        # create new tasks from the new geojson
        i = Task.get_max_task_id_for_project(split_task_dto.project_id)
        new_tasks = []
        new_tasks_dto = []
        for new_task_geojson in new_tasks_geojson:
            # Sanity check: ensure the new task geometry intersects the original task geometry
            new_geometry = shapely_shape(new_task_geojson.geometry)
            if not new_geometry.intersects(original_geometry):
                raise InvalidGeoJson(
                    "SplitGeoJsonError- New split task does not intersect original task"
                )

            # insert new tasks into database
            i = i + 1
            new_task = Task.from_geojson_feature(i, new_task_geojson)
            new_task.project_id = split_task_dto.project_id
            new_task.task_status = TaskStatus.READY.value
            new_task.create()
            new_task.task_history.extend(original_task.copy_task_history())
            if new_task.task_history:
                new_task.clear_task_lock()  # since we just copied the lock
            new_task.set_task_history(
                TaskAction.STATE_CHANGE, split_task_dto.user_id, None, TaskStatus.SPLIT
            )
            new_task.set_task_history(
                TaskAction.STATE_CHANGE, split_task_dto.user_id, None, TaskStatus.READY
            )
            new_task.task_status = TaskStatus.READY.value
            new_tasks.append(new_task)
            new_task.update()
            new_tasks_dto.append(
                new_task.as_dto_with_instructions(split_task_dto.preferred_locale)
            )

        # delete original task from the database
        try:
            original_task.delete()
        except Exception:
            session.rollback()
            # Ensure the new tasks are cleaned up
            for new_task in new_tasks:
                new_task.delete()
            session.commit()
            raise

        # update project task counts
        project = Project.get(split_task_dto.project_id)
        project.total_tasks = project.tasks.count()
        # update bad imagery because we may have split a bad imagery tile
        project.tasks_bad_imagery = project.tasks.filter(
            Task.task_status == TaskStatus.BADIMAGERY.value
        ).count()
        project.save()

        # return the new tasks in a DTO
        task_dtos = TaskDTOs()
        task_dtos.tasks = new_tasks_dto
        return task_dtos
