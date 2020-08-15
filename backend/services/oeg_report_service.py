from flask import current_app
import requests
from requests.exceptions import ConnectionError
import json

from backend import create_app
from backend.api.utils import TMAPIDecorators
from backend.models.dtos.project_dto import ProjectDTO
from backend.models.postgis.project import Project, ProjectStatus
from backend.models.postgis.licenses import License
from backend.models.postgis.organisation import Organisation
from backend.models.postgis.project_info import ProjectInfo
from backend.models.dtos.oeg_report_dto import (
    ExternalSourceReportDTO,
    ProjectReportDTO,
    OrganisationReportDTO,
    OegReportDTO,
)


tm = TMAPIDecorators()


class OegReportService:
    @tm.asynchronous()
    def report_data_to_osm(
        self, project_dto: ProjectDTO, current_project_dto: ProjectDTO
    ):
        app = (
            create_app()
        )  # Because message-all run on background thread it needs it's own app context

        with app.app_context():
            project_id = project_dto.project_id
            project = Project.get(project_id)
            organisation_enabled_report = project.organisation.enabled_oeg_report

            project_dto = project.as_dto_for_report()
            project_report = self.format_project_data(project_dto)
            report_data = self.generate_project_report_data(project_report)

            # Validate report data
            oeg_report_dto = OegReportDTO(report_data)
            oeg_report_dto.validate()
            oeg_report_data = oeg_report_dto.to_primitive(role="report")

            oeg_reporter_url = current_app.config["OEG_REPORTER_SERVICE_BASE_URL"]
            oeg_reporter_token = current_app.config["OEG_REPORTER_AUTHORIZATION_TOKEN"]
            if (
                project_dto.project_status == ProjectStatus.PUBLISHED.name
                and not project_dto.project_info.reported
                and organisation_enabled_report
                and project_dto.project_info.locale == "en"
            ):
                try:
                    # Report to git
                    response_git = requests.post(
                        f"{oeg_reporter_url}git/",
                        data=json.dumps(oeg_report_data),
                        headers={
                            "Content-Type": "application/json",
                            "Authorization": f"Token {oeg_reporter_token}",
                        },
                    )
                    if response_git.status_code != 201:
                        current_app.logger.debug(
                            f"Bad response from OEG reporter: {response_git.json()['detail']}"
                        )
                        return

                    # Report to wiki
                    response_wiki = requests.post(
                        f"{oeg_reporter_url}wiki/",
                        data=json.dumps(oeg_report_data),
                        headers={
                            "Content-Type": "application/json",
                            "Authorization": f"Token {oeg_reporter_token}",
                        },
                    )
                    if response_wiki.status_code != 201:
                        current_app.logger.debug(
                            f"Bad response from OEG reporter: {response_wiki.json()['detail']}"
                        )
                        return
                except ConnectionError:
                    current_app.logger.error("Can't connect to OEG reporter")
                    return
                else:
                    # Mark project as reported
                    project_info_dto = project_dto.project_info
                    project_info_dto.reported = True

                    update_project = ProjectInfo.get(project_id)
                    if update_project is not None:
                        update_project.update_from_dto(project_info_dto)
                        update_project.save()
                    else:
                        current_app.logger.error(f"Project {project_id} not found")
                        return
            elif (
                project_dto.project_status == ProjectStatus.PUBLISHED.name
                and project_dto.project_info.reported
                and organisation_enabled_report
                and project_dto.project_info.locale == "en"
            ):
                try:
                    # Format update project report data
                    current_project_report = self.format_project_data(
                        current_project_dto
                    )
                    current_report_data = self.generate_project_report_data(
                        current_project_report
                    )
                    update_report_data = self.generate_update_report_data(
                        current_report_data, report_data
                    )

                    # Get request parameters
                    platform_name = current_report_data["platform"]["name"]
                    organisation_name = current_report_data["organisation"]["name"]
                    project_name = current_report_data["project"]["name"]
                    project_id = current_report_data["project"]["projectId"]

                    # Update project report in git
                    response_git = requests.patch(
                        f"{oeg_reporter_url}git/{platform_name}/{organisation_name}/{project_id}/",
                        data=json.dumps(update_report_data),
                        headers={
                            "Content-Type": "application/json",
                            "Authorization": f"Token {oeg_reporter_token}",
                        },
                    )
                    if response_git.status_code != 201:
                        current_app.logger.debug(
                            f"Bad response from OEG reporter: {response_git.json()['detail']}"
                        )
                        return

                    # Update project report in wiki
                    response_wiki = requests.patch(
                        f"{oeg_reporter_url}wiki/{organisation_name}/{project_name}/",
                        data=json.dumps(update_report_data),
                        headers={
                            "Content-Type": "application/json",
                            "Authorization": f"Token {oeg_reporter_token}",
                        },
                    )
                    if response_wiki.status_code != 201:
                        current_app.logger.debug(
                            f"Bad response from OEG reporter: {response_wiki.json()['detail']}"
                        )
                        return
                except ConnectionError:
                    current_app.logger.error("Can't connect to OEG reporter")
                    return
                except ValueError as e:
                    current_app.logger.error(str(e))
                    return

    def get_project_report_external_source(self, project: dict) -> dict:
        """
        Get external source from the reported project and
        format it according to OegReportDTO
        """
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
        """
        Get license from the reported project and
        format it according to OegReportDTO
        """
        project_license = License.get_by_id(project["licenseId"])
        project["license"] = project.pop("licenseId")

        if project_license is None:
            return ""
        else:
            project_license_dto = project_license.as_dto()
            project_license_dto.validate()

            project_license = project_license_dto.to_primitive(role="report")
            return project_license["description"]

    def format_project_data(self, project_dto: ProjectDTO) -> dict:
        """ Format project data according to OegReportDTO """
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
        """
        Get organisation from the reported project and
        format it according to OegReportDTO
        """
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
        """
        Format project data according to OegReportDTO
        """
        # Get project organisation
        project_organisation = self.get_project_report_organisation(project)
        project.pop("organisation")

        project_dto = ProjectReportDTO(project)
        project_dto.validate()

        report_data = {
            "project": project,
            "organisation": (project_organisation),
            "platform": {
                "name": current_app.config["ORG_CODE"] + " Tasking Manager",
                "url": current_app.config["FRONTEND_BASE_URL"],
            },
        }
        return report_data

    def generate_update_report_data(
        self, current_project_data: dict, update_project_data: dict
    ) -> dict:
        """ Get fields that have been updated in the reported project """
        update_report_data = {}
        for report_data_key in current_project_data.keys():
            for key in current_project_data[report_data_key].keys():
                if (
                    current_project_data[report_data_key][key]
                    != update_project_data[report_data_key][key]
                ):
                    update_report_data[report_data_key] = {
                        key: update_project_data[report_data_key][key]
                    }
        # Checks if no fields have been updated
        if not update_report_data:
            raise ValueError("Project not updated")
        else:
            # Validate update report data
            oeg_report_dto = OegReportDTO(update_report_data)
            oeg_report_dto.validate(partial=True)
            return update_report_data
