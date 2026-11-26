import datetime
import json
from geoalchemy2 import Geometry
from geoalchemy2.functions import GenericFunction
from loguru import logger
import re
from markdown import markdown
from markdown.extensions import Extension
from markdown.preprocessors import Preprocessor
import bleach


class NotFound(Exception):
    """Custom exception to indicate model not found in database"""

    def __init__(self, message):
        logger.debug(message)


class InvalidGeoJson(Exception):
    """Custom exception to notify caller they have supplied Invalid GeoJson"""

    def __init__(self, message):
        logger.debug(message)


class UserLicenseError(Exception):
    """Custom Exception to notify caller that the user attempting to map has not accepted the license"""

    def __init__(self, message):
        logger.debug(message)


class InvalidData(Exception):
    """Custom exception to notify caller they have supplied Invalid data to a model"""

    def __init__(self, message):
        logger.debug(message)


class ST_SetSRID(GenericFunction):
    """Exposes PostGIS ST_SetSRID function"""

    inherit_cache = False
    name = "ST_SetSRID"
    type = Geometry


class ST_GeomFromGeoJSON(GenericFunction):
    """Exposes PostGIS ST_GeomFromGeoJSON function"""

    inherit_cache = False
    name = "ST_GeomFromGeoJSON"
    type = Geometry


class ST_AsGeoJSON(GenericFunction):
    """Exposes PostGIS ST_AsGeoJSON function"""

    inherit_cache = False
    name = "ST_GeomFromGeoJSON"
    type = Geometry


class ST_Centroid(GenericFunction):
    """Exposes PostGIS ST_Centroid function"""

    inherit_cache = False
    name = "ST_Centroid"
    type = Geometry


class ST_Transform(GenericFunction):
    """Exposes PostGIS ST_Transform function"""

    inherit_cache = False
    name = "ST_Transform"
    type = Geometry


class ST_Area(GenericFunction):
    """Exposes PostGIS ST_Area function"""

    inherit_cache = False
    name = "ST_Area"
    type = None


class ST_GeogFromWKB(GenericFunction):
    """Exposes PostGIS ST_GeogFromWKB function"""

    inherit_cache = False
    name = "ST_GeogFromWKB"
    type = None


class ST_Buffer(GenericFunction):
    """Exposes PostGIS ST_Buffer function"""

    inherit_cache = False
    name = "ST_Buffer"
    type = Geometry


class ST_Intersects(GenericFunction):
    """Exposes PostGIS ST_Intersects function"""

    inherit_cache = False
    name = "ST_Intersects"
    type = Geometry


class ST_MakeEnvelope(GenericFunction):
    """Exposes PostGIS ST_MakeEnvelope function"""

    inherit_cache = False
    name = "ST_MakeEnvelope"
    type = Geometry


class ST_X(GenericFunction):
    """Exposes PostGIS ST_X function"""

    inherit_cache = False
    name = "ST_X"
    type = Geometry


class ST_Y(GenericFunction):
    """Exposes PostGIS ST_Y function"""

    inherit_cache = False
    name = "ST_Y"
    type = Geometry


def timestamp():
    """Used in SQL Alchemy models to ensure we refresh timestamp when new models initialised"""
    return datetime.datetime.utcnow()


# Based on https://stackoverflow.com/a/51916936
duration_regex = re.compile(
    r"^((?P<days>[\.\d]+?)d)?((?P<hours>[\.\d]+?)h)?((?P<minutes>[\.\d]+?)m)?((?P<seconds>[\.\d]+?)s)?$"
)


def parse_duration(time_str):
    """
    Parse a duration string e.g. (2h13m) into a timedelta object.

    :param time_str: A string identifying a duration.  (eg. 2h13m)
    :return datetime.timedelta: A datetime.timedelta object
    """
    parts = duration_regex.match(time_str)
    assert parts is not None, "Could not parse duration from '{}'".format(time_str)
    time_params = {
        name: float(param) for name, param in parts.groupdict().items() if param
    }
    return datetime.timedelta(**time_params)


