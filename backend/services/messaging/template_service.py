import os
import re

from flask import current_app


def get_template(template_name: str) -> str:
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
        current_app.logger.error("Unable open file {0}".format(template_location))
        raise ValueError("Unable open file {0}".format(template_location))


def template_var_replacing(content: str, replace_list: list) -> str:
    """Receives a content string and executes a replace operation to each item on the list. """
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
            f'<a href="{current_app.config["APP_BASE_URL"]}/users/{username}/">@{username}</a>',
        )
    return content
