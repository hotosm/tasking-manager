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
        :returns ID of new draft project
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
        return draft_project.id

    def get_project_by_id(self, project_id):
        """
        Retrieve the specified project from the database
        :param project_id: ID in scope
        :return: project_dto suitable for serialization to JSON
        """
        return Project.as_dto(project_id)

    def _attach_tasks_to_project(self, draft_project, tasks_geojson):
        """
        Validates then iterates over the array of tasks and attach them to the draft project
        :param draft_project: Draft project in scope
        :param tasks_geojson: GeoJSON feature collection of mapping tasks
        :raises InvalidGeoJson, InvalidData
        """
        tasks = geojson.loads(tasks_geojson)

        if type(tasks) is not geojson.FeatureCollection:
            raise InvalidGeoJson('Tasks: Invalid GeoJson must be FeatureCollection')

        is_valid_geojson = geojson.is_valid(tasks)
        if is_valid_geojson['valid'] == 'no':
            raise InvalidGeoJson(f"Tasks: Invalid FeatureCollection - {is_valid_geojson['message']}")

        task_id = 1
        for feature in tasks['features']:
            try:
                task = Task.from_geojson_feature(task_id, feature)
            except (InvalidData, InvalidGeoJson) as e:
                raise e

            draft_project.tasks.append(task)
            task_id += 1
