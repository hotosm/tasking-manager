import os

from setuptools import setup, find_packages

here = os.path.abspath(os.path.dirname(__file__))
README = open(os.path.join(here, 'README.md')).read()
CHANGES = open(os.path.join(here, 'CHANGELOG.md')).read()

requires = [
    'pyramid==1.6a1',
    'pyramid_mako==1.0.2',
    'SQLAlchemy==0.9.9',
    'transaction',
    'pyramid_tm',
    'pyramid_debugtoolbar',
    'zope.sqlalchemy',
    'waitress',
    'psycopg2',
    'markdown',
    'bleach==1.4',
    'nose',
    'coverage',
    'oauth2',
    'shapely',
    'geoalchemy2',
    'Babel',
    'sqlalchemy-utils==0.30.0',
    'sqlalchemy-i18n==0.8.4',
    'WebTest==2.0.14',
    'simplejson',
    'geojson==1.0.6',
    'webhelpers==1.3',
    'alembic==0.6.4',
    'transifex-client',
    'pyramid-exclog==0.7',
    'httpretty',
    'pygments',
    'gitversion',
    'APScheduler==3.0.3',
    'python-oembed == 0.2.1',
]

setup(name='osmtm',
      version='2.12.4',
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
      message_extractors={'osmtm': [
          ('**.py', 'python', None),
          ('templates/**.html', 'mako', None),
          ('templates/**.mako', 'mako', None),
          ('static/**', 'ignore', None)]},
      )
