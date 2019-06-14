from __future__ import absolute_import
from __future__ import division
from __future__ import print_function
from __future__ import unicode_literals
import StringIO
import xml.etree.ElementTree as ET
import math
import argparse
import json
import glob
import csv
from collections import defaultdict
import numpy as np

from edits import get_task_osm_xml, get_edits, get_finished_tasks
from db import get_northstar_db, get_osmtm_db

from datetime import date, datetime


def json_serializer(obj):
    """JSON serializer for objects not serializable by default json code"""
    if isinstance(obj, (datetime, date)):
        return obj.isoformat()
    raise TypeError("Type %s not serializable" % type(obj))


def get_interesting_ways(ways):
    # only get highways and the new ones
    wids = []
    for wid, way in ways.iteritems():
        if 'highway' in way['tags'] and wid < 0:
            wids.append(wid)

    return wids


def get_way_descriptor(wid, ways, nodes):
    if wid not in ways:
        return 'does not exist'

    return '{:<6} {:<4.2f} {}'.format(
        wid,
        get_road_len(ways[wid], nodes),
        ways[wid]['tags'].get('highway'))


def dump_ways(ways, nodes):
    out = []
    for wid in ways:
        out.append(get_way_descriptor(wid, ways, nodes))
    return {
        'ways': out
    }


def run_across_edits_db(func, northstar_db, tm_db, task_id, project_id):
    # convert task_id, project_id into edits
    xml_path = get_task_osm_xml(task_id, project_id, tm_db)
    if not xml_path:
        return []

    edits = get_edits(
        northstar_db, xml_path, only_role_changes=True, include_data=True)

    out = []
    for idx, edit in enumerate(edits):
        data = edit.pop('data')
        entry = edit
        entry["idx"] = idx + 1
        nodes, ways = read_xml_tree(StringIO.StringIO(data))
        data = func(ways, nodes)
        entry['data'] = data
        out.append(entry)

    return out


def run_across_edits(func, folder):
    files = sorted(glob.glob('{}/*.xml'.format(folder)))

    out = []
    for idx, file in enumerate(files):
        entry = {
            "idx": idx + 1,
            "path": file
        }
        nodes, ways = read_xml_tree(file)
        data = func(ways, nodes)
        entry['data'] = data
        out.append(entry)

    return out


def run_on_edit(func, folder, index):
    files = sorted(glob.glob('{}/*.xml'.format(folder)))
    filename = files[index]
    nodes, ways = read_xml_tree(filename)
    return func(ways, nodes)


def run_on_latest_tasks(func, fileout, num_days=1):
    northstar_db = get_northstar_db().cursor()
    tm_db = get_osmtm_db().cursor()
    tasks = get_finished_tasks(tm_db, num_days)

    with open(fileout, 'a+') as f:
        csvwriter = csv.writer(f)
        for task in tasks:
            print(
                'computing stats for',
                task['task_id'], task['project_id'], task['done_date'])
            out = run_across_edits_db(
                func, northstar_db, tm_db, task['task_id'], task['project_id'])
            print('calculate stats for {} edits'.format(len(out)))
            out = json.dumps(out, default=json_serializer)
            csvwriter.writerow([task['task_id'], task['project_id'], out])


def run_on_args(args, func):
    """runs process on various combinations of file specifications"""
    if args.fileout:
        run_on_latest_tasks(func, args.fileout, args.num_days or 1)
        return

    if args.osm1:
        nodes, ways = read_xml_tree(args.osm1)
        out = func(ways, nodes)
    if args.dir:
        if args.idx is not None:
            out = run_on_edit(func, args.dir, args.idx - 1)
        else:
            out = run_across_edits(func, args.dir)
    if args.task and args.project:
        northstar_db = get_northstar_db().cursor()
        tm_db = get_osmtm_db().cursor()
        out = run_across_edits_db(
            func, northstar_db, tm_db, args.task, args.project)

    pprint(out)


def get_stats(ways, nodes):
    wids = sorted(get_interesting_ways(ways))
    counts = defaultdict(int)
    for wid in wids:
        counts[ways[wid]['tags']['highway']] += 1

    return {
        'counts': counts,
        'lengths': compute_way_len(nodes, ways),
        'lint_tags': find_lint_tags(ways)
    }


