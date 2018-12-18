import datetime
import json
import re
from flask import current_app
from geoalchemy2 import Geometry
from geoalchemy2.functions import GenericFunction


class NotFound(Exception):
    """ Custom exception to indicate model not found in database"""
    pass


class InvalidGeoJson(Exception):
    """ Custom exception to notify caller they have supplied Invalid GeoJson """
    def __init__(self, message):
        if current_app:
            current_app.logger.error(message)


class UserLicenseError(Exception):
    """ Custom Exception to notify caller that the user attempting to map has not accepted the license """
    pass


class InvalidData(Exception):
    """ Custom exception to notify caller they have supplied Invalid data to a model """
    def __init__(self, message):
        if current_app:
            current_app.logger.error(message)


class ST_SetSRID(GenericFunction):
    """ Exposes PostGIS ST_SetSRID function """
    name = 'ST_SetSRID'
    type = Geometry


class ST_AsText(GenericFunction):
    """ Exposes PostGIS ST_AsText function """
    name = 'ST_AsText'
    type = Geometry

class ST_Collect(GenericFunction):
    """ Exposes PostGIS ST_Collect function """
    name = 'ST_Collect'
    type = Geometry

class ST_CollectionHomogenize(GenericFunction):
    """ Exposes PostGIS ST_CollectionHomogenize function """
    name = 'ST_CollectionHomogenize'
    type = Geometry

class ST_GeomFromGeoJSON(GenericFunction):
    """ Exposes PostGIS ST_GeomFromGeoJSON function """
    name = 'ST_GeomFromGeoJSON'
    type = Geometry


class ST_AsGeoJSON(GenericFunction):
    """ Exposes PostGIS ST_AsGeoJSON function """
    name = 'ST_GeomFromGeoJSON'
    type = Geometry


class ST_Centroid(GenericFunction):
    """ Exposes PostGIS ST_Centroid function """
    name = 'ST_Centroid'
    type = Geometry


class ST_Transform(GenericFunction):
    """ Exposes PostGIS ST_Transform function """
    name = 'ST_Transform'
    type = Geometry


class ST_Area(GenericFunction):
    """ Exposes PostGIS ST_Area function """
    name = 'ST_Area'
    type = None


class ST_Buffer(GenericFunction):
    """ Exposes PostGIS ST_Buffer function """
    name = 'ST_Buffer'
    type = Geometry


class ST_Intersects(GenericFunction):
    """ Exposes PostGIS ST_Intersects function """
    name = 'ST_Intersects'
    type = Geometry


class ST_MakeEnvelope(GenericFunction):
    """ Exposes PostGIS ST_MakeEnvelope function """
    name = 'ST_MakeEnvelope'
    type = Geometry

class ST_MakeValid(GenericFunction):
    """ Exposes PostGIS ST_MakeValid function """
    name = 'ST_MakeValid'
    type = Geometry


def timestamp():
    """ Used in SQL Alchemy models to ensure we refresh timestamp when new models initialised"""
    return datetime.datetime.utcnow()


# Based on https://stackoverflow.com/a/51916936
duration_regex = re.compile(r'^((?P<days>[\.\d]+?)d)?((?P<hours>[\.\d]+?)h)?((?P<minutes>[\.\d]+?)m)?((?P<seconds>[\.\d]+?)s)?$')
def parse_duration(time_str):
    """
    Parse a duration string e.g. (2h13m) into a timedelta object.

    :param time_str: A string identifying a duration.  (eg. 2h13m)
    :return datetime.timedelta: A datetime.timedelta object
    """
    parts = duration_regex.match(time_str)
    assert parts is not None, "Could not parse duration from '{}'".format(time_str)
    time_params = {name: float(param) for name, param in parts.groupdict().items() if param}
    return datetime.timedelta(**time_params)


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
