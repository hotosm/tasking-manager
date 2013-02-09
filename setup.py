import os

from setuptools import setup, find_packages

here = os.path.abspath(os.path.dirname(__file__))
README = open(os.path.join(here, 'README.md')).read()
CHANGES = open(os.path.join(here, 'CHANGES.txt')).read()

requires = [
    'pyramid',
    #'SQLAlchemy', # should be installed along with GeoAlchemy2
    'transaction',
    'pyramid_tm',
    'pyramid_debugtoolbar',
    'zope.sqlalchemy',
    'waitress',
    'psycopg2',
    'markdown',
    'nose',
    'coverage',
    'geoalchemy',
    'geojson',
    'webtest',
    'BeautifulSoup'
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
      )
