""" Ensure Project's country names are in English

Revision ID: 7937dae319b5
Revises: 14842761654b
Create Date: 2020-09-21 17:17:10.542429

"""
from alembic import op
import sqlalchemy as sa
import requests


# revision identifiers, used by Alembic.
revision = "7937dae319b5"
down_revision = "14842761654b"
branch_labels = None
depends_on = None
nominatim_base_url = "https://nominatim.openstreetmap.org"
nominatim_data_format = "&format=jsonv2&accept-language=en&namedetails=1"


def upgrade():
    conn = op.get_bind()
    # fetch existing country names
    fetch_countries = (
        "select distinct(unnest(country)) from projects where country is not null;"
    )
    countries = conn.execute(sa.text(fetch_countries))
    for country in countries:
        country = country[0]
        # search by name
        url = nominatim_base_url + "/search?country=" + country + nominatim_data_format
        country_search = requests.get(url).json()
        if country_search != []:
            updated_country_name = country_search[0].get("namedetails").get("name:en")
            update_project = (
                "update projects set country = '{\""
                + handle_special_chars(updated_country_name)
                + "\"}' where country @> ARRAY['"
                + handle_special_chars(country)
                + "']::varchar[]"
                + ";"
            )
            conn.execute(sa.text(update_project))


def downgrade():
    pass


def handle_special_chars(country_name: str):
    special_char = country_name.find("'")
    if special_char >= 0:
        country_name = country_name[:special_char] + "'" + country_name[special_char:]
    return country_name
