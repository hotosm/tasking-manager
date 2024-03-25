import geojson
import json
from sqlalchemy import Column, Integer, ForeignKey, Table
from geoalchemy2 import Geometry
from backend.models.postgis.utils import InvalidGeoJson, ST_SetSRID, ST_GeomFromGeoJSON
from backend.db.database import Base, session

# Priority areas aren't shared, however, this arch was taken from TM2 to ease data migration
project_priority_areas = Table(
    "project_priority_areas",
    Base.metadata,
    Column("project_id", Integer, ForeignKey("projects.id")),
    Column("priority_area_id", Integer, ForeignKey("priority_areas.id")),
)

class PriorityArea(Base):
    """Describes an individual priority area"""

    __tablename__ = "priority_areas"

    id = Column(Integer, primary_key=True)
    geometry = Column(Geometry("POLYGON", srid=4326))

    @classmethod
    def from_dict(cls, area_poly: dict):
        """Create a new Priority Area from dictionary"""
        pa_geojson = geojson.loads(json.dumps(area_poly))

        if type(pa_geojson) is not geojson.Polygon:
            raise InvalidGeoJson("Priority Areas must be supplied as Polygons")

        if not pa_geojson.is_valid:
            raise InvalidGeoJson(
                "Priority Area: Invalid Polygon - " + ", ".join(pa_geojson.errors())
            )

        pa = cls()
        valid_geojson = geojson.dumps(pa_geojson)
        pa.geometry = ST_SetSRID(ST_GeomFromGeoJSON(valid_geojson), 4326)
        return pa

    def get_as_geojson(self):
        """Helper to translate geometry back to a GEOJson Poly"""
        with db.engine.connect() as conn:
            pa_geojson = conn.execute(self.geometry.ST_AsGeoJSON()).scalar()
        return geojson.loads(pa_geojson)
