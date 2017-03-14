import datetime
import json
from flask import current_app
from geoalchemy2 import Geometry
from geoalchemy2.functions import GenericFunction


class InvalidGeoJson(Exception):
    """ Custom exception to notify caller they have supplied Invalid GeoJson """
    def __init__(self, message):
        if current_app:
            current_app.logger.error(message)


class InvalidData(Exception):
    """ Custom exception to notify caller they have supplied Invalid data to a model """
    def __init__(self, message):
        if current_app:
            current_app.logger.error(message)


class ST_SetSRID(GenericFunction):
    """ Exposes PostGIS ST_SetSRID function """
    name = 'ST_SetSRID'
    type = Geometry


class ST_GeomFromGeoJSON(GenericFunction):
    """ Exposes PostGIS ST_GeomFromGeoJSON function """
    name = 'ST_GeomFromGeoJSON'
    type = Geometry


def timestamp():
    """ Used in SQL Alchemy models to ensure we refresh timestamp when new models initialised"""
    return datetime.datetime.utcnow()


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
