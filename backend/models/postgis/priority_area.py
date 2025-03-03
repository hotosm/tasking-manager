import json

import geojson
from databases import Database
from geoalchemy2 import Geometry
from sqlalchemy import Column, ForeignKey, Integer, Table

from backend.db import Base
from backend.models.postgis.utils import InvalidGeoJson

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
    async def from_dict(cls, area_poly: dict, db: Database):
        """Create a new Priority Area from dictionary and insert into the database."""

        # Load GeoJSON from the dictionary
        pa_geojson = geojson.loads(json.dumps(area_poly))

        # Ensure it's a valid Polygon
        if not isinstance(pa_geojson, geojson.Polygon):
            raise InvalidGeoJson("Priority Areas must be supplied as Polygons")

        if not pa_geojson.is_valid:
            raise InvalidGeoJson("Priority Area: Invalid Polygon - " + ", ".join(pa_geojson.errors()))

        # Convert the GeoJSON into WKT format using a raw SQL query
        valid_geojson = geojson.dumps(pa_geojson)
        geo_query = """
        SELECT ST_AsText(
            ST_SetSRID(
                ST_GeomFromGeoJSON(:geojson), 4326
            )
        ) AS geometry_wkt;
        """
        result = await db.fetch_one(query=geo_query, values={"geojson": valid_geojson})
        geometry_wkt = result["geometry_wkt"] if result else None

        if not geometry_wkt:
            raise InvalidGeoJson("Failed to create geometry from the given GeoJSON")

        # Insert the new Priority Area into the database and return the inserted ID
        insert_query = """
        INSERT INTO priority_areas (geometry)
        VALUES (ST_GeomFromText(:geometry, 4326))
        RETURNING id;
        """
        insert_result = await db.fetch_one(query=insert_query, values={"geometry": geometry_wkt})

        if insert_result:
            # Assign the ID and geometry to the PriorityArea object
            pa = cls()
            pa.id = insert_result["id"]
            pa.geometry = geometry_wkt
            return pa
        else:
            raise Exception("Failed to insert Priority Area")
