import geojson
import json
import os
from typing import Tuple
import xml.etree.ElementTree as ET
from server.models.dtos.project_dto import DraftProjectDTO
from server.models.postgis.project import AreaOfInterest, Project
from server.models.postgis.statuses import TaskStatus
from server.models.postgis.task import Task
from server.models.postgis.user import User

TEST_USER_ID = 1234


def get_canned_osm_user_details():
    """ Helper method to find test file, dependent on where tests are being run from """

    location = os.path.join(os.path.dirname(__file__), 'test_files', 'osm_user_details.xml')

    try:
        open(location, 'r')
        return ET.parse(location)
    except FileNotFoundError:
        raise FileNotFoundError('osm_user_details.xml not found')


def get_canned_simplified_osm_user_details():
    """ Helper that reads file and returns it as a string """
    location = os.path.join(os.path.dirname(__file__), 'test_files', 'osm_user_details_simple.xml')

    with open(location, 'r') as osm_file:
        data = osm_file.read().replace('\n', '')

    return data


def create_canned_user() -> User:
    """ Generate a canned user in the DB """
    test_user = User()
    test_user.id = TEST_USER_ID
    test_user.username = 'Thinkwhere TEST'
    test_user.mapping_level = 1
    test_user.create()

    return test_user


def create_canned_project() -> Tuple[Project, User]:
    """ Generates a canned project in the DB to help with integration tests """
    multipoly_geojson = json.loads('{"coordinates": [[[[-4.0237, 56.0904], [-3.9111, 56.1715], [-3.8122, 56.098],'
                                   '[-4.0237, 56.0904]]]], "properties": {"x": 2402, "y": 1736, "zoom": 12},'
                                   '"type": "MultiPolygon"}')

    task_feature = geojson.loads('{"geometry": {"coordinates": [[[[-4.0237, 56.0904], [-3.9111, 56.1715],'
                                 '[-3.8122, 56.098], [-4.0237, 56.0904]]]], "type": "MultiPolygon"},'
                                 '"properties": {"x": 2402, "y": 1736, "zoom": 12}, "type": "Feature"}')

    test_aoi = AreaOfInterest(multipoly_geojson)

    test_user = create_canned_user()

    test_project_dto = DraftProjectDTO()
    test_project_dto.project_name = 'Test'
    test_project_dto.user_id = test_user.id
    test_project = Project()
    test_project.create_draft_project(test_project_dto, test_aoi)
    test_project.total_tasks = 1

    # Setup test task
    test_task = Task.from_geojson_feature(1, task_feature)
    test_task.task_status = TaskStatus.MAPPED.value
    test_task.mapped_by = test_user.id

    test_project.tasks.append(test_task)
    test_project.create()

    return test_project, test_user
