from pyramid.asset import abspath_from_asset_spec
from mapnik import (
        Projection,
        Map,
        Image,
        Grid,
        Box2d,
        load_map,
        render,
        render_layer
    )
import json

# Maximum resolution
MAXRESOLUTION = 156543.0339
# X/Y axis limit
max = MAXRESOLUTION*256/2

class MapnikRendererFactory:
    def __init__(self, info):
        self.mapfile = abspath_from_asset_spec(info.name)

    def __call__(self, layers, system):
        request = system['request']

        # get image width and height
        width = 256
        height = 256

        # get image bbox
        z = int(request.matchdict['z'])
        x = int(request.matchdict['x'])
        y = int(request.matchdict['y'])
        step = max/(2**(int(z) - 1))

        xmin = x*step-max
        ymin = max-y*step
        xmax = (x+1)*step-max
        ymax = max-(y+1)*step

        bbox = Box2d(xmin, ymax, xmax, ymin)

        m = Map(width, height)
        load_map(m, abspath_from_asset_spec('osmtm:views/map.xml'))

        for l in layers:
            m.layers.append(l)

        m.zoom_to_box(bbox)

        format = request.matchdict['format']
        if format == 'png':
            im = Image(width, height)
            render(m, im, 1, 1)

            request.response_content_type = 'image/png'
            return im.tostring('png')

        elif format == 'json':
            grid = Grid(width, height)
            render_layer(m, grid, layer=0, fields=['x', 'y'])
            utfgrid = grid.encode('utf', resolution=4)
            return json.dumps(utfgrid)
