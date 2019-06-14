from __future__ import print_function

import sys
import argparse
import os

from edits import get_edits, get_task_osm_xml, get_task_url, list_states
from db import get_northstar_db, get_osmtm_db


def print_edits(edits):
    for edit in edits:
        print('{}\t{}\t{}'.format(
            edit['upload_id'], edit['upload_time'].isoformat(), edit['role']))


def write_xmls(upload_ids, cur, folder='.'):
    folder = folder or '.'

    for upload_id in upload_ids:
        cur.execute("""
            SELECT upload_time, permalink, data
            from osm_xml_uploads where upload_id=%s
        """, (upload_id,))
        rows = cur.fetchall()

        (upload_time, permalink, data) = rows[0]
        permalink = permalink.replace('/', '-')

        filename = upload_time.strftime('%Y-%m-%dT%H-%M-%S') + '_' + permalink
        filename = os.path.join(folder, filename)
        print('writing out', filename)
        with open(filename, 'w') as f:
            f.write(data)


def extract_xml_path(args, tmcur):
    """helper to get the xml path from a variety of ways from the args"""
    if args.xml:
        return args.xml

    if not args.task or not args.project:
        raise ValueError('need to supply xml path or task and project id')

    if args.task and args.project:
        return get_task_osm_xml(args.task, args.project, tmcur)


if __name__ == "__main__":
    parser = argparse.ArgumentParser(
        description='Extract xml edits from the xml database'
    )
    parser.add_argument(
        '--list', action='store_true', help='show all edits for a path')
    parser.add_argument(
        '--shortlist', action='store_true', help='show salient edits')
    parser.add_argument('--xml', help='base path of edits')
    parser.add_argument('--task', type=int, help="id of task")
    parser.add_argument('--project', type=int, help="id of project")
    parser.add_argument(
        '--download', action='store_true', help='download all salient edits')
    parser.add_argument(
        '--upload_id', help='download xml of the specific id')
    parser.add_argument(
        '--task-url', action='store_true', help='get the task url')
    parser.add_argument(
        '--states', action='store_true', help='list state changes')
    parser.add_argument(
        '--dir', help='folder to store edits')

    args = parser.parse_args()

    cur = get_northstar_db().cursor()
    tmcur = get_osmtm_db().cursor()

    if not cur:
        sys.exit()

    xml_path = extract_xml_path(args, tmcur)

    if args.states:
        list_states(xml_path, tmcur)
        sys.exit()

    if args.task_url:
        print(get_task_url(xml_path, tmcur))
        sys.exit()

    if args.upload_id:
        write_xmls([args.upload_id], cur)
        sys.exit()

    if args.list:
        edits = get_edits(cur, xml_path)
        print_edits(edits)
        sys.exit()

    if args.shortlist:
        edits = get_edits(cur, xml_path, only_role_changes=True)
        print_edits(edits)
        sys.exit()

    if args.download:
        edits = get_edits(cur, xml_path, only_role_changes=True)
        write_xmls([e['upload_id'] for e in edits], cur, args.dir)
        sys.exit()
