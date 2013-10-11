import sys, os, time
from shapely.geometry import Polygon
from shapely.geometry import MultiPolygon
from shapely.prepared import prep
from math import floor, ceil, pi, atan, exp


# Maximum resolution
MAXRESOLUTION = 156543.0339

# X/Y axis limit
max = MAXRESOLUTION*256/2

class TileBuilder(object):
    def __init__(self, parameter):
        self.a = parameter

    def create_square(self, i, j):
        xmin = i*self.a-max
        ymin = j*self.a-max
        xmax = (i+1)*self.a-max
        ymax = (j+1)*self.a-max
        return Polygon([(xmin, ymin), (xmax, ymin), (xmax, ymax), (xmin, ymax)])

# This method finds the tiles that intersect the given geometry for the given zoom
def get_tiles_in_geom(geom, z):
    xmin=geom.bounds[0]
    ymin=geom.bounds[1]
    xmax=geom.bounds[2]
    ymax=geom.bounds[3]

    # tile size (in meters) at the required zoom level
    step = max/(2**(z - 1))

    xminstep = int(floor((xmin+max)/step))
    xmaxstep = int(ceil((xmax+max)/step))
    yminstep = int(floor((ymin+max)/step))
    ymaxstep = int(ceil((ymax+max)/step))


    tb = TileBuilder(step)
    tiles = []
    prepared_geom = prep(geom)
    for i in range(xminstep,xmaxstep+1):
        for j in range(yminstep,ymaxstep+1):
            tile = tb.create_square(i, j)
            if prepared_geom.intersects(tile):
                tiles.append((i, j, tile))
    return tiles

from imposm.parser import OSMParser
from shapely.geometry import Polygon, MultiPolygon
from geojson import Feature

def parse_osm(filename):
    # instantiate parser and parser and start parsing
    parser = RelationParser()
    p = OSMParser(concurrency=1,
            coords_callback=parser.get_coords,
            relations_callback=parser.get_relations,
            ways_callback=parser.get_ways)

    p.parse(filename)

    polygons = []
    r = parser.relation

    # first check for self closing ways
    for i in range(len(r) - 1, 0, -1):
        w = parser.ways[r[i]]
        if w[len(w) - 1] == w[0]:
            r.pop(i)
            nodes = []
            polygon = Polygon([parser.nodes[node] for node in w])
            polygons.append(polygon)

    if len(r) > 0:
        prev = parser.ways[r[0]]
        ordered_ways = []
        ordered_ways.append(prev)
        r.pop(0)
        while len(r):
            match = False
            for i in range(0, len(r)):
                w = parser.ways[r[i]]
                # first node of the next way matches the last of the previous one
                if w[0] == prev[len(prev) - 1]:
                    match = w
                # or maybe the way has to be reversed
                elif w[len(w) - 1] == prev[len(prev) - 1]:
                    match = w[::-1]
                if match:
                    prev = match
                    ordered_ways.append(match)
                    r.pop(i)
                    break

        if len(ordered_ways) > 0:
            # now that ways are correctly ordered, we can create a unique geometry
            nodes = []
            for way in ordered_ways:
                for node in way:
                    nodes.append(parser.nodes[node])
            # make sure that first and last node are similar
            if nodes[0] != nodes[len(nodes) - 1]:
                raise
            # create a shapely polygon with the nodes
            polygons.append(Polygon(nodes))

    multipolygon = MultiPolygon(polygons)
    return Feature(geometry=multipolygon)

# simple class that handles the parsed OSM data.
class RelationParser(object):
    def __init__(self):
        self.nodes = {}
        self.ways =  {}
        self.relation = []

    def get_coords(self, coords):
        # callback method for nodes
        for osm_id, lon, lat in coords:
            self.nodes[osm_id] = (lon, lat)

    def get_ways(self, ways):
        # callback method for ways
        for way in ways:
            self.ways[way[0]] = way[2]

    def get_relations(self, relations):
        # callback method for relations
        # there should be only one in our case
        if len(relations) == 0:
            return
        for member in relations[0][2]:
            if member[1] == 'way':
                self.relation.append(member[0])
