from backend import db

from sqlalchemy import func

from backend.models.dtos.interests_dto import (
    InterestRateDTO,
    InterestRateListDTO,
    InterestsListDTO,
    InterestDTO,
)
from backend.models.postgis.task import TaskHistory
from backend.models.postgis.interests import (
    Interest,
    project_interests,
)
from backend.services.project_service import ProjectService
from backend.services.users.user_service import UserService
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
            raise HTTPException(
                status_code=500, detail="Deletion failed"
            ) from e

    @staticmethod
    def create_or_update_project_interests(project_id, interests):
        project = ProjectService.get_project_by_id(project_id)
        project.create_or_update_interests(interests)

        # Return DTO.
        dto = InterestsListDTO()
        dto.interests = [i.as_dto() for i in project.interests]

        return dto

    @staticmethod
    def create_or_update_user_interests(user_id, interests):
        user = UserService.get_user_by_id(user_id)
        user.create_or_update_interests(interests)

        # Return DTO.
        dto = InterestsListDTO()
        dto.interests = [i.as_dto() for i in user.interests]

        return dto

    @staticmethod
    def compute_contributions_rate(user_id):
        # 1. Get all projects that user has contributed.
        stmt = (
            TaskHistory.query.with_entities(TaskHistory.project_id)
            .distinct()
            .filter(TaskHistory.user_id == user_id)
            .subquery()
        )

        res = (
            session.query(
                Interest.name,
                func.count(project_interests.c.interest_id)
                / func.sum(func.count(project_interests.c.interest_id)).over(),
            )
            .group_by(project_interests.c.interest_id, Interest.name)
            .filter(project_interests.c.project_id.in_(stmt))
            .join(Interest, Interest.id == project_interests.c.interest_id)
        )

        rates = [InterestRateDTO({"name": r[0], "rate": r[1]}) for r in res.all()]
        results = InterestRateListDTO()
        results.rates = rates

        return results
