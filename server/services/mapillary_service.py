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
import xml.etree.ElementTree as ET

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
        MAPILLARY_API = current_app.config['MAPILLARY_API']
        url = MAPILLARY_API['base'] + 'sequences?bbox=' + bbox + '&start_time=' + start_date + '&end_time=' + end_date + '&usernames=' + MAPILLARY_API['usernames'] + '&client_id=' + MAPILLARY_API['clientId']

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
                props['sequence_key'] = front['key']
                # props['front'] = {
                #     'key': front['key'],
                #     'coordinateProperties': front['coordinateProperties']
                # }
                # right = task[0] if max(a) == a0 else (task[1] if max(a) == a1 else task[2])
                # props['right'] = {
                #     'key': right['key'],
                #     'coordinateProperties': right['coordinateProperties']
                # }
                # left = task[0] if min(a) == a0 else (task[1] if min(a) == a1 else task[2])
                # props['left'] = {
                #     'key': left['key'],
                #     'coordinateProperties': left['coordinateProperties']
                # }
            except IndexError as e:
                props['sequence_key'] = task[0]['key']

            if len(props) > 0:
                tasks.append(geojson.Feature(geometry=feature['geometry'], properties={'mapillary': props}))

        # Just some debug stuff to help Mapillary homies
        with open('./duplicateSequences.csv', mode='w+') as f:
            columns = ['key1', 'key2']
            writer = csv.DictWriter(f, columns)
            writer.writeheader()
            for dup in duplicates:
                writer.writerow(dup)

        return geojson.FeatureCollection(tasks)
        # return tasks

    @staticmethod
    def getSequencesAsGPX(project_id: int, task_ids_str: str):
        MAPILLARY_API = current_app.config['MAPILLARY_API']
        url = MAPILLARY_API['base'] + 'sequences/{}?client_id=' + MAPILLARY_API['clientId']
        headers = {'Accept': 'application/gpx+xml'}

        timestamp = datetime.datetime.utcnow()

        root = ET.Element('gpx', attrib=dict(xmlns='http://www.topografix.com/GPX/1/1', version='1.1',
                                             creator='Kaart Tasking Manager'))

        # Create GPX Metadata element
        metadata = ET.Element('metadata')
        link = ET.SubElement(metadata, 'link', attrib=dict(href='https://github.com/kaartgroup/tasking-manager'))
        ET.SubElement(link, 'text').text = 'Kaart Tasking Manager'
        ET.SubElement(metadata, 'time').text = timestamp.isoformat()
        root.append(metadata)

        # Create trk element
        trk = ET.Element('trk')
        root.append(trk)
        ET.SubElement(trk, 'name').text = f'Task for project {project_id}. Do not edit outside of this area!'

        # Create trkseg element
        trkseg = ET.Element('trkseg')
        trk.append(trkseg)

        if task_ids_str is not None:
            task_ids = map(int, task_ids_str.split(','))
            tasks = Task.get_tasks(project_id, task_ids)
            if not tasks or tasks.count() == 0:
                raise NotFound()
        else:
            tasks = Task.get_all_tasks(project_id)
            if not tasks or len(tasks) == 0:
                raise NotFound()

        for task in tasks:
            key = json.loads(task.extra_properties)['mapillary']['sequence_key']
            gpx = requests.get(url.format(key), headers=headers).content
            root2 = ET.fromstring(gpx)
            for trkpt in root2.iter('{http://www.topografix.com/GPX/1/1}trkpt'):
                print(trkpt)
                ET.SubElement(trkseg, 'trkpt', attrib=trkpt.attrib)

        sequences_gpx = ET.tostring(root, encoding='utf8')
        return sequences_gpx
