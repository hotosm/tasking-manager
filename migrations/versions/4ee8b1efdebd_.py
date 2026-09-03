"""Normalize existing Project.country values to pg-nearest-city naming

Revision ID: 4ee8b1efdebd
Revises: a1b2c3d4e5f6
Create Date: 2026-07-28 07:34:05.000000

"""

import unicodedata

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision = "4ee8b1efdebd"
down_revision = "a1b2c3d4e5f6"
branch_labels = None
depends_on = None

# `Project.set_country_info` used to reverse-geocode a project's centroid via
# Nominatim, which returns each country's OSM `name:en` tag (e.g. "United
# States of America", "Ivory Coast", "Czechia"). It now resolves via
# pg-nearest-city instead, which ships its own bundled Natural Earth-derived
# country name list - mostly the same, but with a number of differences
# (e.g. "Côte d'Ivoire", "Dem. Rep. Congo", "eSwatini", "Cabo Verde",
# "Faeroe Is.", "Vatican"). Existing projects already have `country` set from
# the old Nominatim names, so without this migration the same real-world
# country ends up stored under two different spellings depending on whether
# the project predates this change - splitting the "Filter by country"
# dropdown (GET /countries/), the project search country filter, and
# per-country stats into duplicate entries for old vs. newly-created
# projects.
#
# This table is a static snapshot of the (alpha-2 -> name) list bundled in
# pg_nearest_city==2.0.0's `data/country.csv.xz`, copied here rather than
# imported from the package so this migration's behaviour is fixed and
# doesn't drift if a future package version changes its dataset.
PG_NEAREST_CITY_NAMES = {
    "AD": "Andorra",
    "AE": "United Arab Emirates",
    "AF": "Afghanistan",
    "AG": "Antigua and Barb.",
    "AI": "Anguilla",
    "AL": "Albania",
    "AM": "Armenia",
    "AO": "Angola",
    "AQ": "Antarctica",
    "AR": "Argentina",
    "AS": "American Samoa",
    "AT": "Austria",
    "AU": "Australia",
    "AW": "Aruba",
    "AX": "Åland",
    "AZ": "Azerbaijan",
    "BA": "Bosnia and Herz.",
    "BB": "Barbados",
    "BD": "Bangladesh",
    "BE": "Belgium",
    "BF": "Burkina Faso",
    "BG": "Bulgaria",
    "BH": "Bahrain",
    "BI": "Burundi",
    "BJ": "Benin",
    "BL": "St-Barthélemy",
    "BM": "Bermuda",
    "BN": "Brunei",
    "BO": "Bolivia",
    "BR": "Brazil",
    "BS": "Bahamas",
    "BT": "Bhutan",
    "BW": "Botswana",
    "BY": "Belarus",
    "BZ": "Belize",
    "CA": "Canada",
    "CD": "Dem. Rep. Congo",
    "CF": "Central African Rep.",
    "CG": "Congo",
    "CH": "Switzerland",
    "CI": "Côte d'Ivoire",
    "CK": "Cook Is.",
    "CL": "Chile",
    "CM": "Cameroon",
    "CN": "China",
    "CO": "Colombia",
    "CR": "Costa Rica",
    "CU": "Cuba",
    "CV": "Cabo Verde",
    "CW": "Curaçao",
    "CY": "Cyprus",
    "CZ": "Czechia",
    "DE": "Germany",
    "DJ": "Djibouti",
    "DK": "Denmark",
    "DM": "Dominica",
    "DO": "Dominican Rep.",
    "DZ": "Algeria",
    "EC": "Ecuador",
    "EE": "Estonia",
    "EG": "Egypt",
    "EH": "W. Sahara",
    "ER": "Eritrea",
    "ES": "Spain",
    "ET": "Ethiopia",
    "FI": "Finland",
    "FJ": "Fiji",
    "FK": "Falkland Is.",
    "FM": "Micronesia",
    "FO": "Faeroe Is.",
    "FR": "France",
    "GA": "Gabon",
    "GB": "United Kingdom",
    "GD": "Grenada",
    "GE": "Georgia",
    "GF": "French Guiana",
    "GG": "Guernsey",
    "GH": "Ghana",
    "GI": "Gibraltar",
    "GL": "Greenland",
    "GM": "Gambia",
    "GN": "Guinea",
    "GP": "Guadeloupe",
    "GQ": "Eq. Guinea",
    "GR": "Greece",
    "GS": "S. Geo. and the Is.",
    "GT": "Guatemala",
    "GU": "Guam",
    "GW": "Guinea-Bissau",
    "GY": "Guyana",
    "HK": "Hong Kong",
    "HM": "Heard I. and McDonald Is.",
    "HN": "Honduras",
    "HR": "Croatia",
    "HT": "Haiti",
    "HU": "Hungary",
    "ID": "Indonesia",
    "IE": "Ireland",
    "IL": "Israel",
    "IM": "Isle of Man",
    "IN": "India",
    "IO": "Br. Indian Ocean Ter.",
    "IQ": "Iraq",
    "IR": "Iran",
    "IS": "Iceland",
    "IT": "Italy",
    "JE": "Jersey",
    "JM": "Jamaica",
    "JO": "Jordan",
    "JP": "Japan",
    "KE": "Kenya",
    "KG": "Kyrgyzstan",
    "KH": "Cambodia",
    "KI": "Kiribati",
    "KM": "Comoros",
    "KN": "St. Kitts and Nevis",
    "KP": "North Korea",
    "KR": "South Korea",
    "KW": "Kuwait",
    "KY": "Cayman Is.",
    "KZ": "Kazakhstan",
    "LA": "Laos",
    "LB": "Lebanon",
    "LC": "Saint Lucia",
    "LI": "Liechtenstein",
    "LK": "Sri Lanka",
    "LR": "Liberia",
    "LS": "Lesotho",
    "LT": "Lithuania",
    "LU": "Luxembourg",
    "LV": "Latvia",
    "LY": "Libya",
    "MA": "Morocco",
    "MC": "Monaco",
    "MD": "Moldova",
    "ME": "Montenegro",
    "MF": "St-Martin",
    "MG": "Madagascar",
    "MH": "Marshall Is.",
    "MK": "North Macedonia",
    "ML": "Mali",
    "MM": "Myanmar",
    "MN": "Mongolia",
    "MO": "Macao",
    "MP": "N. Mariana Is.",
    "MQ": "Martinique",
    "MR": "Mauritania",
    "MS": "Montserrat",
    "MT": "Malta",
    "MU": "Mauritius",
    "MV": "Maldives",
    "MW": "Malawi",
    "MX": "Mexico",
    "MY": "Malaysia",
    "MZ": "Mozambique",
    "NA": "Namibia",
    "NC": "New Caledonia",
    "NE": "Niger",
    "NF": "Norfolk Island",
    "NG": "Nigeria",
    "NI": "Nicaragua",
    "NL": "Netherlands",
    "NO": "Norway",
    "NP": "Nepal",
    "NR": "Nauru",
    "NU": "Niue",
    "NZ": "New Zealand",
    "OM": "Oman",
    "PA": "Panama",
    "PE": "Peru",
    "PF": "Fr. Polynesia",
    "PG": "Papua New Guinea",
    "PH": "Philippines",
    "PK": "Pakistan",
    "PL": "Poland",
    "PM": "St. Pierre and Miquelon",
    "PN": "Pitcairn Is.",
    "PR": "Puerto Rico",
    "PS": "Palestine",
    "PT": "Portugal",
    "PW": "Palau",
    "PY": "Paraguay",
    "QA": "Qatar",
    "RE": "Réunion",
    "RO": "Romania",
    "RS": "Serbia",
    "RU": "Russia",
    "RW": "Rwanda",
    "SA": "Saudi Arabia",
    "SB": "Solomon Is.",
    "SC": "Seychelles",
    "SD": "Sudan",
    "SE": "Sweden",
    "SG": "Singapore",
    "SH": "Saint Helena",
    "SI": "Slovenia",
    "SK": "Slovakia",
    "SL": "Sierra Leone",
    "SM": "San Marino",
    "SN": "Senegal",
    "SO": "Somalia",
    "SR": "Suriname",
    "SS": "S. Sudan",
    "ST": "São Tomé and Principe",
    "SV": "El Salvador",
    "SX": "Sint Maarten",
    "SY": "Syria",
    "SZ": "eSwatini",
    "TC": "Turks and Caicos Is.",
    "TD": "Chad",
    "TF": "Fr. S. Antarctic Lands",
    "TG": "Togo",
    "TH": "Thailand",
    "TJ": "Tajikistan",
    "TL": "Timor-Leste",
    "TM": "Turkmenistan",
    "TN": "Tunisia",
    "TO": "Tonga",
    "TR": "Turkey",
    "TT": "Trinidad and Tobago",
    "TV": "Tuvalu",
    "TW": "Taiwan",
    "TZ": "Tanzania",
    "UA": "Ukraine",
    "UG": "Uganda",
    "UM": "U.S. Minor Outlying Is.",
    "US": "United States of America",
    "UY": "Uruguay",
    "UZ": "Uzbekistan",
    "VA": "Vatican",
    "VC": "St. Vin. and Gren.",
    "VE": "Venezuela",
    "VG": "British Virgin Is.",
    "VI": "U.S. Virgin Is.",
    "VN": "Vietnam",
    "VU": "Vanuatu",
    "WF": "Wallis and Futuna Is.",
    "WS": "Samoa",
    "XK": "Kosovo",
    "YE": "Yemen",
    "YT": "Mayotte",
    "ZA": "South Africa",
    "ZM": "Zambia",
    "ZW": "Zimbabwe",
}

