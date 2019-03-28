import json
import datetime
import requests
import asyncio
from contextlib import closing
from concurrent.futures import ThreadPoolExecutor
from dateutil import parser
from shapely.geometry import shape, mapping
from shapely.ops import linemerge
import xml.etree.ElementTree as ET

import geojson
from flask import current_app

from server.models.postgis.utils import NotFound


# Given 2 mapillary sequences WITHIN a buffer of one, check the properties to determine if the
# sequence was uploaded twice to Mapillary
def duplicateSequences(props1, props2):
            # If they're the same sequence -- shouldn't happen but just in case
            if props1['key'] == props2['key']:
                return True

            if props1['coordinateProperties']['cas'] != props2['coordinateProperties']['cas']:
                return False

            return True


def fetch(url, session):
            with closing(session.get(url)) as response:
                return response


async def run(urls, features):
    with ThreadPoolExecutor(max_workers=3) as executor:
        with requests.Session() as session:
            loop = asyncio.get_event_loop()

            tasks = [
                loop.run_in_executor(
                    executor,
                    fetch,
                    *(u, session)
                )
                for u in urls
            ]

            for response in await asyncio.gather(*tasks):
                features.extend(response.json()['features'])
                pass


class MapillaryService:

    @staticmethod
    def getMapillarySequences(bbox: str, start_date: str, end_date: str, usernames_str: str = None):
        # set up the url for mapillary
        MAPILLARY_API = current_app.config['MAPILLARY_API']
        url = MAPILLARY_API['base'] + 'sequences?bbox=' + bbox + '&start_time=' + start_date + '&end_time=' + end_date + '&client_id=' + MAPILLARY_API['clientId']
        if usernames_str is not None:
            url += '&usernames=' + usernames_str

        # Get all the url's so we can query sequences asynchronously (this part might be able to async too)
        urls = [url]
        while (url):
            try:
                url = requests.head(url).links["next"]["url"]
                urls.append(url)
            except KeyError:
                url = None

        features = []

        # make async requests to query sequences
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        future = asyncio.ensure_future(run(urls, features))
        loop.run_until_complete(future)

        if not features:
            raise NotFound()

        # Make tasks from grouped sequences
        tasks = []
        graves = []

        for feature in reversed(features):
            # Iterate through a reversed list so we can remove elements without causing problems
            if feature['properties']['key'] in graves:
                # If the feature was added with the inner loop, we can't remove it because it 
                # would break the outer loop so we'll check if it's "dead"
                features.remove(feature)
                continue

            t1 = parser.parse(feature['properties']['captured_at'])
            task = []
            task.append(feature)

            for otherFeature in [f for f in features if (abs((t1 - parser.parse(f['properties']['captured_at'])).total_seconds()) <= 60)]:
                if otherFeature['properties']['key'] in graves:
                    continue
                new = otherFeature['properties']
                # if not in task:
                duplicate = False
                for t in task:
                    if t['properties']['captured_at'] == new['captured_at']:
                        duplicate = duplicateSequences(t['properties'], new)
                if not duplicate:
                    task.append(otherFeature)
                graves.append(new['key'])
            '''
            If we ever need to determine the front camera, we can implement the following
            '''
            # props = {}
            # if len(task) == 3:
            #     # If there are 3 sequences determine which feature was the front camera
            #     a0 = mean(task[0]['coordinateProperties']['cas'])
            #     a1 = mean(task[1]['coordinateProperties']['cas'])
            #     a2 = mean(task[2]['coordinateProperties']['cas'])
            #     a = [a0, a1, a2]
            #     front = task[0] if median(a) == a0 else (task[1] if median(a) == a1 else task[2])
            #     props['sequence_key'] = front['key']
            # else:
            #     # Otherwise just take the first
            #     props['sequence_key'] = task[0]['key']

            # if props:
            #     tasks.append(geojson.Feature(geometry=feature['geometry'], properties={'mapillary': props}))
            
            geom = linemerge([shape(t['geometry']) for t in task])
            tasks.append(geojson.Feature(geometry=mapping(geom), properties={'mapillary': [t['properties']['key'] for t in task]}))
            features.remove(feature)

        return geojson.FeatureCollection(tasks)

    @staticmethod
    def getSequencesAsGPX(project_id: int, task_ids_str: str):
        MAPILLARY_API = current_app.config['MAPILLARY_API']
        url = MAPILLARY_API['base'] + 'sequences/{}?client_id=' + MAPILLARY_API['clientId']
        headers = {'Accept': 'application/gpx+xml'}

        timestamp = datetime.datetime.utcnow()

        XMLNS_NAMESPACE = 'http://www.topografix.com/GPX/1/1'
        XMLNS = "{%s}" % XMLNS_NAMESPACE
        XSI_NAMESPACE = "http://www.w3.org/2001/XMLSchema-instance"
        XSI = "{%s}" % XSI_NAMESPACE

        root = ET.Element('gpx', attrib=dict(xmlns=XMLNS_NAMESPACE, version='1.1', creator='Kaart Tasking Manager'))
        root.set(XMLNS + 'xsi', XSI_NAMESPACE)
        root.set(XSI + 'schemaLocation', "http://www.topografix.com/GPX/1/1 http://www.topografix.com/GPX/1/1/gpx .xsd")

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
                ET.SubElement(trkseg, 'trkpt', attrib=trkpt.attrib)

        sequences_gpx = ET.tostring(root, encoding='utf8')
        return sequences_gpx
