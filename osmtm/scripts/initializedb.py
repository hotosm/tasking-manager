import os
import sys
import transaction

from sqlalchemy import engine_from_config

from pyramid.paster import (
    get_appsettings,
    setup_logging,
    )

from ..models import (
    DBSession,
    Area,
    Project,
    License,
    Base,
    )


def usage(argv):
    cmd = os.path.basename(argv[0])
    print('usage: %s <config_uri>\n'
          '(example: "%s development.ini")' % (cmd, cmd))
    sys.exit(1)


from sqlalchemy.orm import configure_mappers
from sqlalchemy_i18n.manager import translation_manager

def main(argv=sys.argv):
    if len(argv) != 2:
        usage(argv)
    config_uri = argv[1]
    setup_logging(config_uri)
    settings = get_appsettings(config_uri)
    engine = engine_from_config(settings, 'sqlalchemy.')
    DBSession.configure(bind=engine)

    translation_manager.options.update({
        'locales': settings['available_languages'].split(),
        'get_locale_fallback': True
    })
    configure_mappers()

    Base.metadata.drop_all(engine)
    Base.metadata.create_all(engine)
    with transaction.manager:
        area = Area(
            geometry='{"type":"Polygon","coordinates":[[[7.237243652343749,41.25922682850892],[7.23175048828125,41.12074559016745],[7.415771484374999,41.20552261955812],[7.237243652343749,41.25922682850892]]]}'
        )
        DBSession.add(area)

        project = Project(
            'Map all primary roads',
            area
        )
        project.short_description = "Lorem ipsum dolor sit amet, consectetur adipisicing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua."
        project.description = "Lorem ipsum dolor sit amet, consectetur adipisicing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum."
        DBSession.add(project)

        with project.force_locale('fr'):
            project.name = "Cartographier les routes"

        project.auto_fill(13)

        license = License()
        license.name = 'NextView'
        license.description = "This data is licensed for use by the US Government (USG) under the NextView (NV) license and copyrighted by Digital Globe or GeoEye. The NV license allows the USG to share the imagery and Literal Imagery Derived Products (LIDP) with entities outside the USG when that entity is working directly with the USG, for the USG, or in a manner that is directly beneficial to the USG. The party receiving the data can only use the imagery or LIDP for the original purpose or only as otherwise agreed to by the USG. The party receiving the data cannot share the imagery or LIDP with a third party without express permission from the USG. At no time should this imagery or LIDP be used for other than USG-related purposes and must not be used for commercial gain. The copyright information should be maintained at all times. Your acceptance of these license terms is implied by your use."
        license.plain_text = "In other words, you may only use NextView imagery linked from this site for digitizing OpenStreetMap data for humanitarian purposes."
        DBSession.add(license)

        license = License()
        license.name = 'Astrium/UNOSAT'
        license.description = "UNOSAT allow any INTERNET USER to use the IMAGE to develop DERIVATIVE WORKS provided that the INTERNET USER includes the DERIVATIVE WORKS he/she created in the OpenStreetMap database under CC-BY-SA licence (http://creativecommons.org/licenses/by-sa/2.0/) and/or Open Database licence (ODbL: http://www.opendatacommons.org/licenses/odbl/), with the credit of the corresponding PRODUCT conspicuously displayed and written in full, in order to allow any OpenStreetMap database user to have access to and to use the DERIVATIVE WORKS. Except for the foregoing, the END USER and/or the INTERNET USER shall not be entitled to sell, distribute, assign, dispose of, lease, sublicense or transfer, directly or indirectly, any DERIVATIVE WORKS to any third party."
        license.plain_text = "Astrium GEO-Information Services and UNOSAT are allowing access to this imagery for creating information in OpenStreetMap. Other uses are not allowed."
        DBSession.add(license)
