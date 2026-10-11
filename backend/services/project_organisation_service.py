from typing import List

from databases import Database

from backend.exceptions import BadRequest, NotFound
from backend.models.dtos.project_organisation_dto import (
    ProjectOrganisationDTO,
    ProjectOrganisationsDTO,
)
from backend.models.postgis.project_organisation import ProjectOrganisation


class ProjectOrganisationService:
    @staticmethod
    async def get_project_lead_organisation_id(project_id: int, db: Database) -> int:
        """Returns the lead organisation of a project, raising if the project is unknown"""
        query = """
            SELECT organisation_id
            FROM projects
            WHERE id = :project_id
        """
        project = await db.fetch_one(query, values={"project_id": project_id})
        if project is None:
            raise NotFound(sub_code="PROJECT_NOT_FOUND", project_id=project_id)
        return project["organisation_id"]

    @staticmethod
    async def get_supporting_organisations_by_project(
        project_id: int, db: Database
    ) -> List[ProjectOrganisationDTO]:
        """
        Retrieves the supporting organisations linked to a project, with the
        organisation details inlined so callers can render them directly.
        """
        query = """
            SELECT
                po.id,
                po.project_id,
                po.organisation_id,
                po.created_at,
                o.name AS organisation_name,
                o.slug AS organisation_slug,
                o.logo AS organisation_logo
            FROM project_organisations po
            JOIN organisations o ON o.id = po.organisation_id
            WHERE po.project_id = :project_id
            ORDER BY o.name
        """
        rows = await db.fetch_all(query, values={"project_id": project_id})
        return [ProjectOrganisationDTO(**row) for row in rows]

    @staticmethod
    async def get_project_organisations_as_dto(
        project_id: int, db: Database
    ) -> ProjectOrganisationsDTO:
        """Returns the lead organisation of a project alongside its supporting ones"""
        lead_organisation_id = (
            await ProjectOrganisationService.get_project_lead_organisation_id(
                project_id, db
            )
        )
        supporting_organisations = (
            await ProjectOrganisationService.get_supporting_organisations_by_project(
                project_id, db
            )
        )
        return ProjectOrganisationsDTO(
            lead_organisation_id=lead_organisation_id,
            supporting_organisations=supporting_organisations,
        )

    @staticmethod
    async def create_project_organisation(
        project_id: int, organisation_id: int, db: Database
    ) -> int:
        """Links a supporting organisation to a project"""
        lead_organisation_id = (
            await ProjectOrganisationService.get_project_lead_organisation_id(
                project_id, db
            )
        )

        organisation_query = "SELECT id FROM organisations WHERE id = :organisation_id"
        organisation = await db.fetch_one(
            organisation_query, values={"organisation_id": organisation_id}
        )
        if organisation is None:
            raise NotFound(
                sub_code="ORGANISATION_NOT_FOUND", organisation_id=organisation_id
            )

        if lead_organisation_id == organisation_id:
            raise BadRequest(
                sub_code="ORGANISATION_IS_PROJECT_LEAD",
                message="This organisation already leads the project.",
                project_id=project_id,
                organisation_id=organisation_id,
            )

        existing_link = await ProjectOrganisation.get_by_project_and_organisation(
            project_id, organisation_id, db
        )
        if existing_link is not None:
            raise BadRequest(
                sub_code="ORGANISATION_ALREADY_LINKED",
                message="This organisation is already linked to the project.",
                project_id=project_id,
                organisation_id=organisation_id,
            )

        project_organisation = ProjectOrganisation()
        project_organisation.project_id = project_id
        project_organisation.organisation_id = organisation_id
        return await project_organisation.create(db)

    @staticmethod
    async def delete_project_organisation(
        project_id: int, organisation_id: int, db: Database
    ) -> None:
        """Unlinks a supporting organisation from a project"""
        record = await ProjectOrganisation.get_by_project_and_organisation(
            project_id, organisation_id, db
        )
        if record is None:
            raise NotFound(
                sub_code="PROJECT_ORGANISATION_NOT_FOUND",
                project_id=project_id,
                organisation_id=organisation_id,
            )

        project_organisation = ProjectOrganisation()
        project_organisation.id = record["id"]
        await project_organisation.delete(db)