# Historical/alternate English spellings (Nominatim's OSM name:en, older
# pre-rename country names, common alt forms) mapped to the ISO alpha-2
# code, so they can be re-pointed at the pg-nearest-city name above. A
# sample of these was verified live against Nominatim before being added.
# Only entries that can plausibly differ from the pg-nearest-city spelling
# are listed here; any existing value not recognised below is left
# untouched (and reported at the end of the upgrade) rather than guessed at.
ALIASES = {
    "Aland": "AX",
    "Aland Islands": "AX",
    "Antigua and Barbuda": "AG",
    "Bolivia, Plurinational State of": "BO",
    "Bosnia and Herzegovina": "BA",
    "British Indian Ocean Territory": "IO",
    "British Virgin Islands": "VG",
    "Brunei Darussalam": "BN",
    "Burma": "MM",
    "Cape Verde": "CV",
    "Cayman Islands": "KY",
    "Central African Republic": "CF",
    "Congo, Democratic Republic of the": "CD",
    "Congo, Republic of the": "CG",
    "Congo, The Democratic Republic of the": "CD",
    "Congo-Brazzaville": "CG",
    "Congo-Kinshasa": "CD",
    "Cook Islands": "CK",
    "Cote D'Ivoire": "CI",
    "Cote d'Ivoire": "CI",
    "Curacao": "CW",
    "Czech Republic": "CZ",
    "DR Congo": "CD",
    "Democratic People's Republic of Korea": "KP",
    "Democratic Republic of the Congo": "CD",
    "Dominican Republic": "DO",
    "East Timor": "TL",
    "Equatorial Guinea": "GQ",
    "Eswatini": "SZ",
    "Falkland Islands": "FK",
    "Falkland Islands (Malvinas)": "FK",
    "Faroe Islands": "FO",
    "Federated States of Micronesia": "FM",
    "Former Yugoslav Republic of Macedonia": "MK",
    "French Polynesia": "PF",
    "French Southern Territories": "TF",
    "French Southern and Antarctic Lands": "TF",
    "Gambia, The": "GM",
    "Heard Island and McDonald Islands": "HM",
    "Holy See": "VA",
    "Holy See (Vatican City)": "VA",
    "Holy See (Vatican City State)": "VA",
    "Hong Kong S.A.R.": "HK",
    "Hong Kong SAR China": "HK",
    "Iran (Islamic Republic of)": "IR",
    "Ivory Coast": "CI",
    "Korea, Democratic People's Republic of": "KP",
    "Korea, Republic of": "KR",
    "Lao People's Democratic Republic": "LA",
    "Libyan Arab Jamahiriya": "LY",
    "Macao S.A.R.": "MO",
    "Macau": "MO",
    "Macau SAR China": "MO",
    "Macedonia": "MK",
    "Marshall Islands": "MH",
    "Micronesia, Federated States of": "FM",
    "Moldova, Republic of": "MD",
    "North Korea": "KP",
    "Northern Mariana Islands": "MP",
    "Palestinian Territories": "PS",
    "Palestinian Territory": "PS",
    "Pitcairn": "PN",
    "Pitcairn Islands": "PN",
    "Republic of China": "TW",
    "Republic of Korea": "KR",
    "Republic of Moldova": "MD",
    "Republic of North Macedonia": "MK",
    "Republic of the Congo": "CG",
    "Reunion": "RE",
    "Russian Federation": "RU",
    "Saint Barthelemy": "BL",
    "Saint Barthélemy": "BL",
    "Saint Helena, Ascension and Tristan da Cunha": "SH",
    "Saint Kitts and Nevis": "KN",
    "Saint Martin": "MF",
    "Saint Martin (French part)": "MF",
    "Saint Pierre and Miquelon": "PM",
    "Saint Vincent and the Grenadines": "VC",
    "Sao Tome and Principe": "ST",
    "Sint Maarten (Dutch part)": "SX",
    "Solomon Islands": "SB",
    "South Georgia South Sandwich Islands": "GS",
    "South Georgia and South Sandwich Islands": "GS",
    "South Georgia and the South Sandwich Islands": "GS",
    "South Sudan": "SS",
    "St. Barthélemy": "BL",
    "State of Palestine": "PS",
    "Swaziland": "SZ",
    "Syrian Arab Republic": "SY",
    "Taiwan, Province of China": "TW",
    "Tanzania, United Republic of": "TZ",
    "The Gambia": "GM",
    "The former Yugoslav Republic of Macedonia": "MK",
    "Turkiye": "TR",
    "Turks and Caicos Islands": "TC",
    "Türkiye": "TR",
    "U.S.A.": "US",
    "US Virgin Islands": "VI",
    "USA": "US",
    "United Republic of Tanzania": "TZ",
    "United States": "US",
    "United States Minor Outlying Islands": "UM",
    "United States Virgin Islands": "VI",
    "Vatican City": "VA",
    "Venezuela, Bolivarian Republic of": "VE",
    "Viet Nam": "VN",
    "Virgin Islands, U.S.": "VI",
    "Wallis and Futuna": "WF",
    "Wallis and Futuna Islands": "WF",
    "Western Sahara": "EH",
    "Zaire": "CD",
    "Åland Islands": "AX",
}


