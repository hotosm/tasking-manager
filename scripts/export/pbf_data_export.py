# requirements:
# duckdb>=1.1.0
# boto3
# requests
"""
Windmill single-script OSM exporter.
=====================================

Drop this file into a Windmill Python script. Windmill calls main(...), auto-builds
a form from its typed args, and runs it in an ephemeral worker.

What one run does:
  1. Fetch project boundaries from the TM active-projects API or a static GeoJSON.
  2. Download the .osm.pbf from S3.
  3. Build OSM geometry once in an in-memory DuckDB.
  4. For each project: clip to boundary, apply tag filters, write GeoJSON/SHP/KML, zip.
  5. Upload every zip to S3 (or write locally if output_local_dir is set).

Parameters
----------
pbf_bucket : str
    S3 bucket that holds the PBF exports.
pbf_date : str
    Date of the PBF to use, formatted as YYYY-MM-DD. Leave blank to use
    today minus pbf_date_offset_days.
pbf_date_offset_days : int
    Number of days to subtract from today when pbf_date is blank. Default 1
    (yesterday) avoids 404s when the scheduler fires before today's PBF is ready.
pbf_filename : str
    Filename of the PBF inside the dated S3 prefix
    (e.g. exports/<date>/<pbf_filename>).
boundary_source : str
    "tm_api" to fetch project boundaries from the TM active-projects API, or
    "static" to use the GeoJSON passed in static_boundary.
tm_api_base_url : str
    Base URL of the Tasking Manager API (e.g. https://your-tm/api/v2).
    Only used when boundary_source="tm_api".
active_interval : int
    Hours window passed to the TM active-projects API (?interval=).
sandbox : bool
    Passed as ?sandbox= to the TM active-projects API. True returns only sandbox
    projects; False returns all active projects.
static_boundary : dict | None
    GeoJSON FeatureCollection (or single Feature) to use as project boundaries
    when boundary_source="static". Each feature must have project_id in properties.
engine : str
    "pure" uses DuckDB ST_ReadOSM only (default, no extra deps).
    "quackosm" uses QuackOSM for better relation support (requires quackosm package).
output_bucket : str
    S3 bucket to upload output zips to. Ignored when output_local_dir is set.
sandbox_prefix : str
    Top-level S3 prefix for all output keys (e.g. "sandbox").
output_local_dir : str
    If set, write output zips to this local directory instead of S3. Useful for
    testing. The PBF is still downloaded from S3.
aws : dict | None
    AWS credentials: {region_name, aws_access_key_id, aws_secret_access_key,
    aws_session_token, endpoint_url}. Leave None to use the worker's IAM role
    or environment credentials.
config : dict | None
    TM-format export config dict (dataset + categories). Leave None to use the
    default config (Buildings, Roads, Waterways, Landuse, Seamarks).
duckdb_memory_limit : str
    Memory limit passed to DuckDB (e.g. "4GB"). Increase for large PBFs.
"""
from __future__ import annotations

import json
import logging
import os
import re
import shutil
import tempfile
import zipfile
from typing import Optional

import duckdb

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")
logger = logging.getLogger("windmill_sandbox_export")

# --------------------------------------------------------------------------- #
# Default TM-format config (the YAML twin of TM-Extractor/config.json, as a dict)
# Pass your own via the `config` arg to override.
# --------------------------------------------------------------------------- #
DEFAULT_CONFIG = {
    "dataset": {
        "dataset_prefix": "hotosm_project_1",  # rewritten per project at runtime
        "dataset_folder": "TM",  # S3 top folder; sandbox_prefix is prepended
        "dataset_title": "Tasking Manager Sandbox Project",
    },
    "categories": [
        {
            "Buildings": {
                "types": ["polygons"],
                "select": [
                    "name",
                    "building",
                    "building:levels",
                    "building:materials",
                    "addr:full",
                    "addr:housenumber",
                    "addr:street",
                    "addr:city",
                    "office",
                    "source",
                ],
                "where": "tags['building'] IS NOT NULL",
                "formats": ["geojson", "shp", "kml"],
            }
        },
        {
            "Roads": {
                "types": ["lines"],
                "select": [
                    "name",
                    "highway",
                    "surface",
                    "smoothness",
                    "width",
                    "lanes",
                    "oneway",
                    "bridge",
                    "layer",
                    "source",
                ],
                "where": "tags['highway'] IS NOT NULL",
                "formats": ["geojson", "shp", "kml"],
            }
        },
        {
            "Waterways": {
                "types": ["lines", "polygons"],
                "select": [
                    "name",
                    "waterway",
                    "covered",
                    "width",
                    "depth",
                    "layer",
                    "blockage",
                    "tunnel",
                    "natural",
                    "water",
                    "source",
                ],
                "where": "tags['waterway'] IS NOT NULL OR tags['water'] IS NOT NULL "
                "OR tags['natural'] IN ('water','wetland','bay')",
                "formats": ["geojson", "shp", "kml"],
            }
        },
        {
            "Landuse": {
                "types": ["points", "polygons"],
                "select": ["name", "amenity", "landuse", "leisure"],
                "where": "tags['landuse'] IS NOT NULL",
                "formats": ["geojson", "shp", "kml"],
            }
        },
        {
            "Seamarks": {
                "types": ["points", "polygons"],
                "select": [
                    "name",
                    "seamark:type",
                    "seamark:name",
                    "seamark:light:character",
                    "seamark:light:colour",
                    "seamark:light:period",
                    "seamark:light:range",
                    "seamark:buoy_lateral:colour",
                    "seamark:beacon_lateral:colour",
                    "source",
                ],
                "where": "tags['seamark:type'] IS NOT NULL",
                "formats": ["geojson", "shp", "kml"],
            }
        },
    ],
}

