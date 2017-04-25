import geojson
from shapely.geometry import MultiPolygon, mapping
import shapely.geometry
from geoalchemy2 import shape
from server.models.dtos.grid_dto import GridDTO
from server import db
from server.models.postgis.utils import ST_Transform

class GridService:
    @staticmethod
    def trim_grid_to_aoi(grid_dto: GridDTO) -> geojson.FeatureCollection:
        """
        Removes grid squares not intersecting with the aoi.  Optionally leaves partialy intersecting task squares
        complete or clips them exactly to the AOI outline
        :param grid_dto: the dto containing
        :return: geojson.FeatureCollection trimmed task grid
        """
        # get items out of the dto
        grid = grid_dto.grid
        aoi = grid_dto.area_of_interest
        clip_to_aoi = grid_dto.clip_to_aoi

        # create a shapely shape from the aoi
        aoi_polygon = shapely.geometry.shape(aoi)
        intersecting_features = []
        for feature in grid['features']:
            # created a shapely shape for the tile
            tile = shapely.geometry.shape(feature['geometry'])
            if aoi_polygon.contains(tile):
                # tile is completely within aoi, use as is
                intersecting_features.append(feature)
            else:
                intersection = aoi_polygon.intersection(tile)
                if not intersection.is_empty:
                    # tile is partailly intersecting the aoi
                    if clip_to_aoi:
                        # replace the feature geometry  with the instersection and mark the spilttable property as false
                        if intersection.geom_type == 'Polygon':
                            # shapely may return a POLYGON rather than a MULTIPOLYGON if there is just one intersection area
                            intersection = MultiPolygon([intersection])
                        feature['geometry'] = mapping(intersection)
                        feature['properties']['splittable'] = False
                    intersecting_features.append(feature)
        return geojson.FeatureCollection(intersecting_features)