def print_stats(folder, index):
    """print stats prints

    number of each road type
    road descriptors of each way?
    """
    files = sorted(glob.glob('{}/*.xml'.format(folder)))
    file = files[index]
    nodes, ways = read_xml_tree(file)
    # printed with WID order
    print('stats for {}'.format(file))
    wids = sorted(get_interesting_ways(ways))
    counts = defaultdict(int)
    for wid in wids:
        counts[ways[wid]['tags']['highway']] += 1
        print(get_way_descriptor(wid, ways, nodes))

    # stats
    for k in sorted(counts.keys()):
        print(k, counts[k])


def get_nodes_to_ways(ways, nodes):
    nodes_to_ways = {}
    for wid, way in ways.iteritems():
        for nid in way['nds']:
            if nid not in nodes_to_ways:
                nodes_to_ways[nid] = set()
            nodes_to_ways[nid].add(wid)

    return nodes_to_ways


def get_shared_nodes(way, ways, nodes_to_ways):
    # returns counts of occurences of nodes in new_way in ways1, grouped by way
    number_shared_nodes = defaultdict(int)
    for nid in way['nds']:
        if nid not in nodes_to_ways:
            continue
        else:
            for wid in nodes_to_ways[nid]:
                number_shared_nodes[wid] += 1

    return number_shared_nodes


def find_overlapping_ways(init_way, nodes, ways):
    nodes_to_ways = get_nodes_to_ways(ways, nodes)
    return get_shared_nodes(init_way, ways, nodes_to_ways)


def get_ball(folder):
    files = sorted(glob.glob('{}/*.xml'.format(folder)))
    nodess = []
    wayss = []
    for f in files:
        nodes, ways = read_xml_tree(f)
        nodess.append(nodes)
        wayss.append(ways)

    return nodess, wayss, files


def track(folder, wid):
    nodess, wayss, files = get_ball(folder)

    init_way = None
    for ways in wayss:
        if wid in ways:
            init_way = ways[wid]

    if not init_way:
        print('does not exist')
        return

    print('tracking {} with {} nodes'.format(wid, len(init_way['nds'])))

    for i in xrange(len(files)):
        print('\n::' + files[i])
        nodes, ways = nodess[i], wayss[i]
        print(get_way_descriptor(wid, ways, nodes))
        overlaps = find_overlapping_ways(init_way, nodes, ways)
        # print overlaps
        for w, count in overlaps.iteritems():
            if count >= 2:
                print('overlap {} {}'.format(
                    count, get_way_descriptor(w, ways, nodes)))


def exists(way, wayss, nodess):
    for i in xrange(len(wayss)):
        overlaps = find_overlapping_ways(way, nodess[i], wayss[i])
        for w, count in overlaps.iteritems():
            if count >= 2:
                return True

    return False


def track_deleted_ways(folder):
    nodess, wayss, _ = get_ball(folder)
    for wid, way in wayss[0].iteritems():
        if wid < 0:
            if not exists(way, wayss[1:], nodess[1:]):
                print(wid)


TILE_PIXELS = 256
AVG_EARTH_RADIUS = 6378.137  # in kme


def haversine_distance(lng1, lat1, lng2, lat2):
    """Distance between two sets of latitude, longitude coordinates.

    Arguments:
        lng1: Longitude coordinate of the first point.
        lat1: Latitude coordinate of the first point.
        lng2: Longitude coordinate(s) of the second point.
        lat2: Latitude coordinate(s) of the second point.

    Returns:
        Distance(s) in km between the two points.
    """
    # convert all latitudes/longitudes from decimal degrees to radians
    lat1, lng1, lat2, lng2 = map(np.radians, (lat1, lng1, lat2, lng2))
    # calculate haversine
    lat = lat2 - lat1
    lng = lng2 - lng1
    d = (
        np.sin(lat / 2) ** 2 +
        np.cos(lat1) * np.cos(lat2) * np.sin(lng / 2) ** 2)
    h = 2 * AVG_EARTH_RADIUS * np.arcsin(np.sqrt(d))
    return h  # in kilometers


def dump_way_tags(xml_input):
    nodes, ways = read_xml_tree(xml_input)
    tags = []
    for w in ways.values():
        tags += w['tags'].items()

    return tags


def find_lint_tags(ways):
    out = []
    for wid, w in ways.iteritems():
        for k, v in w['tags'].iteritems():
            if k.startswith('lint_review'):
                out.append([k, v, wid, w['tags']['highway']])
    return out


def safe_int(d, key):
    val = d.get(key)
    if val is None:
        return None
    return int(val)


def safe_float(d, key):
    val = d.get(key)
    if val is None:
        return None
    return float(val)


