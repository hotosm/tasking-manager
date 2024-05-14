"""empty message

Revision ID: c40e1fdf6b70
Revises: 84c793a951b2
Create Date: 2020-02-04 22:23:22.457001

"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = "c40e1fdf6b70"
down_revision = "84c793a951b2"
branch_labels = None
depends_on = None


class Determiner:
    def determine_mapping_permission(self, val, reverse=False):
        # restrict_mapping_level_to_project=True => LEVEL = 1
        # restrict_mapping_level_to_project=False => ANY = 0
        permissions = {True: 1, False: 0}
        if reverse:
            return list(permissions.keys())[list(permissions.values()).index(val)]
        return permissions.get(val)

    def determine_validation_permission(self, val, reverse=False):
        # (restrict_validation_role=True, restrict_validation_level_intermediate=True) => TEAMS_LEVEL = 3
        # (restrict_validation_role=True, restrict_validation_level_intermediate=False) => TEAMS = 2
        # (restrict_validation_role=False, restrict_validation_level_intermediate=True) => LEVEL = 1
        # (restrict_validation_role=False, restrict_validation_level_intermediate=False) => ANY = 0
        permissions = {
            "True,True": 3,
            "True,False": 2,
            "False,True": 1,
            "False,False": 0,
        }
        if reverse:
            return list(permissions.keys())[list(permissions.values()).index(val)]
        return permissions.get(val)


def upgrade():
    conn = op.get_bind()
    conn.execute(sa.text("ALTER TABLE projects ADD mapping_permission Integer;"))
    conn.execute(sa.text("ALTER TABLE projects ADD validation_permission Integer;"))
    fetch_all_projects = "select id, restrict_mapping_level_to_project, \
                           restrict_validation_role, restrict_validation_level_intermediate from projects;"
    all_projects = conn.execute(sa.text(fetch_all_projects))
    for project in all_projects:
        mapping_permission = None
        validation_permission = None
        project_id = project[0]
        mapping_restriction = project[1]
        validation_role_restriction = project[2]
        validation_level_restriction = project[3]

        # Map existing restrictions to V4 permission integers
        d = Determiner()
        mapping_permission = d.determine_mapping_permission(mapping_restriction)
        validation_restriction = (
            str(validation_role_restriction) + "," + str(validation_level_restriction)
        )
        validation_permission = d.determine_validation_permission(
            validation_restriction
        )

        update_query = (
            "update projects set mapping_permission = '"
            + str(mapping_permission)
            + "', validation_permission = '"
            + str(validation_permission)
            + "' where id = "
            + str(project_id)
        )
        op.execute(update_query)
    op.drop_column("projects", "restrict_mapping_level_to_project")
    op.drop_column("projects", "restrict_validation_role")
    op.drop_column("projects", "restrict_validation_level_intermediate")


def downgrade():
    conn = op.get_bind()
    conn.execute(
        sa.text("ALTER TABLE projects ADD restrict_mapping_level_to_project boolean;")
    )
    conn.execute(sa.text("ALTER TABLE projects ADD restrict_validation_role boolean;"))
    conn.execute(
        sa.text(
            "ALTER TABLE projects ADD restrict_validation_level_intermediate boolean;"
        )
    )
    fetch_all_projects = (
        "select id, mapping_permission, validation_permission from projects;"
    )
    all_projects = conn.execute(sa.text(fetch_all_projects))
    for project in all_projects:
        project_id = project[0]
        mapping_permission = project[1]
        validation_permission = project[2]
        mapping_restriction = False
        validation_role_restriction = None
        validation_level_restriction = None

        # Reverse map V4 permission integers to V3 restrictions
        d = Determiner()

        try:
            mapping_restriction = d.determine_mapping_permission(
                mapping_permission, True
            )
        except Exception:
            mapping_restriction = False

        validation_restriction = d.determine_validation_permission(
            validation_permission, True
        ).split(",")
        validation_role_restriction = validation_restriction[0]
        validation_level_restriction = validation_restriction[1]

        update_query = (
            "update projects set restrict_mapping_level_to_project = '"
            + str(mapping_restriction)
            + "', restrict_validation_role = '"
            + str(validation_role_restriction)
            + "', restrict_validation_level_intermediate = '"
            + str(validation_level_restriction)
            + "' where id = "
            + str(project_id)
        )
        op.execute(update_query)

    op.drop_column("projects", "mapping_permission")
    op.drop_column("projects", "validation_permission")