def _normalize_key(name):
    """Fold whitespace/case and Unicode form so accented names always match,
    regardless of whether the stored value uses precomposed (NFC) or
    decomposed (NFD) accents."""
    return unicodedata.normalize("NFC", name.strip().lower())


def _build_lookup():
    """Map every recognised spelling (normalised) to its alpha-2 code."""
    lookup = {}
    for alpha2, name in PG_NEAREST_CITY_NAMES.items():
        lookup[_normalize_key(name)] = alpha2
    for alias, alpha2 in ALIASES.items():
        lookup[_normalize_key(alias)] = alpha2
    return lookup


def upgrade():
    conn = op.get_bind()
    lookup = _build_lookup()

    existing = conn.execute(
        sa.text(
            "SELECT DISTINCT UNNEST(country) AS country "
            "FROM projects WHERE country IS NOT NULL"
        )
    ).fetchall()

    # Figure out, in Python, which distinct existing values actually need
    # remapping - then apply all of them in a single UPDATE below, instead
    # of one UPDATE per distinct value. `country` has no index, so an
    # UPDATE ... WHERE :old = ANY(country) per distinct name would be a
    # full sequential scan of `projects` for every one of the ~150+ distinct
    # country names on record.
    old_names = []
    new_names = []
    unmapped = []
    for row in existing:
        old_name = row[0]
        if not old_name:
            continue
        alpha2 = lookup.get(_normalize_key(old_name))
        if alpha2 is None:
            unmapped.append(old_name)
            continue
        new_name = PG_NEAREST_CITY_NAMES[alpha2]
        if new_name == old_name:
            continue
        old_names.append(old_name)
        new_names.append(new_name)

    if old_names:
        # Single pass over the table: for each row, unnest its `country`
        # array, look every element up against the (old_names, new_names)
        # mapping - zipped into (old_name, new_name) pairs via a parallel
        # unnest() - and rebuild the array with matches replaced and
        # anything unrecognised left as-is. `country && :old_names` (array
        # overlap) restricts the UPDATE to rows that actually contain one
        # of the old names, so untouched rows are never rewritten.
        conn.execute(
            sa.text(
                """
                UPDATE projects
                SET country = ARRAY(
                    SELECT COALESCE(m.new_name, u.elem)
                    FROM unnest(country) WITH ORDINALITY AS u(elem, ord)
                    LEFT JOIN unnest(:old_names, :new_names)
                        AS m(old_name, new_name)
                        ON u.elem = m.old_name
                    ORDER BY u.ord
                )
                WHERE country && :old_names
                """
            ).bindparams(
                sa.bindparam("old_names", type_=sa.ARRAY(sa.String)),
                sa.bindparam("new_names", type_=sa.ARRAY(sa.String)),
            ),
            {"old_names": old_names, "new_names": new_names},
        )

    print(
        "pg-nearest-city country migration: normalised "
        f"{len(old_names)} country name(s)"
    )
    if unmapped:
        print(
            "pg-nearest-city country migration: left "
            f"{len(unmapped)} unrecognised country value(s) unchanged: "
            f"{sorted(set(unmapped))}"
        )


def downgrade():
    # Renaming isn't reversible without recording the original per-project
    # values, and the Nominatim lookup this replaces is being removed.
    pass
