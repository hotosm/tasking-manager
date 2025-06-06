import os
import re

from jinja2 import Environment, FileSystemLoader
from loguru import logger

from backend.config import settings

# Set up Jinja2 environment
env = Environment(
    loader=FileSystemLoader(os.path.join(os.path.dirname(__file__), "templates")),
)


def get_txt_template(template_name: str):
    """
    Helper function to read the template from disk and return as a string to be manipulated
    :param template_name: The template we want to load
    :return: Template as a string
    """
    try:
        template_location = os.path.join(
            os.path.dirname(__file__), "templates/{0}".format(template_name)
        )
        with open(template_location, mode="r", encoding="utf-8") as template:
            return template.read()
    except FileNotFoundError:
        logger.error("Unable open file {0}".format(template_location))
        raise ValueError("Unable open file {0}".format(template_location))


def get_template(template_name: str, values: dict) -> str:
    """
    Helper function to read a HTML template from disk and return it using flask's
    render_template function
    :param template_name: The template we want to load
    :return: Template as a string
    """
    try:
        values["ORG_CODE"] = settings.ORG_CODE
        values["ORG_NAME"] = settings.ORG_NAME
        values["ORG_LOGO"] = settings.ORG_LOGO
        values["APP_BASE_URL"] = settings.APP_BASE_URL

        # Load the template
        template = env.get_template(template_name)

        # Render the template as a string
        rendered_template = template.render({"values": values})
        return rendered_template
    except (FileNotFoundError, TypeError):
        logger.error("Unable open file {0}".format(template_name))
        raise ValueError("Unable open file {0}".format(template_name))


def template_var_replacing(content: str, replace_list: list) -> str:
    """Receives a content string and executes a replace operation to each item on the list."""
    for term in replace_list:
        content = content.replace(term[0], term[1])
    return content


def clean_html(raw_html):
    cleanr = re.compile("<.*?>")
    clean_text = re.sub(cleanr, "", raw_html)
    return clean_text


def format_username_link(content):
    expression = re.compile("@\\[.*?\\]")
    names = expression.findall(content)
    for name in names:
        username = name[2:-1]
        content = content.replace(
            name,
            f'<a style="color: #d73f3f" href="{settings.APP_BASE_URL}/users/{username}/">@{username}</a>',
        )
    return content
