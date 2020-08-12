from flask import current_app
from schematics.transforms import whitelist
import requests
import json

from backend import db
from backend.models.dtos.project_dto import ProjectDTO
from backend.models.postgis.user import User
from backend.models.postgis.project import Project
from backend.models.postgis.licenses import License
from backend.models.postgis.organisation import Organisation
from backend.models.dtos.osm_report_dto import (
    ExternalSourceReportDTO,
    ProjectReportDTO,
    OrganisationReportDTO,
    PlatformReportDTO,
    OsmReportDTO,
)


class OsmReportServiceError(Exception):
    """ Custom Exception to notify callers an error occurred when validating a OsmReport """

    def __init__(self, message):
        if current_app:
            current_app.logger.error(message)


class OsmReportService:
    def report_data_to_osm(self, project_id: int):
        try:
            # Format project data
            project = Project.get(project_id)
            project_dto = project.as_dto_for_report()

            project_report = self.format_project_data(project_dto)
            report_data = self.generate_project_report_data(project_report)
            osm_report_dto = OsmReportDTO(report_data)
            osm_report_dto.validate()
            osm_report_data = osm_report_dto.to_primitive(role="report")

            url = current_app.config["OSM_REPORT_SERVICE_BASE_URL"]
            # POST github
            r = requests.post(
                f"{url}git/",
                data=json.dumps(osm_report_data),
                headers={"Content-Type": "application/json"},
            )
            # POST wiki
            r =requests.post(f"{url}wiki/",
                             data=json.dumps(osm_report_data),
                             headers={"Content-Type": "application/json"})

            return report_data
        except Exception as e:
            current_app.logger.debug(str(e))

    def get_project_report_external_source(self, project: dict) -> dict:
        external_source = {
            "imagery": project["imagery"],
            "license": project["license"],
            "instructions": project["instructions"],
            "perTaskInstructions": project["perTaskInstructions"],
        }
        external_source_dto = ExternalSourceReportDTO(external_source)
        external_source_dto.validate()

        project.pop("imagery")
        project.pop("license")
        project.pop("instructions")
        project.pop("perTaskInstructions")
        return external_source

    def get_project_report_license(self, project: dict) -> dict:
        project_license = License.get_by_id(project["licenseId"])
        project_license_dto = project_license.as_dto()
        project["license"] = project.pop("licenseId")
        project_license_dto.validate()

        project_license = project_license_dto.to_primitive(role="report")
        return project_license["description"]

    def format_project_data(self, project_dto: ProjectDTO) -> dict:
        """ Format project data according to OsmReportDTO """
        project = project_dto.to_primitive(role="report")

        # Add project info data into project data directly
        project.update(project["projectInfo"])
        project.pop("projectInfo")

        # Add users presents in project into project data
        project_users = Project.get_users_project(project["projectId"])
        project_users_dict = project_users.to_primitive()
        project.update(project_users_dict)

        # Add license, external source  and url into project data
        project["license"] = self.get_project_report_license(project)
        project["externalSource"] = self.get_project_report_external_source(project)
        project["url"] = (
            current_app.config["FRONTEND_BASE_URL"]
            + "/projects/"
            + str(project["projectId"])
        )
        return project

    def get_project_report_organisation(self, project: dict) -> dict:
        project_organisation = Organisation.get(project["organisation"])
        organisation = {
            "name": project_organisation.name,
            "url": project_organisation.url,
            "description": project_organisation.description,
        }
        project_organisation_dto = OrganisationReportDTO(organisation)
        project_organisation_dto.validate()
        return project_organisation_dto.to_primitive(role="report")

    def generate_project_report_data(self, project: dict) -> dict:
        # Get project organisation
        project_organisation = self.get_project_report_organisation(project)
        project.pop("organisation")

        project_dto = ProjectReportDTO(project)
        project_dto.validate()

        report_data = {
            "project": project,
            "organisation": (project_organisation),
            "platform": {
                "name": current_app.config["TM_ORG_CODE"] + " Tasking Manager",
                "url": current_app.config["FRONTEND_BASE_URL"],
            },
        }
        return report_data
