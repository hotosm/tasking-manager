import os
import xml.etree.ElementTree as ET


def get_canned_osm_user_details():
    """ Helper method to find test file, dependent on where tests are being run from """

    location = os.path.join(os.path.dirname(__file__), 'test_files', 'osm_user_details.xml')

    try:
        open(location, 'r')
        return ET.parse(location)
    except FileNotFoundError:
        raise FileNotFoundError('osm_user_details.xml not found')


def get_canned_simplified_osm_user_details():
    """ Helper that reads file and returns it as a string """
    location = os.path.join(os.path.dirname(__file__), 'test_files', 'osm_user_details_simple.xml')

    with open(location, 'r') as osm_file:
        data = osm_file.read().replace('\n', '')

    return data
