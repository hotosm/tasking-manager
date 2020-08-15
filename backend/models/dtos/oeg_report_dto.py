from schematics import Model
from schematics.types import (
    StringType,
    URLType,
    ModelType,
    ListType,
    UTCDateTimeType,
)
from backend.models.dtos.project_dto import ProjectUser
from schematics.transforms import whitelist


class ExternalSourceReportDTO(Model):
    imagery = StringType()
    project_license = StringType(serialized_name="license")
    instructions = StringType(default="")
    per_task_instructions = StringType(
        default="", serialized_name="perTaskInstructions"
    )

    class Options:
        # Skip unnecessary fields in the OEG Report.
        roles = {
            "report": whitelist(
                "imagery", "project_license", "instructions", "per_task_instructions"
            )
        }


class ProjectReportDTO(Model):
    project_id = StringType(serialized_name="projectId")
    project_status = StringType(
        required=True,
        serialized_name="status",
        serialize_when_none=False,
    )
    project_name = StringType(serialized_name="name")
    short_description = StringType(serialized_name="shortDescription", default="")
    changeset_comment = StringType(serialized_name="changesetComment")
    created = UTCDateTimeType()
    author = StringType()
    url = URLType()
    external_source = ModelType(
        ExternalSourceReportDTO, serialized_name="externalSource"
    )
    users = ListType(ModelType(ProjectUser))

    class Options:
        # Skip unnecessary fields in the OEG Report.
        roles = {
            "report": whitelist(
                "project_id",
                "project_status",
                "project_name",
                "short_description",
                "changeset_comment",
                "created",
                "author",
                "url",
                "external_source",
                "users",
            )
        }


class OrganisationReportDTO(Model):
    name = StringType(required=True)
    url = URLType()
    description = StringType()

    class Options:
        # Skip unnecessary fields in the OEG Report.
        roles = {"report": whitelist("name", "url", "description")}


class PlatformReportDTO(Model):
    name = StringType()
    url = URLType()

    class Options:
        # Skip unnecessary fields in the OEG Report.
        roles = {"report": whitelist("name", "url")}


class OegReportDTO(Model):
    project = ModelType(ProjectReportDTO)
    organisation = ModelType(OrganisationReportDTO)
    platform = ModelType(PlatformReportDTO)

    class Options:
        # Skip unnecessary fields in the OEG Report.
        roles = {"report": whitelist("project", "organisation", "platform")}
