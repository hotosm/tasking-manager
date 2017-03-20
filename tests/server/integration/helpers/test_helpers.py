import geojson
import json
from server.services.project_service import Project, AreaOfInterest, Task


def create_test_project():
    """ Helper function that creates a valid test project in the db """
    multipoly_geojson = json.loads('{"coordinates": [[[[-4.0237, 56.0904], [-3.9111, 56.1715], [-3.8122, 56.098],'
                                   '[-4.0237, 56.0904]]]], "properties": {"x": 2402, "y": 1736, "zoom": 12},'
                                   '"type": "MultiPolygon"}')

    task_feature = geojson.loads('{"geometry": {"coordinates": [[[[-4.0237, 56.0904], [-3.9111, 56.1715],'
                                 '[-3.8122, 56.098], [-4.0237, 56.0904]]]], "type": "MultiPolygon"},'
                                 '"properties": {"x": 2402, "y": 1736, "zoom": 12}, "type": "Feature"}')

    test_aoi = AreaOfInterest(multipoly_geojson)
    test_project = Project()
    test_project.create_draft_project('Test', test_aoi)
    test_project.tasks.append(Task.from_geojson_feature(1, task_feature))
    test_project.create()

    return test_project
