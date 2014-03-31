from pyramid.asset import abspath_from_asset_spec
try:
    import mapnik
except:
    # package name is mapnik2 for versions lower than 2.2
    import mapnik2 as mapnik
import json

# Maximum resolution
MAXRESOLUTION = 156543.0339
# X/Y axis limit
limit = MAXRESOLUTION * 256 / 2


class MapnikRendererFactory:  # pragma: no cover

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
        step = limit / (2 ** (int(z) - 1))

        xmin = x * step - limit
        ymin = limit - y * step
        xmax = (x + 1) * step - limit
        ymax = limit - (y + 1) * step

        bbox = mapnik.Box2d(xmin, ymax, xmax, ymin)

        m = mapnik.Map(width, height)
        mapnik.load_map(m, abspath_from_asset_spec('osmtm:views/map.xml'))

        for l in layers:
            m.layers.append(l)

        m.zoom_to_box(bbox)

        format = request.matchdict['format']
        if format == 'png':
            im = mapnik.Image(width, height)
            mapnik.render(m, im, 1, 1)

            request.response_content_type = 'image/png'
            return im.tostring('png')

        elif format == 'json':
            grid = mapnik.Grid(width, height)
            mapnik.render_layer(m, grid, layer=0, fields=['id'])
            utfgrid = grid.encode('utf', resolution=4)
            return json.dumps(utfgrid)
