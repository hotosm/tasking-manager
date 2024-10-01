import geojson
from databases import Database

# from flask import current_app
from geoalchemy2 import shape
from geoalchemy2.elements import WKBElement
from shapely.geometry import LineString, MultiPolygon, Polygon
from shapely.geometry import shape as shapely_shape
from shapely.ops import split

from backend.models.dtos.grid_dto import SplitTaskDTO
from backend.models.dtos.mapping_dto import TaskDTOs
from backend.models.postgis.task import Task, TaskAction, TaskStatus
from backend.models.postgis.utils import InvalidGeoJson


class SplitServiceError(Exception):
    """Custom Exception to notify callers an error occurred when handling splitting tasks"""

    def __init__(self, message):
        if current_app:
            current_app.logger.debug(message)


class SplitService:
    @staticmethod
    async def _create_split_tasks(x, y, zoom, task, db) -> list:
        """
        Refactored function for splitting a task square geometry into 4 smaller squares using asyncpg and encode databases.
        """
        if x is None or y is None or zoom is None or not task.is_square:
            return await SplitService._create_split_tasks_from_geometry(task, db)

        try:
            split_geoms = []
            for i in range(0, 2):
                for j in range(0, 2):
                    new_x = x * 2 + i
                    new_y = y * 2 + j
                    new_zoom = zoom + 1
                    new_square = await SplitService._create_square(
                        new_x, new_y, new_zoom, db
                    )
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
    async def _create_square(x, y, zoom, db) -> geojson.MultiPolygon:
        """
        Refactored function to create a geojson.MultiPolygon square using raw SQL with encode databases.
        """
        MAXRESOLUTION = 156543.0339
        max = MAXRESOLUTION * 256 / 2
        step = max / (2 ** (zoom - 1))

        xmin = x * step - max
        ymin = y * step - max
        xmax = (x + 1) * step - max
        ymax = (y + 1) * step - max

        # Create the MultiPolygon object
        multipolygon = MultiPolygon(
            [Polygon([(xmin, ymin), (xmax, ymin), (xmax, ymax), (xmin, ymax)])]
        )

        # Convert MultiPolygon to WKT
        multipolygon_wkt = multipolygon.wkt

        # Query to transform and get the GeoJSON
        create_square_query = """
            SELECT ST_AsGeoJSON(ST_Transform(ST_SetSRID(ST_Multi(ST_GeomFromText(:multipolygon_geometry)), 3857), 4326)) AS geojson
        """

        # Use the WKT version of the multipolygon in the SQL query
        square_geojson_str = await db.fetch_val(
            create_square_query, values={"multipolygon_geometry": multipolygon_wkt}
        )

        # Convert the result back to GeoJSON and return
        return geojson.loads(square_geojson_str)

    @staticmethod
    async def _create_split_tasks_from_geometry(task, db) -> list:
        """
        Splits a task into 4 smaller tasks based on its geometry (not OSM tile). Uses raw SQL with asyncpg/encode databases.
        """
        task_query = """
            SELECT ST_AsGeoJSON(geometry) AS geometry
            FROM tasks
            WHERE id = :task_id AND project_id = :project_id
        """
        task_geojson_str = await db.fetch_val(
            task_query, values={"task_id": task.id, "project_id": task.project_id}
        )
        task_geojson = geojson.loads(task_geojson_str)
        geometry = shapely_shape(task_geojson)
        centroid = geometry.centroid
        minx, miny, maxx, maxy = geometry.bounds

        # split geometry in half vertically, then horizontally
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
            multipolygon_geometry = shape.from_shape(split_geometry, 4326)
            multipolygon_as_geojson_query = """
                SELECT ST_AsGeoJSON(ST_Transform(ST_SetSRID(ST_Multi(:multipolygon_geometry), 4326), 4326)) AS geojson
            """
            feature_geojson = await db.fetch_val(
                multipolygon_as_geojson_query,
                values={"multipolygon_geometry": multipolygon_geometry},
            )
            feature = geojson.Feature(geometry=geojson.loads(feature_geojson))
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
    async def delete_task_and_related_records(task_id: int, project_id: int, db):
        """
        Deletes a task and all its related records (task_mapping_issues, task_invalidation_history, task_history)
        by task_id and project_id.

        Args:
            task_id (int): The ID of the task.
            project_id (int): The ID of the project.
            db: The database connection object (asyncpg, databases, etc.).
        """
        # Delete related messages
        await db.execute(
            """
            DELETE FROM messages
            WHERE task_id = :task_id AND project_id = :project_id
            """,
            values={"task_id": task_id, "project_id": project_id},
        )

        # Delete related task_mapping_issues records
        await db.execute(
            """
            DELETE FROM task_mapping_issues
            WHERE task_history_id IN (
                SELECT id FROM task_history WHERE task_id = :task_id AND project_id = :project_id
            )
            """,
            values={"task_id": task_id, "project_id": project_id},
        )

        # Delete related task_invalidation_history records
        await db.execute(
            """
            DELETE FROM task_invalidation_history
            WHERE task_id = :task_id AND project_id = :project_id
            """,
            values={"task_id": task_id, "project_id": project_id},
        )

        # Delete related task_history records
        await db.execute(
            """
            DELETE FROM task_history
            WHERE task_id = :task_id AND project_id = :project_id
            """,
            values={"task_id": task_id, "project_id": project_id},
        )

        # Finally, delete the task itself
        await db.execute(
            """
            DELETE FROM tasks WHERE id = :task_id AND project_id = :project_id
            """,
            values={"task_id": task_id, "project_id": project_id},
        )

    @staticmethod
    async def split_task(split_task_dto: SplitTaskDTO, db: Database) -> list:
        original_task = await Task.get(
            split_task_dto.task_id, split_task_dto.project_id, db
        )

        if not original_task:
            raise SplitServiceError("TASK_NOT_FOUND- Task not found")
        original_geometry = shape.to_shape(
            WKBElement(original_task["geometry"], srid=4326)
        )

        query = """
            SELECT ST_Area(ST_GeogFromWKB(geometry))
            FROM tasks
            WHERE id = :task_id AND project_id = :project_id
        """
        original_task_area_m = await db.fetch_val(
            query,
            values={
                "task_id": split_task_dto.task_id,
                "project_id": split_task_dto.project_id,
            },
        )
        if (
            original_task["zoom"] and original_task["zoom"] >= 18
        ) or original_task_area_m < 25000:
            raise SplitServiceError("SmallToSplit- Task is too small to be split")

        if original_task["task_status"] != TaskStatus.LOCKED_FOR_MAPPING.value:
            raise SplitServiceError(
                "LockToSplit- Status must be LOCKED_FOR_MAPPING to split"
            )
        if original_task["locked_by"] != split_task_dto.user_id:
            raise SplitServiceError(
                "SplitOtherUserTask- Attempting to split a task owned by another user"
            )

        # Split the task geometry into smaller tasks
        new_tasks_geojson = await SplitService._create_split_tasks(
            original_task["x"],
            original_task["y"],
            original_task["zoom"],
            original_task,
            db,
        )

        # Fetch the highest task ID for the project
        i = await Task.get_max_task_id_for_project(split_task_dto.project_id, db)
        new_tasks = []
        new_tasks_dto = []

        for new_task_geojson in new_tasks_geojson:
            # Ensure the new task geometry intersects the original geometry
            new_geometry = shapely_shape(new_task_geojson["geometry"])
            if not new_geometry.intersects(original_geometry):
                raise InvalidGeoJson(
                    "SplitGeoJsonError- New split task does not intersect original task"
                )

            # Insert new task into database
            i += 1
            new_task = Task.from_geojson_feature(i, new_task_geojson)
            task_geojson_str = geojson.dumps(new_geometry)
            task_values = {
                "id": new_task.id,
                "project_id": split_task_dto.project_id,
                "x": new_task.x,
                "y": new_task.y,
                "zoom": new_task.zoom,
                "is_square": new_task.is_square,
                "task_status": TaskStatus.READY.value,
                "geojson": task_geojson_str,
            }

            query = """
                INSERT INTO tasks (id, project_id, x, y, zoom, is_square, task_status, geometry)
                VALUES (:id, :project_id, :x, :y, :zoom, :is_square, :task_status, ST_SetSRID(ST_GeomFromGeoJSON(:geojson), 4326))
            """
            await db.execute(query, values=task_values)
            await Task.copy_task_history(
                split_task_dto.task_id, new_task.id, split_task_dto.project_id, db
            )
            await Task.clear_task_lock(new_task.id, new_task.project_id, db)
            await Task.set_task_history(
                task_id=new_task.id,
                project_id=split_task_dto.project_id,
                user_id=split_task_dto.user_id,
                action=TaskAction.STATE_CHANGE,
                db=db,
                new_state=TaskStatus.SPLIT,
            )
            await Task.set_task_history(
                task_id=new_task.id,
                project_id=split_task_dto.project_id,
                user_id=split_task_dto.user_id,
                action=TaskAction.STATE_CHANGE,
                db=db,
                new_state=TaskStatus.READY,
            )
            update_status_query = """
                UPDATE tasks
                SET task_status = :task_status
                WHERE id = :task_id AND project_id = :project_id
            """
            await db.execute(
                update_status_query,
                values={
                    "task_status": TaskStatus.READY.value,
                    "task_id": new_task.id,
                    "project_id": split_task_dto.project_id,
                },
            )
            new_tasks_dto.append(
                await Task.as_dto_with_instructions(
                    new_task.id,
                    split_task_dto.project_id,
                    db,
                    split_task_dto.preferred_locale,
                )
            )

        await SplitService.delete_task_and_related_records(
            split_task_dto.task_id, split_task_dto.project_id, db
        )

        query = """
            UPDATE projects
            SET total_tasks = (
                SELECT COUNT(*)
                FROM tasks
                WHERE project_id = :project_id
            ),
            tasks_bad_imagery = (
                SELECT COUNT(*)
                FROM tasks
                WHERE project_id = :project_id AND task_status = :bad_imagery_status
            )
            WHERE id = :project_id
        """
        await db.execute(
            query,
            values={
                "project_id": split_task_dto.project_id,
                "bad_imagery_status": TaskStatus.BADIMAGERY.value,
            },
        )

        task_dtos = TaskDTOs()
        task_dtos.tasks = new_tasks_dto
        return task_dtos
