import os

from setuptools import setup, find_packages

here = os.path.abspath(os.path.dirname(__file__))
README = open(os.path.join(here, 'README.md')).read()
CHANGES = open(os.path.join(here, 'CHANGES.txt')).read()

requires = [
    'pyramid==1.4',
    'pyramid_mako==1.0a2',
    'SQLAlchemy==0.9.3',
    'transaction',
    'pyramid_tm',
    'pyramid_debugtoolbar',
    'zope.sqlalchemy',
    'waitress',
    'psycopg2',
    'markdown',
    'nose',
    'coverage',
    'geojson',
    'oauth2',
    'shapely',
    'geoalchemy2',
    'Babel',
    'sqlalchemy-i18n==0.8.2',
    'WebTest==2.0.14',
    ]

setup(name='osmtm',
      version='2.0',
      description='osmtm',
      long_description=README + '\n\n' + CHANGES,
      classifiers=[
        "Programming Language :: Python",
        "Framework :: Pyramid",
        "Topic :: Internet :: WWW/HTTP",
        "Topic :: Internet :: WWW/HTTP :: WSGI :: Application",
        ],
      author='',
      author_email='',
      url='',
      keywords='web wsgi bfg pylons pyramid',
      packages=find_packages(),
      include_package_data=True,
      zip_safe=False,
      test_suite='osmtm',
      install_requires=requires,
      entry_points="""\
      [paste.app_factory]
      main = osmtm:main
      [console_scripts]
      initialize_osmtm_db = osmtm.scripts.initializedb:main
      """,
      message_extractors = {'osmtm': [
            ('**.py', 'python', None),
            ('templates/**.html', 'mako', None),
            ('templates/**.mako', 'mako', None),
            ('static/**', 'ignore', None)]},
      )
