import os
import urllib.parse
from flask import current_app


def get_template(template_name: str) -> str:
    """
    Helper function to read the template from disk and return as a string to be manipulated
    :param template_name: The template we want to load
    :return: Template as a string
    """
    try:
        template_location = os.path.join(os.path.dirname(__file__), 'templates/{0}'.format(template_name))
        template = open(template_location, mode='r', encoding='utf-8')
        return template.read()
    except FileNotFoundError:
        current_app.logger.error('Unable open file {0}'.format(template_location))
        raise ValueError('Unable open file {0}'.format(template_location))


def get_profile_url(username: str):
    """ Helper function returns the URL of the supplied users profile """
    base_url = current_app.config['APP_BASE_URL']
    return f'{base_url}/user/{urllib.parse.quote(username)}'
