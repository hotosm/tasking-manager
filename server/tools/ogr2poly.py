#!/usr/bin/env python2

# This converts OGR supported files (Shapefile, GPX, etc.) to the polygon
# filter file format [1] supported by Osmosis and other tools. If there is
# more than one feature, it will create one POLY file for each feature,
# either using an incrementing filename or based on a field value. It also
# includes buffering and simplifying. This allows point or line features
# to be used when creating POLY files, but in this case buffering must
# be used.
#
# Requires GDAL/OGR compiled with GEOS
#
# [1] http://wiki.openstreetmap.org/wiki/Osmosis/Polygon_Filter_File_Format
#
# written by Josh Doe <josh@joshdoe.com> and licensed under the LGPL
#
# This program is free software: you can redistribute it and/or modify
# it under the terms of the GNU Lesser General Public License as published by
# the Free Software Foundation, either version 3 of the License, or
# (at your option) any later version.

# This program is distributed in the hope that it will be useful,
# but WITHOUT ANY WARRANTY; without even the implied warranty of
# MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
# GNU Lesser General Public License for more details.

# You should have received a copy of the GNU Lesser General Public License
# along with this program.  If not, see <http://www.gnu.org/licenses/>.

from optparse import OptionParser
import logging
import os
import sys

from osgeo import ogr
from osgeo import osr

# TODO:
#  check if file exists, make sure field is unique (increment)
#  likely doesn't handle areas spanning the antimeridian (+/-180 deg lon)
#  sometimes an empty poly is created, so pay attention to warnings
#      this can usually be fixed by decreasing the simplify distance


def createPolys(inOgr, options):
    logging.info("Opening datasource '%s'" % inOgr)
    ds = ogr.Open(inOgr)
    lyr = ds.GetLayer(options.layer)

    # create SRS transformations
    mercSRS = osr.SpatialReference()
    mercSRS.ImportFromEPSG(3857)  # TODO: make this an option
    wgsSRS = osr.SpatialReference()
    wgsSRS.ImportFromEPSG(4326)
    nativeSRS2bufferSRS = osr.CoordinateTransformation(lyr.GetSpatialRef(),
                                                       mercSRS)
    bufferSRS2wgsSRS = osr.CoordinateTransformation(mercSRS, wgsSRS)
    nativeSRS2wgsSRS = osr.CoordinateTransformation(lyr.GetSpatialRef(),
                                                    wgsSRS)

    # if no field name is provided, use incrementing number
    # (padded with just enough zeros)
    inc = 0
    incFmt = '%0' + str(len(str(lyr.GetFeatureCount() - 1))) + 'd'

    logging.info('Found %d features, will create one POLY file for each one'
           % lyr.GetFeatureCount())

    # create POLYs
    for feat in lyr:
        if options.fieldName != None:
            fieldVal = feat.GetFieldAsString(options.fieldName)
            if fieldVal is None:
                return False
            polyName = options.outPrefix + fieldVal.replace(' ', '_')
        else:
            polyName = options.outPrefix + incFmt % inc
            inc += 1

        logging.info('Creating ' + polyName + '.poly')
        f = open(polyName + '.poly', 'wt')
        print >>f, polyName

        # this will be a polygon, TODO: handle linestrings (must be buffered)
        geom = feat.GetGeometryRef()
        geomType = geom.GetGeometryType()

        subGeom = []

        nonAreaTypes = [ogr.wkbPoint, ogr.wkbLineString, ogr.wkbMultiPoint,
                        ogr.wkbMultiLineString]
        if geomType in nonAreaTypes and options.bufferDistance == 0:
            logging.warn("Ignoring non-area type. " +
                         "To include you must set a buffer distance.")
            continue
        if geomType in [ogr.wkbUnknown, ogr.wkbNone]:
            logging.warn("Ignoring unknown geometry type.")
            continue

        # transform to WGS84, buffering/simplifying along the way
        if options.bufferDistance > 0 or options.simplifyDistance > 0:
            geom.Transform(nativeSRS2bufferSRS)

            if options.bufferDistance > 0:
                geom = geom.Buffer(float(options.bufferDistance))
            if options.simplifyDistance > 0:
                geom = geom.Simplify(float(options.simplifyDistance))

            geom.Transform(bufferSRS2wgsSRS)
        else:
            geom.Transform(nativeSRS2wgsSRS)

        # handle multi-polygons
        subgeom = []
        geomtype = geom.GetGeometryType()
        if geomtype == ogr.wkbPolygon:
            subgeom = [geom]
        elif geomtype == ogr.wkbMultiPolygon:
            for k in range(geom.GetGeometryCount()):
                subgeom.append(geom.GetGeometryRef(k))

        logging.debug("# of polygons: " + str(len(subgeom)))
        for g in subgeom:
            # loop over all rings in the polygon
            logging.debug('# of rings: ' + str(g.GetGeometryCount()))
            for i in range(0, g.GetGeometryCount()):
                if i == 0:
                    # outer ring
                    print >>f, i + 1
                else:
                    # inner ring
                    print >>f, '!%d' % (i + 1)
                ring = g.GetGeometryRef(i)

                if ring.GetPointCount() > 0:
                    logging.debug('# of points: ' + str(ring.GetPointCount()))
                else:
                    logging.warn('Ring with no points')

                # output all points in the ring
                for j in range(0, ring.GetPointCount()):
                    (x, y, z) = ring.GetPoint(j)
                    print >>f, '   %.6E   %.6E' % (x, y)
                print >>f, 'END'
        print >>f, 'END'
        f.close()
    return True

