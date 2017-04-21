import geojson
from shapely.geometry import shape
from shapely.prepared import prep


class GridService:

    @staticmethod
    def geometries_intersect(tile: shape, aoi: shape) -> bool:
        """
        Takes two shapes and returns True if the intersect, False if not
        :param tile: shapely.geometry.shape
        :param aoi: shapely.geometry.shape
        :return: bool
        """
        p = prep(aoi)
        intersects = p.intersects(tile)
        return intersects

    @staticmethod
    def find_intersecting_tiles_in_grid(grid: geojson.FeatureCollection , aoi: geojson.MultiPolygon ) -> geojson.FeatureCollection:
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
            if(GridService.geometries_intersect(tile, aoi_polygon)):
                intersecting_features.append(feature)
        return geojson.FeatureCollection(intersecting_features)
