from flask import current_app
from server.models.project import AreaOfInterest, Project, InvalidGeoJson


class ProjectService:

    def create_draft_project(self, data, aoi_geometry_geojson):
        """
        Validates and then persists draft projects in the DB
        :param data:
        :param aoi_geometry_geojson: AOI Geometry as a geoJSON string
        :return:
        """
        # TODO - prob unpack the data object in the API
        current_app.logger.debug('Create draft project')

        try:
            area_of_interest = AreaOfInterest(aoi_geometry_geojson)
        except InvalidGeoJson as e:
            raise e

        draft_project = Project(data, area_of_interest=area_of_interest)
        draft_project.create()
