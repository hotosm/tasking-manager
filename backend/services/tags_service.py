from backend.models.postgis.project import Project


class TagsService:
    @staticmethod
    async def get_all_countries(session):
        """Get all countries"""
        return await Project.get_all_countries(session)
