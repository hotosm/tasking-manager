import json
import subprocess
import os
import datetime
import requests
from dateutil import parser
from shapely.geometry import shape, mapping
from shapely.ops import transform
import pyproj
from statistics import mean, median
import csv
from functools import partial

import geojson
from flask import current_app

from server.models.dtos.project_dto import DraftProjectDTO, ProjectDTO, ProjectCommentsDTO, ProjectFileDTO
from server.models.postgis.project import Project, Task, ProjectStatus
from server.models.postgis.project_files import ProjectFiles
from server.models.postgis.statuses import TaskCreationMode, UploadPolicy
from server.models.postgis.task import TaskHistory, TaskStatus, TaskAction
from server.models.postgis.utils import NotFound, InvalidData, InvalidGeoJson
from server.services.grid.grid_service import GridService
from server.services.license_service import LicenseService
from server.services.users.user_service import UserService


def duplicateSequences(props1, props2):
            if props1['key'] == props2['key']:
                return True

            if len(props1['coordinateProperties']['cas']) != len(props2['coordinateProperties']['cas']):
                return False

            for i in range(len(props1['coordinateProperties']['cas'])):
                if props1['coordinateProperties']['cas'][i] != props2['coordinateProperties']['cas'][i]:
                    return False

            return True


project = partial(
    pyproj.transform,
    pyproj.Proj(init='epsg:4326'),
    pyproj.Proj(init='epsg:26913'))

reproject = partial(
    pyproj.transform,
    pyproj.Proj(init='epsg:26913'),
    pyproj.Proj(init='epsg:4326'))
class MapillaryService:

    @staticmethod
    def getMapillarySequences(bbox: str, start_date: str, end_date: str):
        # TODO: async calls
        # set up the url for mapillary
        mapillary_api = current_app.config['MAPILLARY_API']

        url = mapillary_api['base'] + 'sequences?bbox=' + bbox + '&start_time=' + start_date + '&end_time=' + end_date + '&usernames=' + mapillary_api['usernames'] + '&client_id=' + mapillary_api['clientId']

        first_page = requests.get(url).json()
        next_url = None
        try:
            next_url = requests.head(url).links["next"]["url"]
        except KeyError:
            pass

        features = first_page['features']

        # We need all mapillary sequences so loop through all pages (may be a butt-ton so we need to async this ASAP)
        while next_url:
            # Add query result to array
            features.extend(requests.get(next_url).json()['features'])
            try:
                # Get the next page if exists or....
                next_url = requests.head(next_url).links["next"]["url"]
            except KeyError:
                # Break the loop
                next_url = None
        print(len(features))

        # Make tasks from 3 sequences
        tasks = []
        graves = []
        # DEBUG for mapillary
        duplicates = []
        for i, feature in enumerate(reversed(features)):
            if feature['properties']['key'] in graves:
                continue
            geom = transform(project, shape(feature['geometry']))
            buffer = None
            try:
                if not geom.is_valid:
                    geom = geom.buffer(0)
                buffer = geom.buffer(40)
            except:
                graves.append(feature['properties']['key'])
                continue
            t1 = parser.parse(feature['properties']['captured_at'])
            task = []
            task.append(feature['properties'])
            for j, otherFeature in enumerate(reversed(features)):
                t2 = parser.parse(otherFeature['properties']['captured_at'])
                diffT = abs((t1 - t2).total_seconds())
                geom2 = transform(project, shape(otherFeature['geometry']))
                if diffT <= 60:
                    if geom2.within(buffer):
                        new = otherFeature['properties']
                        if new not in task:
                            duplicate = False
                            for t in task:
                                if t['captured_at'] == new['captured_at']:
                                    duplicate = duplicateSequences(t, new)
                            if not duplicate:
                                task.append(new)
                            else:
                                duplicates.append({'key1': t['key'], 'key2': new['key']})
                            graves.append(new['key'])
            props = {}
            try:
                a0 = mean(task[0]['coordinateProperties']['cas'])
                a1 = mean(task[1]['coordinateProperties']['cas'])
                a2 = mean(task[2]['coordinateProperties']['cas'])
                a = [a0, a1, a2] 
                front = task[0] if median(a) == a0 else (task[1] if median(a) == a1 else task[2])
                props['front'] = {
                    'key': front['key'],
                    'coordinateProperties': front['coordinateProperties']
                }
                right = task[0] if max(a) == a0 else (task[1] if max(a) == a1 else task[2])
                props['right'] = {
                    'key': right['key'],
                    'coordinateProperties': right['coordinateProperties']
                }
                left = task[0] if min(a) == a0 else (task[1] if min(a) == a1 else task[2])
                props['left'] = {
                    'key': left['key'],
                    'coordinateProperties': left['coordinateProperties']
                }
            except IndexError as e:
                pass

            if len(props) > 0:
                tasks.append(geojson.Feature(geometry=feature['geometry'], properties=props))

        # Just some debug stuff to help Mapillary homies
        with open('./duplicateSequences.csv', mode='w+') as f:
            columns = ['key1', 'key2']
            writer = csv.DictWriter(f, columns)
            writer.writeheader()
            for dup in duplicates:
                writer.writerow(dup)

        return geojson.FeatureCollection(tasks)
        # return tasks
