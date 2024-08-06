"""empty message

Revision ID: 14340f1e0d6b
Revises: 7bbc01082457
Create Date: 2020-03-13 10:35:57.594664

"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = "14340f1e0d6b"
down_revision = "7bbc01082457"
branch_labels = None
depends_on = None


def upgrade():
    tm3_org_name = "TM3"
    tm3_validator_team = "TM3-validators"
    tm3_pm_team = "TM3-project-managers"
    conn = op.get_bind()
    # Create an undefined organisation
    conn.execute(
        sa.text("insert into organisations (name) values('" + tm3_org_name + "');")
    )
    fetch_org_id = "select * from organisations where name = '" + tm3_org_name + "';"
    org_id = [r[0] for r in conn.execute(sa.text(fetch_org_id))][0]

    # Create two new teams associated to `undefined` organisation
    create_validator_team = (
        "insert into teams (visibility,invite_only,organisation_id,name) values (1,true,"
        + str(org_id)
        + ",'"
        + tm3_validator_team
        + "');"
    )
    conn.execute(sa.text(create_validator_team))
    validator_team_id = [
        r[0]
        for r in conn.execute(sa.text("select id from teams order by id desc limit 1;"))
    ][0]
    create_pm_team = (
        "insert into teams (visibility,invite_only,organisation_id,name) values (1,true,"
        + str(org_id)
        + ",'"
        + tm3_pm_team
        + "');"
    )
    conn.execute(sa.text(create_pm_team))
    project_manager_team_id = [
        r[0]
        for r in conn.execute(sa.text("select id from teams order by id desc limit 1;"))
    ][0]

    # Fetch all TM3 users who are validators; role = 4
    # Add them as members to the new team created for validators
    existing_validators = conn.execute(sa.text("select id from users where role = 4;"))
    for validator in existing_validators:
        validator_user_id = validator[0]
        # team function = 2(member) backend/models/postgis/statuses.py/TeamMemberFunctions
        update_validator_team = (
            "insert into team_members (active,function,team_id,user_id) values (true,2,"
            + str(validator_team_id)
            + ","
            + str(validator_user_id)
            + ");"
        )
        conn.execute(sa.text(update_validator_team))

    # Fetch all TM3 projects that has validation_permission = 2(TEAMS) or 3(TEAMS_LEVEL)
    # Refer to backend/models/postgis/statuses.py/ValidationPermission
    # Map the validator team to these projects with validator role
    # This is applicable only for legacy TM3 projects for easy transition
    existing_projects = conn.execute(
        sa.text("select id from projects where validation_permission in (2,3)")
    )
    for project in existing_projects:
        project_id = project[0]
        # role = 1 (validator) backend/models/postgis/statuses.py/TeamRoles
        update_project_team = (
            "insert into project_teams (role, team_id, project_id) values (1,"
            + str(validator_team_id)
            + ","
            + str(project_id)
            + ");"
        )
        conn.execute(sa.text(update_project_team))

    # Fetch all users who are project managers; role = 2
    # Add them as members to the new team created for project managers
    # This team is only to store legacy information and is not used anywhere internally
    existing_pms = conn.execute(sa.text("select id from users where role = 2;"))
    for project_manager in existing_pms:
        pm_user_id = project_manager[0]
        # team function = 2(member) backend/models/postgis/statuses.py/TeamMemberFunctions
        update_pm_team = (
            "insert into team_members (active,function,team_id,user_id) values (true,2,"
            + str(project_manager_team_id)
            + ","
            + str(pm_user_id)
            + ");"
        )
        conn.execute(sa.text(update_pm_team))

    # Set all users role = 0 (mapper)
    conn.execute(sa.text("update users set role = 0 where role in (2,4);"))


def downgrade():
    tm3_org_name = "TM3"
    tm3_validator_team = "TM3-validators"
    tm3_pm_team = "TM3-project-managers"
    conn = op.get_bind()

    # Fetch validator and project manager team ID
    validator_team_id = [
        r[0]
        for r in conn.execute(
            sa.text("select id from teams where name = '" + tm3_validator_team + "';")
        )
    ][0]
    pm_team_id = [
        r[0]
        for r in conn.execute(
            sa.text("select id from teams where name = '" + tm3_pm_team + "';")
        )
    ][0]

    # Disassociate all projects from the team
    conn.execute(
        sa.text("delete from project_teams where team_id=" + str(validator_team_id))
    )

    # Get all the users in the undefined-validators
    # Set role = 4 in users for all the selected users
    validators = conn.execute(
        sa.text(
            "select user_id from team_members where team_id="
            + str(validator_team_id)
            + ";"
        )
    )
    for validator in validators:
        conn.execute(
            sa.text("update users set role = 4 where id=" + str(validator[0]) + ";")
        )

    # Get all the users in the undefined-pms
    # Set role = 2 in users for all the selected users
    pms = conn.execute(
        sa.text(
            "select user_id from team_members where team_id=" + str(pm_team_id) + ";"
        )
    )
    for pm in pms:
        conn.execute(sa.text("update users set role = 2 where id=" + str(pm[0]) + ";"))

    # Remove all users from both the teams
    conn.execute(
        sa.text(
            "delete from team_members where team_id in ("
            + str(validator_team_id)
            + ","
            + str(pm_team_id)
            + ");"
        )
    )
    # Delete the teams and organisation
    conn.execute(
        sa.text("delete from teams where name = '" + tm3_validator_team + "';")
    )
    conn.execute(sa.text("delete from teams where name = '" + tm3_pm_team + "';"))
    conn.execute(
        sa.text("delete from organisations where name = '" + tm3_org_name + "';")
    )
