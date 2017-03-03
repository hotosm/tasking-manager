import geojson
from server.models.project import AreaOfInterest, Project, InvalidGeoJson, Task, InvalidData


class ProjectService:

    def create_draft_project(self, project_name, aoi_geojson, tasks_geojson):
        """
        Validates and then persists draft projects in the DB
        :param project_name: Name the Project Manager has given the project
        :param aoi_geojson: Area Of Interest Geometry as a geoJSON multipolygon
        :param tasks_geojson: All tasks associated with the project as a geoJSON feature collection
        :raises InvalidGeoJson
        """
        try:
            area_of_interest = AreaOfInterest(aoi_geojson)
        except InvalidGeoJson as e:
            raise e

        try:
            draft_project = Project(project_name, area_of_interest)
        except InvalidData as e:
            raise e

        self._attach_tasks_to_project(draft_project, tasks_geojson)

        draft_project.create()

    def _attach_tasks_to_project(self, draft_project, tasks_geojson):
        """

        :param project:
        :param tasks:
        :return:
        """
        tasks = geojson.loads(tasks_geojson)

        if type(tasks) is not geojson.FeatureCollection:
            raise InvalidGeoJson('Tasks: Invalid GeoJson must be FeatureCollection')

        is_valid_geojson = geojson.is_valid(tasks)
        if is_valid_geojson['valid'] == 'no':
            raise InvalidGeoJson(f"Tasks: Invalid FeatureCollection - {is_valid_geojson['message']}")

        task_id = 1
        for task in tasks['features']:
            new_task = Task(task_id, task)
            draft_project.tasks.append(new_task)
            task_id += 1