def read_xml_tree(xml_input):
    """Rewrite atrributes from input XML file into Python dictionary"""
    root = ET.parse(xml_input).getroot()
    nodes = {}
    ways = {}

    for ele in root:
        if ele.tag == 'node':
            nid = int((ele.get('id')))
            nodes[nid] = {
                'action': ele.get('action'),
                'lat': safe_float(ele, 'lat'),
                'lon': safe_float(ele, 'lon'),
                'changeset': safe_int(ele, 'changeset'),
                'version': ele.get('timestamp'),
                'timestamp': safe_int(ele, 'version'),
                'tags': {}
            }

            for child in ele.findall('tag'):
                nodes[nid]['tags'][child.get('k')] = child.get('v')

        elif ele.tag == 'way':
            wid = int((ele.get('id')))
            ways[wid] = {
                'action': ele.get('action'),
                'changeset': safe_int(ele, 'changeset'),
                'version': ele.get('timestamp'),
                'timestamp': ele.get('timestamp'),
                'user': ele.get('user'),
                'tags': {}
            }

            # collect node ways
            ndref = []
            for child in ele:
                if child.tag == 'nd':
                    ndref.append(int(child.get('ref')))
                elif child.tag == 'tag':
                    ways[wid]['tags'][child.get('k')] = child.get('v')
            ways[wid]['nds'] = ndref

    return nodes, ways


def find_connection_nodes(ways):
    """Detect and list connection nodes

    returns nodes on negative and positive ways
    """
    node_to_neg_ways = {}
    node_to_pos_ways = {}

    for wid in ways:
        if wid < 0:
            for nid in ways[wid]['nds']:
                if nid not in node_to_neg_ways:
                    node_to_neg_ways[nid] = set()
                node_to_neg_ways[nid].add(wid)
        else:
            for nid in ways[wid]['nds']:
                if nid not in node_to_pos_ways:
                    node_to_pos_ways[nid] = set()
                node_to_pos_ways[nid].add(wid)

    neg_way_connection_nodes = {
        x for x in node_to_neg_ways if len(node_to_neg_ways[x]) > 1
    }
    pos_way_connection_nodes = {
        x for x in node_to_pos_ways if len(node_to_pos_ways[x]) > 1
    }

    return neg_way_connection_nodes, pos_way_connection_nodes


def count_ways(ways):
    """count new and existing ways"""
    neg_num_ways = [wid for wid in ways if wid < 0]
    pos_num_ways = [wid for wid in ways if wid > 0]

    return {
        "new": len(neg_num_ways),
        "existing": len(pos_num_ways)
    }


def nodes_moved(n1, n2):
    lat1, lon1 = n1['lat'], n1['lon']
    lat2, lon2 = n2['lat'], n2['lon']
    return math.fabs(lat1 - lat2) > 1e-6 or math.fabs(lon1 - lon2) > 1e-6


def compare_road_shape(nodes1, ways1, nodes2, ways2, what_roads):
    """Return total changes of all nodes on ways

    to reflect road shape differences, and
    total changes on connection nodes to reflect
    road connection and continuity diffs
    """
    neg_way_node_list1 = []
    pos_way_node_list1 = []
    for wid in ways1:
        if wid < 0:
            neg_way_node_list1.extend(ways1[wid]['nds'])
        elif wid > 0:
            pos_way_node_list1.extend(ways1[wid]['nds'])

    neg_way_node_list2 = []
    pos_way_node_list2 = []
    for wid in ways2:
        if wid < 0:
            neg_way_node_list2.extend(ways2[wid]['nds'])
        elif wid > 0:
            pos_way_node_list2.extend(ways2[wid]['nds'])

    neg_way_cn1, pos_way_cn1 = find_connection_nodes(ways1)
    neg_way_cn2, pos_way_cn2 = find_connection_nodes(ways2)

    num_nodes_moved = 0
    num_nodes_added = 0
    num_nodes_deleted = 0
    conn_node_removed = 0
    conn_node_added = 0

    if what_roads == 'new':
        node_set1 = set(neg_way_node_list1)
        node_set2 = set(neg_way_node_list2)
        connection_nodes_set1 = neg_way_cn1
        connection_nodes_set2 = neg_way_cn2
    elif what_roads == 'exist':
        node_set1 = set(pos_way_node_list1)
        node_set2 = set(pos_way_node_list2)
        connection_nodes_set1 = pos_way_cn1
        connection_nodes_set2 = pos_way_cn2

    # compare connections nodes changes
    for ele in connection_nodes_set1:
        if ele not in connection_nodes_set2:
            conn_node_removed += 1

    for ele in connection_nodes_set2:
        if ele not in connection_nodes_set1:
            conn_node_added += 1

    # compare road shape changes
    for ele in node_set1:
        if ele not in node_set2:
            num_nodes_deleted += 1

    for ele in node_set2:
        if ele not in node_set1:
            num_nodes_added += 1
        elif nodes_moved(nodes1[ele], nodes2[ele]):
            num_nodes_moved += 1

    return (
        num_nodes_added + num_nodes_moved + num_nodes_deleted,
        conn_node_removed + conn_node_added)


