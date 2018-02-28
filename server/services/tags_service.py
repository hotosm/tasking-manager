from server.models.postgis.tags import Tags
from server.models.postgis.project import Project
from flask import current_app

class TagsServiceError(Exception):
    """ Custom Exception to notify callers an error occurred when deleting a tag """

    def __init__(self, message):
        if current_app:
            current_app.logger.error(message)

class TagsService:

    @staticmethod
    def get_all_organisation_tags():
        """ Get all org tags"""
        return Tags.get_all_organisations()

    @staticmethod
    def get_all_campaign_tags():
        """ Get all org tags"""
        return Tags.get_all_campaigns()

    @staticmethod
    def delete_organisation_tags(organisation_tag : str):
        """ Delete organisation tag"""
        organisation_tags = Project.get_all_organisations_tag().tags

        if organisation_tag not in organisation_tags:
            tags = Tags.get_by_organisation_tag(organisation_tag)

            if (tags is None):
                raise TagsServiceError('Organisation Tag not found')

            tags.delete()

        else:
            raise TagsServiceError('Organisation Tag belongs to some Project')

