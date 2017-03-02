import geojson
from flask import current_app
from server.models.project import AreaOfInterest, Project, InvalidGeoJson, Task


class ProjectService:

    def create_draft_project(self, data, aoi_geometry_geojson, tasks_geojson):
        """
        Validates and then persists draft projects in the DB
        :param data:
        :param aoi_geometry_geojson: AOI Geometry as a geoJSON string
        :raises InvalidGeoJson
        :return:
        """
        # TODO - prob unpack the data object in the API
        current_app.logger.debug('Create draft project')

        try:
            area_of_interest = AreaOfInterest(aoi_geometry_geojson)
        except InvalidGeoJson as e:
            raise e

        draft_project = Project('Iain Test', area_of_interest)

        tasks = geojson.loads(tasks_geojson)
        # TODO - raise exception
        is_valid_geojson = geojson.is_valid(tasks)

        task_id = 1
        for task in tasks['features']:
            new_task = Task(task_id, task)
            draft_project.tasks.append(new_task)
            task_id += 1

        draft_project.create()