def max_overlapping_way(new_way, nodes_to_ways):
    # returns way id that has the most number of nodes in new way
    node_counts = defaultdict(int)
    if 'highway' in new_way['tags']:
        for nid in new_way['nds']:
            if nid not in nodes_to_ways:
                continue
            else:
                for wid in nodes_to_ways[nid]:
                    node_counts[wid] += 1

    if not len(node_counts):
        return

    wid, max_shared_nodes = max(node_counts.items(), key=lambda x: x[1])
    if max_shared_nodes >= 2:
        return wid


def compare_road_tags(nodes1, ways1, nodes2, ways2, what_roads):
    """Compare edits on tags, return changes counts of roadtype and tags

    number of road type changes
    number of other tag changes
    """
    road_type_changes = 0
    removed_way_tags = 0
    added_way_tags = 0
    updated_way_tags = 0

    exclude_list = {
        'highway', 'source', 'edited', 'import', 'highlight',
        'lint_bordersplit', 'lint_autoconnect'
    }

    if what_roads == 'new':
        ways1 = {k: v for k, v in ways1.items() if k < 0}
        ways2 = {k: v for k, v in ways2.items() if k < 0}
    elif what_roads == 'exist':
        ways1 = {k: v for k, v in ways1.items() if k > 0}
        ways2 = {k: v for k, v in ways2.items() if k > 0}

    nodes_to_ways1 = defaultdict(set)
    for wid, way in ways1.items():
        for nid in way['nds']:
            nodes_to_ways1[nid].add(wid)

    # get number of ways with tag change for road type tags
    for wid in ways2:
        if wid not in ways1:
            w_id = max_overlapping_way(ways2[wid], nodes_to_ways1)
            if w_id:
                highway1 = ways1[w_id]['tags'].get('highway')
                highway2 = ways2[wid]['tags'].get('highway')
                if highway1 != highway2:
                    road_type_changes += 1
            else:
                road_type_changes += 1
        else:
            # road type changes on ways with same id in differnet xml file
            if 'highway' in ways1[wid]['tags'] and \
                    'highway' in ways2[wid]['tags']:
                road_type1 = ways1[wid]['tags']['highway']
                road_type2 = ways2[wid]['tags']['highway']
                if road_type1 != road_type2:
                    road_type_changes += 1

            # diff the tags non-road type tags
            for ele in ways1[wid]['tags']:
                if (ele not in ways2[wid]['tags']) and \
                        (ele.lower() not in exclude_list):
                    removed_way_tags += 1
            for ele in ways2[wid]['tags']:
                if ele.lower() not in exclude_list:
                    if ele not in ways1[wid]['tags']:
                        added_way_tags += 1
                    elif ways1[wid]['tags'][ele] != ways2[wid]['tags'][ele]:
                        updated_way_tags += 1

    # get number of nodes with tag changes
    removed_node_tags = 0
    added_node_tags = 0
    updated_node_tags = 0
    for nid in nodes2:
        if nid not in nodes1:
            continue
        else:
            for ele in nodes1[nid]['tags']:
                if (ele not in nodes2[nid]['tags']) and \
                        (ele.lower() not in exclude_list):
                    removed_node_tags += 1
            for ele in nodes2[nid]['tags']:
                if ele.lower() not in exclude_list:
                    if ele not in nodes1[nid]['tags']:
                        added_node_tags += 1
                    elif nodes1[nid]['tags'][ele] != nodes2[nid]['tags'][ele]:
                        updated_node_tags += 1

    num_tag_changes = removed_node_tags + added_node_tags + updated_node_tags
    num_tag_changes += removed_way_tags + added_way_tags + updated_way_tags

    return road_type_changes, num_tag_changes


def get_road_len(way, nodes):
    nids = way['nds']
    if len(nids) < 2:
        return 0

    road_len = 0
    for i in range(2, len(nids)):
        n1, n2 = nodes[nids[i - 1]], nodes[nids[i]]
        road_len += haversine_distance(
            n1['lat'], n1['lon'], n2['lat'], n2['lon']
        )

    return road_len


