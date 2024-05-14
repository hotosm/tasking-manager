from backend.models.postgis.project import Project


class TagsService:
    @staticmethod
    def get_all_countries():
        """Get all countries"""
        return Project.get_all_countries()
