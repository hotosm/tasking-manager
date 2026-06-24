import pytest
import geojson
from backend.models.postgis.priority_area import PriorityArea
from backend.models.postgis.utils import InvalidGeoJson


@pytest.mark.anyio
class TestPriorityArea:
    @pytest.fixture(autouse=True)
    async def setup_db(self, db_connection_fixture, request):
        request.cls.db = db_connection_fixture

    async def test_from_dict_valid_polygon(self):
        """Test creating a Priority Area from a valid GeoJSON polygon."""
        valid_polygon = {
            "type": "Polygon",
            "coordinates": [
                [
                    [-104.05, 48.99],
                    [-97.22, 48.98],
                    [-96.58, 45.94],
                    [-104.03, 45.94],
                    [-104.05, 48.99]
                ]
            ]
        }
        pa = await PriorityArea.from_dict(valid_polygon, self.db)
        
        assert pa.id is not None
        assert pa.geometry is not None

    async def test_from_dict_invalid_type(self):
        """Test creating a Priority Area from an invalid GeoJSON type (e.g. Point)."""
        invalid_type = {
            "type": "Point",
            "coordinates": [-104.05, 48.99]
        }
        with pytest.raises(InvalidGeoJson, match="Priority Areas must be supplied as Polygons"):
            await PriorityArea.from_dict(invalid_type, self.db)

    async def test_from_dict_invalid_polygon(self):
        """Test creating a Priority Area from an invalid GeoJSON polygon."""
        invalid_polygon = {
            "type": "Polygon",
            "coordinates": [
                [
                    [-104.05, 48.99],
                    [-97.22, 48.98]
                    # Not enough points, not closed
                ]
            ]
        }
        with pytest.raises(InvalidGeoJson, match="Priority Area: Invalid Polygon"):
            await PriorityArea.from_dict(invalid_polygon, self.db)