def compute_way_len(nodes, ways):
    """Obtain lengths of roads in different categories"""
    def get_road_type(way):
        road_type = way['tags']['highway']
        if road_type in ['residential', 'unclassified', 'track']:
            return road_type
        else:
            return 'other'

    road_len = {
        'new_residential': 0,
        'new_unclassified': 0,
        'new_track': 0,
        'new_other': 0,
        'new_total': 0,
        'existing_residential': 0,
        'existing_unclassified': 0,
        'existing_track': 0,
        'existing_other': 0,
        'existing_total': 0
    }

    total = 0
    for wid, way in ways.iteritems():
        if 'highway' in way['tags']:
            if wid < 0:
                prefix = 'new_'
            else:
                prefix = 'existing_'

            length = get_road_len(way, nodes)
            road_type = get_road_type(way)
            road_len[prefix + road_type] += length
            road_len[prefix + 'total'] += length
            total += length

    road_len['total'] = total

    return road_len


def compare_road_len(nodes1, ways1, nodes2, ways2):
    """Obtain road length differences of two XML files"""
    way_len1 = compute_way_len(nodes1, ways1)
    way_len2 = compute_way_len(nodes2, ways2)

    diff = {}
    for key in way_len1.keys():
        diff[key] = way_len2[key] - way_len1[key]

    return diff


if __name__ == "__main__":
    parser = argparse.ArgumentParser(
        description='Obtain and Compare multiple metrics of two OSM_XML files.'
    )
    parser.add_argument(
        '--new-or-exist', help='Input "new" or "exist".'
    )
    parser.add_argument('--osm1', help='path of file before edits.')
    parser.add_argument('--osm2', help='path of file after edits.')
    parser.add_argument('--dir', help='folder with all the edits')
    parser.add_argument('--task', type=int, help="id of task")
    parser.add_argument('--project', type=int, help="id of project")
    parser.add_argument('--fileout', help='writes output as a csv')
    parser.add_argument(
        '--num-days', type=int, help='number of days to compute stats on')
    parser.add_argument(
        '--idx',
        type=int,
        help='index of edit to work on. must supply dir')
    parser.add_argument(
        '--stats', action='store_true', help='show stats of each edit')
    parser.add_argument(
        "--dump-ways", help="prints ways", action="store_true")
    parser.add_argument(
        "--num-ways", help="prints count of ways", action="store_true")
    parser.add_argument(
        "--road-length",
        help="prints length of way types", action="store_true")
    parser.add_argument(
        "--lint-tags",
        help="print lint tags", action="store_true")
    parser.add_argument(
        '--track', type=int, help='track the evolution of a single way')
    parser.add_argument(
        '--track-deleted-ways',
        action='store_true', help='which ways disappeared')
    parser.add_argument(
        "--compare-road-shape",
        help="prints connecting nodes", action="store_true")
    parser.add_argument(
        "--compare-tag-change",
        help="prints connecting nodes", action="store_true")
    parser.add_argument(
        "--compare-road-length",
        help="prints connecting nodes", action="store_true")
    args = parser.parse_args()

    def pprint(obj):
        print(json.dumps(obj, indent=4, default=json_serializer))

    # functions on single edits
    if args.dump_ways:
        run_on_args(args, dump_ways)
    if args.stats:
        run_on_args(args, get_stats)
    if args.num_ways:
        run_on_args(args, lambda w, _: count_ways(w))
    if args.lint_tags:
        run_on_args(args, lambda w, _: find_lint_tags(w))
    if args.compare_road_shape:
        nodes1, ways1 = read_xml_tree(args.osm1)
        nodes2, ways2 = read_xml_tree(args.osm2)
        road_shape_change, connection_nodes = compare_road_shape(
            nodes1, ways1, nodes2, ways2, args.new_or_exist
        )
        print(road_shape_change, connection_nodes)
    if args.compare_tag_change:
        nodes1, ways1 = read_xml_tree(args.osm1)
        nodes2, ways2 = read_xml_tree(args.osm2)
        roadtype_change, nonroadtype_change = compare_road_tags(
            nodes1, ways1, nodes2, ways2, args.new_or_exist
        )
        print(roadtype_change, nonroadtype_change)
    if args.compare_road_length:
        nodes1, ways1 = read_xml_tree(args.osm1)
        nodes2, ways2 = read_xml_tree(args.osm2)
        diff_len = compare_road_len(nodes1, ways1, nodes2, ways2)
        pprint(diff_len)
    if args.track:
        track(args.dir, args.track)
    if args.track_deleted_ways:
        track_deleted_ways(args.dir)

