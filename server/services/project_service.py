import json
import geojson
from flask import current_app
from server.models.project import AreaOfInterest, Project


class ProjectService:

    def create_draft_project(self, data):

        current_app.logger.debug('Create draft project')

        area_of_interest = AreaOfInterest(data['areaOfInterest'])
        jim = geojson.loads(json.dumps(area_of_interest.geometryGeoJSON))
        geojson.is_valid(jim)

        area_of_interest.geometryGeoJSON = geojson.dumps(jim)

        area_of_interest.set_geometry_from_geojson()

        project = Project(data, area_of_interest=area_of_interest)
        project.save()