# suffix -> (GDAL driver, layer_creation_options) — VERBATIM from raw-data-api
# EXPORT_TYPE_MAPPING (src/validation/models.py:488). Empty list => DRIVER only.
FORMAT_DRIVERS = {
    "geojson": ("GeoJSON", []),
    "shp": ("ESRI Shapefile", ["ENCODING=UTF-8,2GB_LIMIT=No,RESIZE=Yes"]),
    "gpkg": ("GPKG", ["SPATIAL_INDEX=No"]),
    "kml": ("KML", []),
    "fgb": ("FlatGeobuf", ["VERIFY_BUFFERS=NO"]),
}
TYPE_TO_TABLE = {
    "points": "osm_points",
    "lines": "osm_lines",
    "polygons": "osm_polygons",
}
_TAG_RE = re.compile(r"tags\['([^']+)'\](?!\[)")


# --------------------------------------------------------------------------- #
# Boundary sources
# --------------------------------------------------------------------------- #
def _features_to_projects(features):
    projects = []
    for feat in features or []:
        props = (feat.get("properties") or {}) if isinstance(feat, dict) else {}
        pid = props.get("project_id")
        geom = feat.get("geometry") if isinstance(feat, dict) else None
        if pid is None or geom is None:
            logger.warning("Skipping feature missing project_id/geometry: %s", props)
            continue
        projects.append({"project_id": int(pid), "geometry": geom})
    return projects


def _fetch_boundaries(
    boundary_source,
    tm_api_base_url,
    active_interval,
    sandbox,
    static_boundary,
    timeout=120,
):
    if boundary_source == "static":
        fc = static_boundary or {}
        feats = (
            fc.get("features", [])
            if fc.get("type") == "FeatureCollection"
            else ([fc] if fc.get("type") == "Feature" else [])
        )
        return _features_to_projects(feats)
    import requests

    url = (
        f"{tm_api_base_url.rstrip('/')}/projects/queries/active/"
        f"?interval={active_interval}&sandbox={str(sandbox).lower()}"
    )
    logger.info("Fetching projects: %s", url)
    resp = requests.get(url, timeout=timeout)
    resp.raise_for_status()
    fc = resp.json()
    feats = fc.get("features", []) if isinstance(fc, dict) else []
    return _features_to_projects(feats)


# --------------------------------------------------------------------------- #
# S3 helpers (boto3). `aws` dict may carry region_name/aws_access_key_id/
# aws_secret_access_key/endpoint_url; otherwise the default chain / instance role.
# --------------------------------------------------------------------------- #
def _s3_client(aws):
    import boto3

    kw = {}
    for k in (
        "region_name",
        "aws_access_key_id",
        "aws_secret_access_key",
        "aws_session_token",
        "endpoint_url",
    ):
        if aws and aws.get(k):
            kw[k] = aws[k]
    return boto3.client("s3", **kw)


def _download_pbf(pbf_source, aws, work_dir):
    if not pbf_source.startswith("s3://"):
        if not os.path.isfile(pbf_source):
            raise FileNotFoundError(f"PBF not found: {pbf_source}")
        return pbf_source
    bucket, _, key = pbf_source[len("s3://") :].partition("/")
    dest = os.path.join(work_dir, os.path.basename(key) or "sandbox.osm.pbf")
    logger.info("Downloading PBF %s -> %s", pbf_source, dest)
    _s3_client(aws).download_file(bucket, key, dest)
    return dest


