from server.models.postgis.tags import Tags
from server.models.postgis.project import Project


class TagsService:

    @staticmethod
    def get_all_organisation_tags(preferred_locale):
        """ Get all org tags"""
        return Project.get_all_organisations_tag(preferred_locale=preferred_locale)

    @staticmethod
    def get_all_campaign_tags():
        """ Get all org tags"""
        return Tags.get_all_campaigns()