if __name__ == '__main__':
    # Setup program usage
    usage = "Usage: %prog [options] src_datasource_name [layer]"
    parser = OptionParser(usage=usage)
    parser.add_option("-p", "--prefix", dest="outPrefix",
                      help="Text to prepend to POLY filenames.")
    parser.add_option("-b", "--buffer-distance", dest="bufferDistance",
                      type="float",
                      help="Set buffer distance in meters (default: 0).")
    parser.add_option("-s", "--simplify-distance", dest="simplifyDistance",
                      type="float",
                      help="Set simplify tolerance in meters (default: 0).")
    parser.add_option("-f", "--field-name", dest="fieldName",
                      help="Field name to use to name files.")
    parser.add_option("-v", "--verbose", dest="verbose", action="store_true",
                      help="Print detailed status messages.")

    parser.set_defaults(bufferDistance=0, fieldName=None, outPrefix=None,
        simplifyDistance=0, layer=0, verbose=False)

    # Parse and process arguments
    (options, args) = parser.parse_args()

    if options.verbose:
        logging.basicConfig(format='%(asctime)s:%(levelname)s: %(message)s',
                            level=logging.DEBUG)
    else:
        logging.basicConfig(format='%(levelname)s: %(message)s',
                            level=logging.WARNING)

    if len(args) < 1:
        parser.print_help()
        parser.error("You must specify an OGR source")
        sys.exit(1)
    elif len(args) > 2:
        parser.error("You have specified too many arguments")

    # note that this may be a file (e.g. .shp) or a database connection string
    src_datasource = args[0]
    if len(args) == 2:
        options.layer = args[1]

    # check options
    if options.outPrefix == None:
        if os.path.exists(src_datasource):
            # put in current dir, TODO: allow user to specify output dir?
            (options.outPrefix, ext) = os.path.splitext(
                    os.path.basename(src_datasource))
            options.outPrefix += '_'
        else:
            # file doesn't exist, so possibly a DB connection string
            options.outPrefix = 'poly_'
    if options.bufferDistance < 0:
        parser.error("Buffer distance must be greater than zero.")
    if options.simplifyDistance < 0:
        parser.error("Simplify tolerance must be greater than zero.")
    if options.simplifyDistance > options.bufferDistance:
        logging.warn("Simplify distance greater than buffer distance")

    if createPolys(src_datasource, options):
        logging.info('Finished!')
        sys.exit(0)
    else:
        logging.info('Failed!')
        sys.exit(1)
