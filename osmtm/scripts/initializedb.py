# -*- coding: utf-8 -*-

import transaction

from sqlalchemy import engine_from_config, func


from pyramid.paster import (
    get_appsettings,
    setup_logging,
)

from ..models import (
    DBSession,
    Area,
    Project,
    Task,
    License,
    Base,
)

from ..utils import load_local_settings


from sqlalchemy.orm import configure_mappers
from sqlalchemy_i18n.manager import translation_manager

from geoalchemy2 import shape
import geojson
import shapely


def main():
    setup_logging('development.ini')
    settings = get_appsettings('development.ini')

    load_local_settings(settings)

    engine = engine_from_config(settings, 'sqlalchemy.')
    DBSession.configure(bind=engine)

    translation_manager.options.update({
        'locales': settings['available_languages'].split(),
        'get_locale_fallback': True
    })
    configure_mappers()

    postgis_version = DBSession.execute(func.postgis_version()).scalar()
    if not postgis_version.startswith('2.'):
        # With PostGIS 1.x the AddGeometryColumn and DropGeometryColumn
        # management functions should be used.
        Area.__table__.c.geometry.type.management = True
        Task.__table__.c.geometry.type.management = True

    Base.metadata.drop_all(engine)
    Base.metadata.create_all(engine)
    with transaction.manager:
        geometry = '{"type":"Polygon","coordinates":[[[85.31038284301758,27.70731518595052],[85.31089782714842,27.698120147680104],[85.3242015838623,27.69842412827061],[85.323429107666,27.70731518595052],[85.31038284301758,27.70731518595052]]]}'  # noqa
        geometry = geojson.loads(geometry,
                                 object_hook=geojson.GeoJSON.to_instance)
        geometry = shapely.geometry.asShape(geometry)
        geometry = shape.from_shape(geometry, 4326)

        area = Area(
            geometry
        )
        DBSession.add(area)

        license1 = License()
        license1.name = 'NextView'
        license1.description = "This data is licensed for use by the US Government (USG) under the NextView (NV) license and copyrighted by Digital Globe or GeoEye. The NV license allows the USG to share the imagery and Literal Imagery Derived Products (LIDP) with entities outside the USG when that entity is working directly with the USG, for the USG, or in a manner that is directly beneficial to the USG. The party receiving the data can only use the imagery or LIDP for the original purpose or only as otherwise agreed to by the USG. The party receiving the data cannot share the imagery or LIDP with a third party without express permission from the USG. At no time should this imagery or LIDP be used for other than USG-related purposes and must not be used for commercial gain. The copyright information should be maintained at all times. Your acceptance of these license terms is implied by your use."  # noqa
        license1.plain_text = "In other words, you may only use NextView imagery linked from this site for digitizing OpenStreetMap data for humanitarian purposes."  # noqa
        DBSession.add(license1)

        license2 = License()
        license2.name = 'Astrium/UNOSAT'
        license2.description = "UNOSAT allow any INTERNET USER to use the IMAGE to develop DERIVATIVE WORKS provided that the INTERNET USER includes the DERIVATIVE WORKS he/she created in the OpenStreetMap database under CC-BY-SA licence (http://creativecommons.org/licenses/by-sa/2.0/) and/or Open Database licence (ODbL: http://www.opendatacommons.org/licenses/odbl/), with the credit of the corresponding PRODUCT conspicuously displayed and written in full, in order to allow any OpenStreetMap database user to have access to and to use the DERIVATIVE WORKS. Except for the foregoing, the END USER and/or the INTERNET USER shall not be entitled to sell, distribute, assign, dispose of, lease, sublicense or transfer, directly or indirectly, any DERIVATIVE WORKS to any third party."  # noqa
        license2.plain_text = "Astrium GEO-Information Services and UNOSAT are allowing access to this imagery for creating information in OpenStreetMap. Other uses are not allowed."  # noqa
        DBSession.add(license2)

        project = Project(
            'Kathmandu - Map all primary roads and buildings'
        )
        project.area = area
        project.short_description = "Lorem ipsum dolor sit amet, consectetur adipisicing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua."  # noqa
        project.description = "Lorem ipsum dolor sit amet, consectetur adipisicing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum."  # noqa
        project.instructions = "**The detailed instructions**\n\nLorem ipsum dolor sit amet, consectetur adipisicing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat."  # noqa
        project.entities_to_map = "primary roads, buildings"
        project.imagery = "tms[22]:http://hiu-maps.net/hot/1.0.0/kathmandu_flipped/{zoom}/{x}/{y}.png"  # noqa
        project.license = license1
        DBSession.add(project)

        with project.force_locale('fr'):
            project.name = "Kathmandu - Cartographier les routes et les bâtiments"  # noqa

        project.auto_fill(17)
