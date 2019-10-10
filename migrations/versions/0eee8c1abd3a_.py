"""empty message

Revision ID: 0eee8c1abd3a
Revises: fcd9cebaa79c
Create Date: 2019-05-24 23:05:45.512395

"""
from alembic import op
from sqlalchemy.dialects.postgresql import ARRAY
import sqlalchemy as sa
import json
from shapely.geometry import shape
import shapely.wkt
import sys


# revision identifiers, used by Alembic.
revision = "0eee8c1abd3a"
down_revision = "7435b0a865e6"
branch_labels = None
depends_on = None


def upgrade():
    conn = op.get_bind()
    print("Populating country information for Projects....")

    op.add_column("projects", sa.Column("country", ARRAY(sa.String()), nullable=True))

    fetch_all_project_geoms = (
        "SELECT id, ST_AsText(ST_GeomFromWKB(ST_AsEWKB(centroid))) from projects;"
    )
    projects = conn.execute(fetch_all_project_geoms)
    total_projects = projects.rowcount
    print("Total projects in the DB: " + str(total_projects))
    project_continent = ""
    continents = ""
    count = 0
    match = 0

    with open("scripts/world/continents.json") as continents_data:
        continents = json.load(continents_data)

    for project in projects:
        count = count + 1
        project_id = project[0]
        project_centroid = shapely.wkt.loads(project[1])

        if not project_centroid.is_valid:
            project_centroid = project_centroid.buffer(0)

        for continent in continents["features"]:
            continent_polygon = shape(continent["geometry"])
            is_match = project_centroid.within(continent_polygon)
            if is_match:
                project_continent = continent["properties"]["CONTINENT"]
                with open(
                    "scripts/world/" + project_continent + ".json",
                    "r",
                    encoding="utf-8" "scripts/world/" + project_continent + ".json",
                ) as countries_data:
                    countries = json.load(countries_data)
                    if not project_centroid.is_valid:
                        project_centroid = project_centroid.buffer(0)

                    for country in countries[project_continent]:
                        country_polygon = shape(country["geometry"])
                        is_match = project_centroid.within(country_polygon)
                        if is_match:
                            match = match + 1
                            update_country_info = (
                                "update projects "
                                + "set country = array_append(country, '"
                                + country["properties"]["NAME"]
                                + "') where id = "
                                + str(project_id)
                            )

                            op.execute(update_country_info)
                            print(
                                str(match)
                                + "/"
                                + str(total_projects)
                                + " projects mapped to countries"
                            )
                            sys.stdout.write("\033[F")
                            break
                    if count == total_projects:
                        print(
                            "Migration Done! "
                            + str(count)
                            + "/"
                            + str(total_projects)
                            + " projects scanned."
                            + "\n"
                            + str(match)
                            + "/"
                            + str(total_projects)
                            + " projects mapped to countries"
                        )

                break


def downgrade():
    op.drop_column("projects", "country")
