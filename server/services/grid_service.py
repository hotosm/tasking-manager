import geojson
import json
from shapely.geometry import MultiPolygon, mapping
from shapely.ops import cascaded_union
import shapely.geometry
from geoalchemy2 import shape
from server.models.dtos.grid_dto import GridDTO



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
        aoi_multi_polygon_geojson = GridService.convert_feature_collection_to_multi_polygon(aoi, dissolve=True)
        aoi_multi_polygon =  shapely.geometry.shape(aoi_multi_polygon_geojson)
        intersecting_features = []
        for feature in grid['features']:
            # create a shapely shape for the tile
            tile = shapely.geometry.shape(feature['geometry'])
            if aoi_multi_polygon.contains(tile):
                # tile is completely within aoi, use as is
                intersecting_features.append(feature)
            else:
                intersection = aoi_multi_polygon.intersection(tile)
                if intersection.is_empty:
                    continue  # this ignores polygons which are completely outside aoi
                # tile is partially intersecting the aoi
                clipped_feature = GridService._update_feature(clip_to_aoi, feature, intersection)
                intersecting_features.append(clipped_feature)
        return geojson.FeatureCollection(intersecting_features)

    @staticmethod
    def convert_feature_collection_to_multi_polygon(feature_collection: dict, dissolve: bool) -> MultiPolygon:
        parsed_geojson = GridService._parse_geojson(json.dumps(feature_collection))
        multi_polygon = GridService._convert_to_multipolygon(parsed_geojson)
        if dissolve:
            multi_polygon = GridService._dissolve(multi_polygon)
        return  geojson.loads(json.dumps(mapping(multi_polygon)))

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

    @staticmethod
    def _parse_geojson(input):
        collection = geojson.loads(input,
                                   object_hook=geojson.GeoJSON.to_instance)

        if not hasattr(collection, "features") or \
                        len(collection.features) < 1:
            raise ValueError("GeoJSON file doesn't contain any features.")

        shapely_features = list((filter(lambda x: x is not None,
                                        map(GridService._parse_feature, collection.features))))

        return shapely_features

    @staticmethod
    def _parse_feature(feature):
        if isinstance(feature.geometry, (geojson.geometry.Polygon,
                                         geojson.geometry.MultiPolygon)):
            feature.geometry = shapely.geometry.asShape(feature.geometry)
            return feature
        else:
            return None

    @staticmethod
    def _convert_to_multipolygon(features):
        # converts a list of (multi)polygon geometries to one single multipolygon
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

    def _dissolve(geoms):
        geometry = cascaded_union(geoms)
        if geometry.geom_type == 'Polygon':
            # shapely may return a POLYGON rather than a MULTIPOLYGON if there is just one shape
            # force Multipolygon
            geometry = MultiPolygon([geometry])
        return geometry
