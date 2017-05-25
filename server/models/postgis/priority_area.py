import geojson
import json
from server import db
from geoalchemy2 import Geometry
from server.models.postgis.utils import InvalidGeoJson, ST_SetSRID, ST_GeomFromGeoJSON

# Priority areas aren't shared, however, this arch was taken from TM2 to ease data migration
project_priority_areas = db.Table(
    'project_priority_areas', db.metadata,
    db.Column('project_id', db.Integer, db.ForeignKey('projects.id')),
    db.Column('priority_area_id', db.Integer, db.ForeignKey('priority_areas.id'))
)


class PriorityArea(db.Model):
    """ Describes an individual priority area """
    __tablename__ = "priority_areas"

    id = db.Column(db.Integer, primary_key=True)
    geometry = db.Column(Geometry('POLYGON', srid=4326))

    @classmethod
    def from_dict(cls, area_poly: dict):
        """ Create a new Priority Area from dictionary """
        pa_geojson = geojson.loads(json.dumps(area_poly))

        if type(pa_geojson) is not geojson.Polygon:
            raise InvalidGeoJson('Priority Areas must be supplied as Polygons')

        is_valid_geojson = geojson.is_valid(pa_geojson)
        if is_valid_geojson['valid'] == 'no':
            raise InvalidGeoJson(f"Priority Area: Invalid Polygon - {is_valid_geojson['message']}")

        pa = cls()
        valid_geojson = geojson.dumps(pa_geojson)
        pa.geometry = ST_SetSRID(ST_GeomFromGeoJSON(valid_geojson), 4326)
        return pa

    def get_as_geojson(self):
        """ Helper to translate geometry back to a GEOJson Poly"""
        pa_geojson = db.engine.execute(self.geometry.ST_AsGeoJSON()).scalar()
        return geojson.loads(pa_geojson)
