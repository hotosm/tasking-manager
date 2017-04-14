from server.models.postgis.tags import Tags


class TagsService:

    @staticmethod
    def get_all_organisation_tags():
        """ Get all org tags"""
        return Tags.get_all_organisations()

    @staticmethod
    def get_all_campaign_tags():
        """ Get all org tags"""
        return Tags.get_all_campaigns()
