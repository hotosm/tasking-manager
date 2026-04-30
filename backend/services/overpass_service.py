import geojson
import httpx
from loguru import logger
from shapely.geometry import shape

from backend.config import settings

OVERPASS_API_URL = "https://overpass-api.de/api/interpreter"


class OverpassServiceError(Exception):
    def __init__(self, message):
        self.message = message
        logger.error(f"OverpassServiceError: {message}")
        super().__init__(message)


class OverpassService:
    @staticmethod
    def _build_query(geometry_geojson: dict, timeout: int = 60) -> str:
        """
        Build an Overpass QL query that fetches all OSM features (nodes, ways,
        relations) within the given polygon boundary.
        """
        geom = shape(geometry_geojson)

        if geom.geom_type == "MultiPolygon":
            polygon = max(geom.geoms, key=lambda g: g.area)
        else:
            polygon = geom

        simplified = polygon.simplify(0.0001, preserve_topology=True)
        coords = list(simplified.exterior.coords)

        poly_str = " ".join(f"{lat} {lon}" for lon, lat in coords)

        query = f"""
[out:json][timeout:{timeout}];
(
  nwr(poly:"{poly_str}");
);
out body;
>;
out skel qt;
"""
        return query

    @staticmethod
    def _overpass_elements_to_geojson(data: dict) -> geojson.FeatureCollection:
        """
        Convert Overpass JSON response to a GeoJSON FeatureCollection.
        Handles nodes, ways, and basic relations.
        """
        elements = data.get("elements", [])

        nodes = {}
        ways = {}
        features = []

        for elem in elements:
            if elem["type"] == "node":
                nodes[elem["id"]] = elem

        for elem in elements:
            if elem["type"] == "way":
                ways[elem["id"]] = elem

        for elem in elements:
            feature = None
            if elem["type"] == "node" and "tags" in elem:
                feature = geojson.Feature(
                    geometry=geojson.Point([elem["lon"], elem["lat"]]),
                    properties={
                        "osm_id": elem["id"],
                        "osm_type": "node",
                        **(elem.get("tags", {})),
                    },
                )
            elif elem["type"] == "way" and "tags" in elem:
                coords = []
                for nd_ref in elem.get("nodes", []):
                    nd = nodes.get(nd_ref)
                    if nd:
                        coords.append([nd["lon"], nd["lat"]])

                if len(coords) < 2:
                    continue

                if len(coords) >= 4 and coords[0] == coords[-1]:
                    feature = geojson.Feature(
                        geometry=geojson.Polygon([coords]),
                        properties={
                            "osm_id": elem["id"],
                            "osm_type": "way",
                            **(elem.get("tags", {})),
                        },
                    )
                else:
                    feature = geojson.Feature(
                        geometry=geojson.LineString(coords),
                        properties={
                            "osm_id": elem["id"],
                            "osm_type": "way",
                            **(elem.get("tags", {})),
                        },
                    )
            elif elem["type"] == "relation" and "tags" in elem:
                feature = geojson.Feature(
                    geometry=None,
                    properties={
                        "osm_id": elem["id"],
                        "osm_type": "relation",
                        **(elem.get("tags", {})),
                    },
                )

            if feature:
                features.append(feature)

        return geojson.FeatureCollection(features)

    @staticmethod
    async def fetch_osm_features_for_boundary(
        geometry_geojson: dict,
        timeout: int = 60,
    ) -> geojson.FeatureCollection:
        """
        Fetch all OSM features within the given boundary polygon from the
        Overpass API and return as a GeoJSON FeatureCollection.

        :param geometry_geojson: A GeoJSON geometry (Polygon or MultiPolygon)
        :param timeout: Overpass query timeout in seconds
        :returns: GeoJSON FeatureCollection of OSM features
        :raises OverpassServiceError: If the Overpass API request fails
        """
        query = OverpassService._build_query(geometry_geojson, timeout=timeout)

        async with httpx.AsyncClient(timeout=timeout + 10) as client:
            response = await client.post(
                OVERPASS_API_URL,
                data={"data": query},
                headers={
                    "Accept": "application/json",
                    "Content-Type": "application/x-www-form-urlencoded",
                    "User-Agent": settings.OSM_USER_AGENT,
                },
            )

        if response.status_code == 429:
            raise OverpassServiceError(
                "Overpass API rate limit exceeded. Please try again later."
            )
        if response.status_code == 504:
            raise OverpassServiceError(
                "Overpass API query timed out. The task boundary may be too large."
            )
        if response.status_code != 200:
            raise OverpassServiceError(
                f"Overpass API returned status {response.status_code}: {response.text[:200]}"
            )

        try:
            data = response.json()
        except Exception:
            raise OverpassServiceError("Failed to parse Overpass API response as JSON.")

        return OverpassService._overpass_elements_to_geojson(data)
