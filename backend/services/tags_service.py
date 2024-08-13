from backend.models.postgis.project import Project
from databases import Database

class TagsService:
    @staticmethod
    async def get_all_countries(db):
        """Get all countries"""
        return await Project.get_all_countries(db)
