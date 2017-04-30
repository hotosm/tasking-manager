import geojson
import json
from shapely.geometry import MultiPolygon, mapping
from shapely.ops import cascaded_union
import shapely.geometry
from geoalchemy2 import shape
from server.models.dtos.grid_dto import GridDTO
from server.models.postgis.utils import InvalidGeoJson


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
        aoi_multi_polygon_geojson = GridService.merge_to_multi_polygon(aoi, dissolve=True)
        aoi_multi_polygon = shapely.geometry.shape(aoi_multi_polygon_geojson)
        intersecting_features = []
        for feature in grid['features']:
            # create a shapely shape for the tile
            tile = shapely.geometry.shape(feature['geometry'])
            if aoi_multi_polygon.contains(tile):
                # tile is completely within aoi, use as is
                intersecting_features.append(feature)
            else:
                intersection = aoi_multi_polygon.intersection(tile)
                if intersection.is_empty or intersection.geom_type not in ['Polygon','MultiPolygon']:
                    continue  # this intersections which are not polygons or which are completely outside aoi
                # tile is partially intersecting the aoi
                clipped_feature = GridService._update_feature(clip_to_aoi, feature, intersection)
                intersecting_features.append(clipped_feature)
        return geojson.FeatureCollection(intersecting_features)

    @staticmethod
    def tasks_from_aoi_features(feature_collection: str) -> geojson.FeatureCollection:
        """
        Creates a geojson feature collection of tasks from an aoi feature collection
        :param feature_collection:
        :return: task features
        """
        parsed_geojson = GridService._to_shapely_geometries(json.dumps(feature_collection))
        tasks = []
        for feature in parsed_geojson:
            if not isinstance(feature.geometry, MultiPolygon):
                feature.geometry = MultiPolygon([feature.geometry])
            # put the geometry back to geojson
            feature.geometry = shapely.geometry.mapping(feature.geometry)

            # set default properties
            # TODO decide on defaults for x, y, zoom
            # TODO add splittable to task table
            feature.properties = {
                'x': -1,
                'y': -1,
                'zoom': -1,
                'splittable': False
            }

            tasks.append(feature)

        return geojson.FeatureCollection(tasks)

    @staticmethod
    def merge_to_multi_polygon(feature_collection: str, dissolve: bool) -> geojson.MultiPolygon:
        """
        Merge all geometries to a single multipolygon
        :param feature_collection: geojson feature collection str containing features
        :param dissolve: flag for wther to to dissolve internal boundaries.
        :return: geojson.MultiPolygon
        """
        parsed_geojson = GridService._to_shapely_geometries(json.dumps(feature_collection))
        multi_polygon = GridService._convert_to_multipolygon(parsed_geojson)
        if dissolve:
            multi_polygon = GridService._dissolve(multi_polygon)
        return geojson.loads(json.dumps(mapping(multi_polygon)))

    @staticmethod
    def _update_feature(clip_to_aoi: bool, feature: dict, new_shape) -> dict:
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

    @staticmethod
    def _to_shapely_geometries(input: str) -> list:
        """
        Parses the input geojson and returns a list of geojson.Feature objects with their geometries adapted to shapely geometries
        :param input: string of geojson
        :return: list of geojson.Feature objects with their geometries adapted to shapely geometries
        """
        collection = geojson.loads(input, object_hook=geojson.GeoJSON.to_instance)

        if not hasattr(collection, "features") or len(collection.features) < 1:
            raise InvalidGeoJson("Geojson does not contain any features")

        shapely_features = list(
            (filter(lambda x: x is not None, map(GridService._adapt_feature_geometry, collection.features))))

        return shapely_features

    @staticmethod
    def _adapt_feature_geometry(feature: geojson.Feature) -> geojson.Feature:
        """
        Adapts the feature geometry to be used as a shapely geometry
        :param feature: geojson.feature to be adapted
        :return: feature with geometry adapted
        """
        if isinstance(feature.geometry, (geojson.geometry.Polygon,
                                         geojson.geometry.MultiPolygon)):
            # adapt the geometry for use as a shapely geometry http://toblerity.org/shapely/manual.html#shapely.geometry.asShape
            feature.geometry = shapely.geometry.asShape(feature.geometry)
            return feature
        else:
            return None

    @staticmethod
    def _convert_to_multipolygon(features: list) -> MultiPolygon:
        """
        converts a list of (multi)polygon geometries to one single multipolygon
        :param features:
        :return:
        """
        rings = []
        for feature in features:
            if isinstance(feature.geometry, MultiPolygon):
                rings = rings + [geom for geom in feature.geometry.geoms]
            else:
                rings = rings + [feature.geometry]

        geometry = MultiPolygon(rings)

        # Downsample 3D -> 2D
        wkt2d = geometry.wkt
        geom2d = shapely.wkt.loads(wkt2d)

        return geom2d

    @staticmethod
    def _dissolve(geoms: MultiPolygon) -> MultiPolygon:
        """
        dissolves a Multipolygons
        :return: Multipolygon
        """
        # http://toblerity.org/shapely/manual.html#shapely.ops.cascaded_union
        geometry = cascaded_union(geoms)
        if geometry.geom_type == 'Polygon':
            # shapely may return a POLYGON rather than a MULTIPOLYGON if there is just one shape
            # force Multipolygon
            geometry = MultiPolygon([geometry])
        return geometry