class _SaneHeadingsPreprocessor(Preprocessor):
    """Only treat '#' as a heading marker when a space follows it.

    Python-Markdown follows the original Markdown syntax, where '#word' opens a
    heading. Contributors use '#' for hashtags at the start of a comment
    ("#hotosm-project-1234 ..."), so those lines were rendered as <h1> headings
    in comments and notification messages. CommonMark requires the space after
    the '#'s, and that is what contributors expect from every other editor.

    Lines inside fenced or indented code blocks keep their '#'s. fenced_code is
    enabled wherever this runs and stashes its blocks before this preprocessor,
    so the fence tracking below only matters if that extension is absent;
    an indented line never starts at the beginning of the line either way.
    """

    pattern = re.compile(r"^(#+)(?=[^#\s])")
    fence = re.compile(r"^\s*(```|~~~)")

    def run(self, lines: list) -> list:
        result = []
        in_fence = False
        for line in lines:
            if self.fence.match(line):
                in_fence = not in_fence
            elif not in_fence:
                line = self.pattern.sub(lambda match: "\\" + match.group(1), line)
            result.append(line)
        return result


class SaneHeadingsExtension(Extension):
    """Markdown extension applying _SaneHeadingsPreprocessor."""

    def extendMarkdown(self, md):
        # Runs after fenced_code (25) so fenced code is already stashed.
        md.preprocessors.register(_SaneHeadingsPreprocessor(md), "saneheadings", 20)


def markdown_to_html(text: str) -> str:
    """Convert markdown to HTML for text written by contributors."""
    return markdown(
        text,
        extensions=["markdown.extensions.fenced_code", SaneHeadingsExtension()],
        output_format="html",
    )


def sanitize_markdown(text: str | None) -> str | None:
    """Convert markdown to sanitized HTML. Returns None for empty input."""
    if not text:
        return None

    # Extended allowed tags to support markdown features
    allowed_tags = [
        "a",
        "abbr",
        "acronym",
        "b",
        "blockquote",
        "br",
        "code",
        "em",
        "h1",
        "h2",
        "h3",
        "h4",
        "h5",
        "h6",
        "img",
        "i",
        "li",
        "ol",
        "p",
        "pre",
        "strong",
        "ul",
        "div",
        "table",
        "thead",
        "tbody",
        "tfoot",
        "tr",
        "td",
        "th",
        "iframe",
        "input",
        "hr",
        "del",
        "s",
        "strike",
        "span",
        "caption",
        "col",
        "colgroup",
    ]

    allowed_attributes = {
        "a": ["href", "rel", "target", "title"],
        "img": ["src", "alt", "title", "width", "height"],
        "iframe": [
            "width",
            "height",
            "src",
            "title",
            "frameborder",
            "allow",
            "referrerpolicy",
            "allowfullscreen",
        ],
        "input": ["type", "checked", "disabled"],
        "th": ["align", "scope"],
        "td": ["align", "colspan", "rowspan"],
        "table": ["class"],
        "code": ["class"],
        "pre": ["class"],
    }

    # Support markdown ~~strike~~ -> <del>
    text = re.sub(r"~~(.*?)~~", r"<del>\1</del>", text)

    html_content = markdown(
        text,
        extensions=[
            "markdown.extensions.tables",
            "markdown.extensions.fenced_code",
            "markdown.extensions.nl2br",
            "markdown.extensions.sane_lists",
            "markdown.extensions.codehilite",
            SaneHeadingsExtension(),
        ],
    )

    clean_message = bleach.clean(
        html_content, tags=allowed_tags, attributes=allowed_attributes, strip=False
    )

    # Turn URLs into links and parse emails
    clean_message = bleach.linkify(clean_message, parse_email=True)

    return clean_message


class DateTimeEncoder(json.JSONEncoder):
    """
    Custom JSON Encoder that handles Python date/times
    HT to stackoverflow http://stackoverflow.com/a/12126976/620362
    """

    def default(self, obj):
        if isinstance(obj, datetime.datetime):
            return obj.isoformat()
        elif isinstance(obj, datetime.date):
            return obj.isoformat()
        elif isinstance(obj, datetime.timedelta):
            return (datetime.datetime.min + obj).time().isoformat()
        else:
            return super(DateTimeEncoder, self).default(obj)
