import geojson
from shapely.geometry import shape
from shapely.prepared import prep
from server.models.dtos.grid_dto import GridDTO


class GridService:

    @staticmethod
    def trim_grid_to_aoi(grid_dto: GridDTO) -> geojson.FeatureCollection:
        grid = grid_dto.grid
        aoi = grid_dto.area_of_interest
        return GridService._find_intersecting_tiles_in_grid(grid, aoi)

    @staticmethod
    def _intersect(tile: shape, aoi: shape) -> bool:
        """
        Takes two shapes and returns True if the intersect, False if not
        :param tile: shapely.geometry.shape
        :param aoi: shapely.geometry.shape
        :return: bool
        """
        prepared_geometry = prep(aoi)
        intersects = prepared_geometry.intersects(tile)
        return intersects

    @staticmethod
    def _contains(tile: shape, aoi: shape) -> bool:
        """
        Takes two shapes and returns True if the intersect, False if not
        :param tile: shapely.geometry.shape
        :param aoi: shapely.geometry.shape
        :return: bool
        """
        prepared_geometry = prep(aoi)
        contains = prepared_geometry.contains(tile)
        return contains

    @staticmethod
    def _find_intersecting_tiles_in_grid(grid: geojson.FeatureCollection, aoi: geojson.MultiPolygon) -> geojson.FeatureCollection:
        """
        Takes Grid of tiles and an area of interest returns a the tiles that intersect with the aoi
        :param grid: geojson.FeatureCollection grid of tile
        :param aoi: geojson.MultiPolygon area of interest
        :return: geojson.FeatureCollection
        """
        aoi_polygon = shape(aoi)
        intersecting_features = []
        for feature in grid['features']:
            tile = shape(feature['geometry'])
            if(GridService._intersect(tile, aoi_polygon)):
                intersecting_features.append(feature)
        return geojson.FeatureCollection(intersecting_features)
