from backend.models.postgis.project import Project
from backend.models.dtos.interests_dto import (
    InterestRateDTO,
    InterestRateListDTO,
    InterestsListDTO,
    InterestDTO,
)
from backend.models.postgis.interests import (
    Interest,
)
from backend.services.project_service import ProjectService
from databases import Database
from fastapi import HTTPException


class InterestService:
    @staticmethod
    async def get(interest_id: int, db: Database) -> InterestDTO:
        query = """
            SELECT id, name
            FROM interests
            WHERE id = :interest_id
        """
        interest_dto = await db.fetch_one(query, {"interest_id": interest_id})
        return interest_dto

    @staticmethod
    def get_by_id(interest_id):
        interest = Interest.get_by_id(interest_id)
        return interest

    @staticmethod
    def get_by_name(name):
        interest = Interest.get_by_name(name)
        return interest

    @staticmethod
    async def create(interest_name: str, db: Database) -> InterestDTO:
        query = """
            INSERT INTO interests (name)
            VALUES (:name)
            RETURNING id;
        """
        values = {"name": interest_name}
        interest_id = await db.execute(query, values)

        query_select = """
            SELECT id, name
            FROM interests
            WHERE id = :id
        """
        interest_dto = await db.fetch_one(query_select, {"id": interest_id})
        return interest_dto

    @staticmethod
    async def update(interest_id: int, interest_dto: InterestDTO, db: Database):
        query = """
            UPDATE interests
            SET name = :name
            WHERE id = :interest_id
        """
        values = {"name": interest_dto.name}
        await db.execute(query, {**values, "interest_id": interest_id})

        query_select = """
            SELECT id, name
            FROM interests
            WHERE id = :id
        """
        updated_interest_dto = await db.fetch_one(query_select, {"id": interest_id})
        return updated_interest_dto

    @staticmethod
    async def get_all_interests(db: Database) -> InterestsListDTO:
        query = """
            SELECT id, name
            FROM interests
        """
        results = await db.fetch_all(query)

        interest_list_dto = InterestsListDTO()
        for record in results:
            interest_dto = InterestDTO(**record)
            interest_dict = interest_dto.dict(exclude_unset=True)
            interest_list_dto.interests.append(interest_dict)
        return interest_list_dto

    @staticmethod
    async def delete(interest_id: int, db: Database):
        query = """
            DELETE FROM interests
            WHERE id = :interest_id;
        """
        try:
            async with db.transaction():
                await db.execute(query, {"interest_id": interest_id})
        except Exception as e:
            raise HTTPException(status_code=500, detail="Deletion failed") from e

    @staticmethod
    async def create_or_update_project_interests(project_id, interests, db: Database):
        project = await ProjectService.get_project_by_id(project_id, db)
        project = await Project.create_or_update_interests(project, interests, db)

        # Return DTO.
        dto = InterestsListDTO()
        dto.interests = [i.as_dto() for i in project.interests]

        return dto

    @staticmethod
    async def create_or_update_user_interests(user_id, interests_ids, db: Database):
        """
        Create or update the user's interests by directly interacting with the database.
        """
        async with db.transaction():
            delete_query = """
                DELETE FROM user_interests WHERE user_id = :user_id
            """
            await db.execute(delete_query, {"user_id": user_id})
            insert_query = """
                INSERT INTO user_interests (user_id, interest_id)
                VALUES (:user_id, :interest_id)
            """
            values = [
                {"user_id": user_id, "interest_id": interest_id}
                for interest_id in interests_ids
            ]
            await db.execute_many(insert_query, values)
            return await InterestService.get_user_interests(user_id, db)

    @staticmethod
    async def get_user_interests(user_id, db: Database) -> InterestsListDTO:
        """
        Fetch the updated interests for the user and return the DTO.
        """
        query = """
            SELECT i.id, i.name
            FROM interests i
            JOIN user_interests ui ON i.id = ui.interest_id
            WHERE ui.user_id = :user_id
        """
        rows = await db.fetch_all(query, {"user_id": user_id})
        dto = InterestsListDTO()
        dto.interests = [InterestDTO(id=row["id"], name=row["name"]) for row in rows]
        return dto

    @staticmethod
    async def compute_contributions_rate(user_id: int, db: Database):
        stmt = """
            SELECT DISTINCT project_id
            FROM task_history
            WHERE user_id = :user_id
        """
        project_ids = await db.fetch_all(stmt, values={"user_id": user_id})

        if not project_ids:
            return InterestRateListDTO()

        project_ids_list = [row["project_id"] for row in project_ids]

        query = """
            SELECT i.name, COUNT(pi.interest_id) / SUM(COUNT(pi.interest_id)) OVER() as rate
            FROM project_interests pi
            JOIN interests i ON i.id = pi.interest_id
            WHERE pi.project_id = ANY(:project_ids)
            GROUP BY pi.interest_id, i.name
        """
        res = await db.fetch_all(query, values={"project_ids": project_ids_list})

        results = InterestRateListDTO()

        for r in res:
            results.rates.append(InterestRateDTO(name=r["name"], rate=r["rate"]))

        return results