# --------------------------------------------------------------------------- #
# Extractor
# --------------------------------------------------------------------------- #
class Extractor:
    def __init__(self, pbf_path, work_dir, engine, memory_limit="4GB"):
        self.pbf_path = pbf_path
        self.work_dir = work_dir
        self.engine = engine
        ext_dir = os.path.join(work_dir, ".duckdb_ext")
        os.makedirs(ext_dir, exist_ok=True)
        self.con = duckdb.connect(":memory:")
        for stmt in (
            f"SET home_directory='{work_dir}'",
            f"SET extension_directory='{ext_dir}'",
            "INSTALL spatial",
            "LOAD spatial",
            f"SET memory_limit='{memory_limit}'",
            "SET preserve_insertion_order=false",
            f"SET temp_directory='{os.path.join(work_dir, 'duckdb_temp')}'",
        ):
            self.con.execute(stmt)
        # PROBE map-access semantics: does tags['k'] return a scalar or a list on
        # this duckdb version? -> choose the right accessor so we never truncate.
        t = self.con.execute("SELECT typeof(MAP{'a':'b'}['a'])").fetchone()[0]
        self.map_returns_list = t.upper().endswith("[]")
        logger.info(
            "DuckDB %s | MAP['k'] typeof=%s -> %s access",
            duckdb.__version__,
            t,
            "list" if self.map_returns_list else "scalar",
        )

    # --- accessor helpers adapt to the probed semantics --------------------
    def _val(self, key_sql_token):
        # key_sql_token looks like  tags['building']
        return f"{key_sql_token}[1]" if self.map_returns_list else key_sql_token

    def _normalize_where(self, where):
        if not self.map_returns_list:
            return where  # scalar: TM where works as-written
        return _TAG_RE.sub(r"tags['\1'][1]", where)  # list: tags['k'] -> tags['k'][1]

    def _select_clause(self, select_tags):
        # % formatting (not nested f-strings) for Python 3.10/3.11 compatibility.
        cols = ["osm_id"]
        for tag in select_tags:
            accessor = self._val("tags['%s']" % tag)
            cols.append('%s AS "%s"' % (accessor, tag))
        cols.append("geom")
        return ", ".join(cols)

    # --- build geometry tables (engine-specific) ---------------------------
    def build(self):
        if self.engine == "quackosm":
            self._build_quackosm()
        else:
            self._build_pure()
        for tbl in ("osm_points", "osm_lines", "osm_polygons"):
            c = self.con.execute(f"SELECT count(*) FROM {tbl}").fetchone()[0]
            logger.info("Built %s: %d", tbl, c)

    def _build_quackosm(self):
        import quackosm as qosm

        logger.info("QuackOSM: %s -> GeoParquet", self.pbf_path)
        pq = str(
            qosm.convert_pbf_to_parquet(
                self.pbf_path, keep_all_tags=True, explode_tags=False, ignore_cache=True
            )
        )
        pq = pq.replace("'", "''")
        gtype = self.con.execute(
            f"SELECT typeof(geometry) FROM read_parquet('{pq}') LIMIT 1"
        ).fetchone()
        geom_expr = (
            "geometry"
            if (gtype and gtype[0].upper().startswith("GEOMETRY"))
            else "ST_GeomFromWKB(geometry)"
        )
        self.con.execute(
            f"""
            CREATE OR REPLACE TABLE features AS
            SELECT TRY_CAST(regexp_extract(feature_id,'[0-9]+$') AS BIGINT) AS osm_id,
                   tags, {geom_expr} AS geom
            FROM read_parquet('{pq}')"""
        )
        self.con.execute(
            "CREATE OR REPLACE TABLE osm_points AS SELECT osm_id,tags,geom FROM features WHERE ST_GeometryType(geom)='POINT'"
        )
        self.con.execute(
            "CREATE OR REPLACE TABLE osm_lines AS SELECT osm_id,tags,geom FROM features WHERE ST_GeometryType(geom) IN ('LINESTRING','MULTILINESTRING')"
        )
        self.con.execute(
            "CREATE OR REPLACE TABLE osm_polygons AS SELECT osm_id,tags,geom FROM features WHERE ST_GeometryType(geom) IN ('POLYGON','MULTIPOLYGON')"
        )

    def _build_pure(self):
        pbf = self.pbf_path.replace("'", "''")
        area_val = self._val("tags['area']")
        self.con.execute(
            f"CREATE OR REPLACE TABLE raw_osm AS SELECT kind,id,tags,refs,lat,lon FROM ST_ReadOSM('{pbf}')"
        )
        self.con.execute(
            """
            CREATE OR REPLACE TABLE node_pts AS
            SELECT id AS node_id, ST_Point(lon,lat) AS geom, tags FROM raw_osm
            WHERE kind='node' AND lon BETWEEN -180 AND 180 AND lat BETWEEN -90 AND 90"""
        )
        self.con.execute(
            """
            CREATE OR REPLACE TABLE osm_points AS
            SELECT node_id AS osm_id, tags, geom FROM node_pts
            WHERE tags IS NOT NULL AND len(map_keys(tags)) > 0"""
        )
        self.con.execute(
            """
            CREATE OR REPLACE TABLE way_nodes AS
            SELECT id AS way_id, tags, UNNEST(refs) AS ref, UNNEST(range(length(refs))) AS ref_idx
            FROM raw_osm WHERE kind='way'"""
        )
        self.con.execute(
            """
            CREATE OR REPLACE TABLE way_geom AS
            SELECT w.way_id, any_value(w.tags) AS tags,
                   ST_MakeLine(list(n.geom ORDER BY w.ref_idx)) AS line_geom,
                   count(*) AS n_pts,
                   arg_min(w.ref,w.ref_idx) AS first_ref, arg_max(w.ref,w.ref_idx) AS last_ref
            FROM way_nodes w JOIN node_pts n ON n.node_id=w.ref
            GROUP BY w.way_id HAVING count(*)>=2"""
        )
        self.con.execute(
            "CREATE OR REPLACE TABLE osm_lines AS SELECT way_id AS osm_id, tags, line_geom AS geom FROM way_geom"
        )
        self.con.execute(
            f"""
            CREATE OR REPLACE TABLE osm_polygons AS
            SELECT way_id AS osm_id, tags, ST_MakeValid(ST_MakePolygon(line_geom)) AS geom
            FROM way_geom
            WHERE n_pts>=4 AND first_ref=last_ref AND ST_IsClosed(line_geom)
              AND COALESCE({area_val},'') <> 'no'"""
        )

    # --- per project export ------------------------------------------------
    def export_project(self, project_id, boundary_geojson, dataset, categories):
        prefix = f"hotosm_project_{project_id}"
        folder = dataset["dataset_folder"]
        out = []
        for cat in categories:
            ((cname, body),) = cat.items()
            for ftype in body["types"]:
                table = TYPE_TO_TABLE[ftype]
                sel = self._select_clause(body["select"])
                where = self._normalize_where(body["where"])
                bnd = boundary_geojson.replace("'", "''")
                self.con.execute(
                    f"""
                    CREATE OR REPLACE TABLE _cat AS
                    SELECT {sel} FROM {table}
                    WHERE ({where}) AND ST_Intersects(geom, ST_GeomFromGeoJSON('{bnd}'))"""
                )
                n = self.con.execute("SELECT count(*) FROM _cat").fetchone()[0]
                if n == 0:
                    continue
                for fmt in body["formats"]:
                    driver, lco = FORMAT_DRIVERS[fmt]
                    tail = ""
                    if lco:
                        lco_str = " ".join("'%s'" % o for o in lco)
                        tail = ", SRS 'EPSG:4326', LAYER_CREATION_OPTIONS %s" % lco_str
                    base = f"{prefix}_{cname}_{ftype}_{fmt}"
                    rel_dir = os.path.join(folder, prefix, cname, ftype)
                    abs_dir = os.path.join(self.work_dir, rel_dir)
                    os.makedirs(abs_dir, exist_ok=True)
                    out_file = os.path.join(abs_dir, f"{base}.{fmt}")
                    try:
                        self.con.execute(
                            f"COPY _cat TO '{out_file}' WITH (FORMAT GDAL, DRIVER '{driver}'{tail})"
                        )
                    except duckdb.Error as exc:
                        logger.error(
                            "[p%s] %s COPY failed (driver missing?): %s",
                            project_id,
                            base,
                            exc,
                        )
                        continue
                    zip_path = os.path.join(abs_dir, f"{base}.zip")
                    with zipfile.ZipFile(zip_path, "w", zipfile.ZIP_DEFLATED) as zf:
                        for fn in sorted(os.listdir(abs_dir)):
                            if not fn.endswith(".zip"):
                                zf.write(os.path.join(abs_dir, fn), arcname=fn)
                    out.append((zip_path, os.path.join(rel_dir, f"{base}.zip")))
                    logger.info("[p%s] %s (%d feats)", project_id, base, n)
        return out

    def close(self):
        try:
            self.con.close()
        finally:
            shutil.rmtree(
                os.path.join(self.work_dir, "duckdb_temp"), ignore_errors=True
            )


