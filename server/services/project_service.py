import json
import geojson
from server.models.dtos.project_dto import DraftProjectDTO, ProjectDTO
from server.models.postgis.project import AreaOfInterest, Project, InvalidGeoJson, Task, InvalidData


class ProjectService:

    def create_draft_project(self, draft_project_dto: DraftProjectDTO) -> int:
        """
        Validates and then persists draft projects in the DB
        :param draft_project_dto: Draft Project DTO with data from API
        :raises InvalidGeoJson
        :returns ID of new draft project
        """
        try:
            area_of_interest = AreaOfInterest(draft_project_dto.area_of_interest)
        except InvalidGeoJson as e:
            raise e

        try:
            draft_project = Project(draft_project_dto.project_name, area_of_interest)
        except InvalidData as e:
            raise e

        self._attach_tasks_to_project(draft_project, draft_project_dto.tasks)

        draft_project.create()
        return draft_project.id

    def get_project_dto_for_mapper(self, project_id):
        """ Get the project as DTO for mappers """
        return Project.as_dto_for_mapper(project_id)

    def get_project_dto_for_admin(self, project_id):
        """ Get the project as DTO for project managers """
        project = Project.query.get(project_id)
        dto = project.as_dto_for_admin()

    def update_project(self, project_dto: ProjectDTO):
        project = Project.query.get(project_dto.project_id)

        if project is None:
            return None

        # TODO if projectStatus is published validate we have one full set in default locale

        project.update(project_dto)
        return project

    def _attach_tasks_to_project(self, draft_project, tasks_geojson):
        """
        Validates then iterates over the array of tasks and attach them to the draft project
        :param draft_project: Draft project in scope
        :param tasks_geojson: GeoJSON feature collection of mapping tasks
        :raises InvalidGeoJson, InvalidData
        """
        tasks = geojson.loads(json.dumps(tasks_geojson))

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
