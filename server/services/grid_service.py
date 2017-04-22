import geojson
from shapely.geometry import shape, MultiPolygon, mapping
from server.models.dtos.grid_dto import GridDTO


class GridService:

    @staticmethod
    def trim_grid_to_aoi(grid_dto: GridDTO) -> geojson.FeatureCollection:
        grid = grid_dto.grid
        aoi = grid_dto.area_of_interest
        clip_to_aoi = grid_dto.clip_to_aoi
        aoi_polygon = shape(aoi)
        intersecting_features = []
        for feature in grid['features']:
            tile = shape(feature['geometry'])
            if aoi_polygon.contains(tile):
                intersecting_features.append(feature)
            else:
                intersection = aoi_polygon.intersection(tile)
                if not intersection.is_empty:
                    if clip_to_aoi:
                        if intersection.geom_type == 'Polygon':
                            intersection = MultiPolygon([intersection])
                        print(mapping(intersection))
                        feature['geometry'] = mapping(intersection)
                        feature['properties']['splittable'] = False
                    intersecting_features.append(feature)
        return geojson.FeatureCollection(intersecting_features)