# --------------------------------------------------------------------------- #
# Windmill entrypoint
# --------------------------------------------------------------------------- #
def main(
    pbf_bucket: str = "your-pbf-bucket",
    pbf_date: str = "",  # YYYY-MM-DD; defaults to today minus pbf_date_offset_days
    pbf_date_offset_days: int = 1,  # how many days back to look; 1 = yesterday
    pbf_filename: str = "sandbox-export.pbf",
    boundary_source: str = "tm_api",  # "tm_api" | "static"
    tm_api_base_url: str = "https://your-tm-api/api/v2",
    active_interval: int = 24,
    sandbox: bool = True,  # passed as ?sandbox= to the TM active-projects API
    static_boundary: Optional[
        dict
    ] = None,  # GeoJSON FeatureCollection; used when boundary_source="static"
    engine: str = "pure",  # "pure" (duckdb only) | "quackosm" (needs extra deps)
    output_bucket: str = "your-output-bucket",
    sandbox_prefix: str = "sandbox",
    output_local_dir: str = "",  # if set, write locally instead of S3
    aws: Optional[
        dict
    ] = None,  # {region_name, aws_access_key_id, aws_secret_access_key, endpoint_url}
    config: Optional[dict] = None,  # override default TM-format config
    duckdb_memory_limit: str = "4GB",
) -> dict:
    from datetime import date
    from datetime import timedelta

    date_str = (
        pbf_date.strip()
        or (date.today() - timedelta(days=pbf_date_offset_days)).isoformat()
    )
    pbf_source = f"s3://{pbf_bucket}/exports/{date_str}/{pbf_filename}"
    logger.info("PBF source: %s", pbf_source)

    cfg = config or DEFAULT_CONFIG
    dataset = cfg["dataset"]
    categories = cfg["categories"]

    projects = _fetch_boundaries(
        boundary_source, tm_api_base_url, active_interval, sandbox, static_boundary
    )
    if not projects:
        logger.info("No sandbox projects; nothing to do.")
        return {"projects": 0, "published": 0, "failures": 0, "keys": []}

    work_dir = tempfile.mkdtemp(prefix="sbx_")
    use_s3 = not output_local_dir
    s3 = _s3_client(aws)
    bucket_loc = None
    if use_s3:
        try:
            bucket_loc = (
                s3.get_bucket_location(Bucket=output_bucket)["LocationConstraint"]
                or "us-east-1"
            )
        except Exception:  # noqa: BLE001
            bucket_loc = "us-east-1"

    pbf_path = _download_pbf(pbf_source, aws, work_dir)
    ex = Extractor(pbf_path, work_dir, engine, memory_limit=duckdb_memory_limit)

    published, failures, keys = 0, 0, []
    try:
        ex.build()
        for proj in projects:
            try:
                outputs = ex.export_project(
                    proj["project_id"],
                    json.dumps(proj["geometry"]),
                    dataset,
                    categories,
                )
                for local_zip, rel_key in outputs:
                    if use_s3:
                        key = f"{sandbox_prefix}/{rel_key}".replace(os.sep, "/")
                        s3.upload_file(local_zip, output_bucket, key)
                        keys.append(f"s3://{output_bucket}/{key}")
                    else:
                        dest = os.path.join(output_local_dir, rel_key)
                        os.makedirs(os.path.dirname(dest), exist_ok=True)
                        shutil.copy2(local_zip, dest)
                        keys.append(dest)
                    published += 1
            except Exception:  # noqa: BLE001
                failures += 1
                logger.exception("Project %s failed", proj["project_id"])
    finally:
        ex.close()
        shutil.rmtree(work_dir, ignore_errors=True)

    summary = {
        "engine": engine,
        "projects": len(projects),
        "published": published,
        "failures": failures,
        "keys": keys,
    }
    if bucket_loc:
        summary["bucket_location"] = bucket_loc
    logger.info("Done: %s", {k: v for k, v in summary.items() if k != "keys"})
    return summary
