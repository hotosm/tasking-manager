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
            # create a shapely shape for the tile
            tile = shapely.geometry.shape(feature['geometry'])
            if aoi_polygon.contains(tile):
                # tile is completely within aoi, use as is
                intersecting_features.append(feature)
            else:
                intersection = aoi_polygon.intersection(tile)
                if intersection.is_empty:
                    continue  # this ignores polygons which are completely outside aoi
                # tile is partially intersecting the aoi
                clipped_feature = GridService._update_feature(clip_to_aoi, feature, intersection)
                intersecting_features.append(clipped_feature)
        return geojson.FeatureCollection(intersecting_features)

    @staticmethod
    def _update_feature(clip_to_aoi: bool, feature: dict, new_shape):
        """
        Updates the feature with the new shape, and splittable property
        :param clip_to_aoi: value for feature's splittable property
        :param feature: feature to be updated
        :param new_shape: new shape to use for feature
        :return:
        """
        if clip_to_aoi:
            # update the feature with the clipped shape
            if new_shape.geom_type == 'Polygon':
                # shapely may return a POLYGON rather than a MULTIPOLYGON if there is just one intersection area
                new_shape = MultiPolygon([new_shape])
            feature['geometry'] = mapping(new_shape)
            feature['properties']['splittable'] = False
        return feature

