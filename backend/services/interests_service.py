from backend import db

from sqlalchemy import func

from backend.models.dtos.interests_dto import (
    InterestRateDTO,
    InterestRateListDTO,
    InterestsListDTO,
)
from backend.models.postgis.task import TaskHistory
from backend.models.postgis.interests import (
    Interest,
    project_interests,
)
from backend.services.project_service import ProjectService
from backend.services.users.user_service import UserService


class InterestService:
    @staticmethod
    def get(interest_id):
        interest = InterestService.get_by_id(interest_id)
        return interest.as_dto()

    @staticmethod
    def get_by_id(interest_id):
        interest = Interest.get_by_id(interest_id)
        return interest

    @staticmethod
    def get_by_name(name):
        interest = Interest.get_by_name(name)
        return interest

    @staticmethod
    def create(interest_name):
        interest_model = Interest(name=interest_name)
        interest_model.create()
        return interest_model.as_dto()

    @staticmethod
    def update(interest_id, new_interest_dto):
        interest = InterestService.get_by_id(interest_id)
        interest.update(new_interest_dto)
        return interest.as_dto()

    @staticmethod
    def get_all_interests() -> InterestsListDTO:
        return Interest.get_all_interests()

    @staticmethod
    def delete(interest_id):
        interest = InterestService.get_by_id(interest_id)
        interest.delete()

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
            db.session.query(
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
