from server.models.postgis.tags import Tags
from server.models.postgis.project import Project


class TagsService:

    @staticmethod
    def get_all_organisation_tags():
        """ Get all org tags"""
        return Project.get_all_organisations_tag()

    @staticmethod
    def get_all_campaign_tags():
        """ Get all org tags"""
        return Tags.get_all_campaigns()
