"""empty message

Revision ID: 7bbc01082457
Revises: c40e1fdf6b70
Create Date: 2020-01-29 11:19:20.113089

"""
from alembic import op
import sqlalchemy as sa
import sys


# revision identifiers, used by Alembic.
revision = "7bbc01082457"
down_revision = "c40e1fdf6b70"
branch_labels = None
depends_on = None


def upgrade():
    orgs_map = {
        "Médecins Sans Frontières": "MSF",
        "UNHCR": "United Nations",
        "UNICEF": "United Nations",
        "UNOCH": "United Nations",
        "UN Mappers": "United Nations",
        "UN-Habitat": "United Nations",
        "UNDP Tajikistan": "United Nations",
        "kaart": "Kaart",
        "Kaart": "Kaart",
        "#Kaart": "Kaart",
        "#GrabPH": "Grab",
        "#grabph2020": "Grab",
        "#maptimemelbourne": "MapTime",
        "#osmgeoweek": "Missing Maps",
        "Clinton Health Access Initiative (CHAI)": "Clinton Health Access Initiative",
        "KLL": "Kathmandu Living Labs",
        "NASA Disasters Program": "NASA",
        "#PublicLabMongolia": "Public Lab Mongolia",
        "akros": "Akros",
        "#akros": "Akros",
        "#Akros": "Akros",
        "CDEMA": "Caribbean Disaster Emergency Management Agency",
        "INTEGRATION": "INTEGRATION Consulting Group",
        "#PADF": "Pan American Development Foundation",
        "PADF": "Pan American Development Foundation",
        "WFP": "World Food Programme",
        "COOPI -Concern Worldwide": "Concern Worldwide",
        "Liberia Water and Sewer Corporation and OSM": "LISGIS",
        "HOTOSM": "HOT",
        "#HOT": "HOT",
        "#HOT#Jumeme#Missing Maps": "HOT",
        "#HOTOSM #KCCA": "HOT",
        "Humanitarian OpenStreetMap Team Indonesia": "HOT Indonesia",
        "Ramani Huria": "HOT Tanzania",
        "#Data Zetu": "HOT Tanzania",
        "#OMDTZ": "HOT Tanzania",
        "Kampala Capital City Authority": "HOT Uganda",
        "#YouthMappers": "YouthMappers",
        "Kenyatta University  GIS Club": "YouthMappers",
        "UMaT YouthMappers": "YouthMappers",
        "UniqueMappers Network": "YouthMappers",
        "Universidad de Antioquia": "YouthMappers",
        "#UniBonn": "YouthMappers",
        "UniqueMappersTeam": "YouthMappers",
        "Warwick University": "YouthMappers",
        "WarwickUni": "YouthMappers",
        "#WarwickUni": "YouthMappers",
        "Australian Red Cross": "IFRC",
        "Austrian Red Cross": "IFRC",
        "Kenya Red Cross": "IFRC",
        "Nepal Red Cross Society": "IFRC",
        "Cruz Roja Española": "American Red Cross",
        "Red Cross Red Crescent Climate Centre": "American Red Cross",
        "GermanRedCross": "German Red Cross",
        "CrisisMappers JAPAN": "Crisis Mappers Japan",
        "MapLesotho": "Map Lesotho",
        "#MapLesotho": "Map Lesotho",
        "Albanian OpenStreetMap Community": "OSM Albania",
        "Bangladesh Humanitarian OpenStreetMap Operations Team (BHOOT)": "OSM Bangladesh",
        "OSM-BD": "OSM Bangladesh",
        "OSM-BF": "OSM Burkina Faso",
        "OpenBurkina": "OSM Burkina Faso",
        "OpenStreetMap Cameroon": "OSM Cameroon",
        "OpenStreetMapCo": "OSM Colombia",
        "#OpenStreetMapCo": "OSM Colombia",
        "OpenStreetMap Est RDCongo": "OSM RDC",
        "OSM-Est-DRCongo": "OSM RDC",
        "OSM RDC": "OSM RDC",
        "OSM-CD": "OSM Congo",
        "OSM-IN": "OSM India",
        "iLab Liberia and OSM Liberia": "OSM Liberia",
        "#iLabLiberia": "OSM Liberia",
        "iLab_OSM-Liberia": "OSM Liberia",
        "OpenStreetMap Madagascar": "OSM Madagascar",
        "OSM-MX": "OSM Mexico",
        "OSM-PE": "OSM Peru",
        "OSM Perú": "OSM Peru",
        "OSM-PH": "OSM Philippines",
        "MapPH": "OSM Philippines",
        "OSMph": "OSM Philippines",
        "OSM-Somalia": "OSM Somalia",
        "OpenStreetMap South Sudan": "OSM South Sudan",
        "OSM-SE": "OSM Sweden",
        "OSM-UA": "OSM Ukraine",
        "OSM-ZWE": "OSM Zimbabwe",
        "SSSI": "Other",
        "#SSSI": "Other",
        "Ger Community Mapping Center": "Other",
        "Ger Community Mapping Center (GCMC)": "Other",
        "#AfricanDroneForum": "Other",
        "#Bimkom": "Other",
        "#DroneWings": "Other",
        "#KRCS": "Other",
        "#Kurdistan": "Other",
        "#Zesty Buendia": "Other",
        "ACF": "Other",
        "Afgeo": "Other",
        "AIT": "Other",
        "American Space Dushanbe": "Other",
        "ARAP": "Other",
        "CAFDO": "Other",
        "COLA": "Other",
        "Conrad N. Hilton Foundation, CDC, Aquaya, WHO, ICF": "Other",
        "Department of Irrigation and Department of Agrarian of Sri Lanka": "Other",
        "Disaster Management Centre of Sri Lanka": "Other",
        "DMC Vavuniya District": "Other",
        "Eau & vie Côte d'Ivoire": "Other",
        "ERCS": "Other",
        "FANGA": "Other",
        "GAGER 2018": "Other",
        "geoworks": "Other",
        "Global Shapers - Erbil Hub": "Other",
        "GOAL": "Other",
        "KRCS": "Other",
        "Labocart": "Other",
        "Land Use Policy Planning Department": "Other",
        "LEAG": "Other",
        "LSHTM": "Other",
        "#LSHTM": "Other",
        "Maasai Mara Citizen Observatory": "Other",
        "Map KwaZulu Natal": "Other",
        "Mapping My Home": "Other",
        "Medley": "Other",
        "Abalalite": "Other",
        "Mixed Migration Centre": "Other",
        "Sokoto State Emergency Routine Immunization Coordination Center": "Other",
        "Stanford Geospatial Center": "Other",
        "tebetebe": "Other",
        "Arcs (Italian NGO - https://www.arcsculturesolidali.org/it/2019/04/02/una-cartografia- \
        integrata-e-open-source-per-la-gestione-dellacqua-in-camerun/)": "Other",
        "MOHS/cEPI Myanmar": "Other",
        "Num&Lib": "Other",
        "#num&lib": "Other",
        "ONGAWA": "Other",
        "OpenDevEd": "Other",
        "OpenDRI": "Other",
        "OSU": "Other",
        "OTT": "Other",
        "Partners In Health": "Other",
        "PDVFD": "Other",
        "PIVOT": "Other",
        "PRC-VCAD": "Other",
        "Project ENTER": "Other",
        "Satellite Applications Catapult": "Other",
        "Savelugu District Assembly": "Other",
        "SUZA": "Other",
        "University of Portsmouth": "Other",
        "WSP": "Other",
        "Youth Innovation Lab": "Other",
        "#sUASNews": "Other",
        "#mapbeks": "Other",
    }
    org_managers = {}
    orgs_inserted = []
    count = 0
    conn = op.get_bind()
    print("Populating organisation information for Projects....")
    # Select all existing distinct organisation tags from projects table
    org_tags = conn.execute(
        sa.text(
            "select distinct(organisation_tag) from projects where organisation_tag is not null"
        )
    )
    total_orgs = org_tags.rowcount
    print("Total distinct organisations in the DB: " + str(total_orgs))
    for org_tag in org_tags:
        count += 1
        original_org_name = str(org_tag[0])
        if len(original_org_name) > 1:
            mapped_org = ""
            # Check if there is a mapping for the org - O(1) operation
            if original_org_name in orgs_map:
                mapped_org = orgs_map[original_org_name]
            else:
                mapped_org = original_org_name

            quote_index = mapped_org.find("'")
            if quote_index > -1:
                mapped_org = mapped_org[:quote_index] + "'" + mapped_org[quote_index:]

            select_org_id = conn.execute(
                sa.text("select id from organisations where name ='" + mapped_org + "'")
            ).scalar()

            # Create new organisation only if it has not been inserted earlier
            if (
                (not select_org_id)
                and (mapped_org)
                and (mapped_org not in orgs_inserted)
            ):
                conn.execute(
                    sa.text(
                        "insert into organisations (name) values ('" + mapped_org + "')"
                    )
                )
                # Fetch organisation ID after the insert
                select_org_id = conn.execute(
                    sa.text(
                        "select id from organisations where name ='" + mapped_org + "'"
                    )
                ).scalar()

            org_id = str(select_org_id)

            quote_index = original_org_name.find("'")
            if quote_index > -1:
                original_org_name = (
                    original_org_name[:quote_index]
                    + "'"
                    + original_org_name[quote_index:]
                )

            # Update organisation ID
            conn.execute(
                sa.text(
                    "update projects set organisation_id="
                    + org_id
                    + " where organisation_tag='"
                    + original_org_name
                    + "'"
                )
            )

            # Identify projects related to the org name
            fetch_first_author_id = conn.execute(
                sa.text(
                    "select author_id from projects where organisation_tag='"
                    + original_org_name
                    + "' limit 1"
                )
            ).scalar()
            org_manager = str(fetch_first_author_id)

            if mapped_org not in orgs_inserted:
                org_managers[mapped_org] = org_manager
                conn.execute(
                    sa.text(
                        "insert into organisation_managers \
                    (organisation_id,user_id) \
                    values("
                        + org_id
                        + ","
                        + org_manager
                        + ")"
                    )
                )
                print(
                    str(count)
                    + "/"
                    + str(total_orgs)
                    + " organisations mapped to projects"
                )
                sys.stdout.write("\033[F")

            orgs_inserted.append(mapped_org)

    if count == total_orgs:
        op.drop_column("projects", "organisation_tag")
        sys.stdout.write("\n")
        print("Organisation matching done!")


def downgrade():
    conn = op.get_bind()
    op.add_column("projects", sa.Column("organisation_tag", sa.String(), nullable=True))
    # Remove all mappings made
    org_ids = conn.execute(sa.text("select id, name from organisations"))
    for org_id, org_name in org_ids:
        quote_index = org_name.find("'")
        if quote_index > -1:
            org_name = org_name[:quote_index] + "'" + org_name[quote_index:]
        conn.execute(
            sa.text(
                "update projects set organisation_tag='"
                + str(org_name)
                + "' where organisation_id="
                + str(org_id)
            )
        )
    conn.execute(sa.text("delete from project_teams where team_id is not null"))
    conn.execute(sa.text("delete from team_members where team_id is not null"))
    conn.execute(sa.text("delete from teams where organisation_id is not null"))
    conn.execute(
        sa.text("delete from organisation_managers where organisation_id is not null")
    )
    conn.execute(
        sa.text(
            "update projects set organisation_id = null where organisation_id is not null"
        )
    )
    conn.execute(sa.text("delete from organisations where name is not null"))
