"""empty message

Revision ID: 14340f1e0d6b
Revises: c40e1fdf6b70
Create Date: 2020-03-13 10:35:57.594664

"""
from alembic import op

# revision identifiers, used by Alembic.
revision = "14340f1e0d6b"
down_revision = "c40e1fdf6b70"
branch_labels = None
depends_on = None


def upgrade():
    conn = op.get_bind()
    # Create an undefined organisation
    conn.execute("insert into organisations (name) values('undefined');")
    fetch_org_id = "select * from organisations where name = 'undefined';"
    org_id = [r[0] for r in conn.execute(fetch_org_id)][0]

    # Create two new teams associated to `undefined` organisation
    create_validator_team = (
        "insert into teams (name,invite_only,organisation_id) values ('undefined-validators',false,"
        + str(org_id)
        + ");"
    )
    conn.execute(create_validator_team)
    validator_team_id = [
        r[0] for r in conn.execute("select id from teams order by id desc limit 1;")
    ][0]
    create_pm_team = (
        "insert into teams (name,invite_only,organisation_id) values ('undefined-pms',false,"
        + str(org_id)
        + ");"
    )
    conn.execute(create_pm_team)
    project_manager_team_id = [
        r[0] for r in conn.execute("select id from teams order by id desc limit 1;")
    ][0]

    # Fetch all TM3 users who are validators; role = 4
    # Add them as members to the new team created for validators
    existing_validators = conn.execute("select id from users where role = 4;")
    for validator in existing_validators:
        validator_user_id = validator[0]
        # team function = 2(member) backend/models/postgis/statuses.py/TeamMemberFunctions
        update_validator_team = (
            "insert into team_members (function,team_id,user_id) values (2,"
            + str(validator_team_id)
            + ","
            + str(validator_user_id)
            + ");"
        )
        conn.execute(update_validator_team)

    # Fetch all TM3 projects that has validation_permission = 2(TEAMS) or 3(TEAMS_LEVEL)
    # Refer to backend/models/postgis/statuses.py/ValidationPermission
    # Map the validator team to these projects with validator role
    # This is applicable only for legacy TM3 projects for easy transition
    existing_projects = conn.execute(
        "select id from projects where validation_permission in (2,3)"
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
        conn.execute(update_project_team)

    # Fetch all users who are project managers; role = 2
    # Add them as members to the new team created for project managers
    # This team is only to store legacy information and is not used anywhere internally
    existing_pms = conn.execute("select id from users where role = 2;")
    for project_manager in existing_pms:
        pm_user_id = project_manager[0]
        # team function = 2(member) backend/models/postgis/statuses.py/TeamMemberFunctions
        update_pm_team = (
            "insert into team_members (function,team_id,user_id) values (2,"
            + str(project_manager_team_id)
            + ","
            + str(pm_user_id)
            + ");"
        )
        conn.execute(update_pm_team)

    # Set all users role = 0 (mapper)
    conn.execute("update users set role = 0 where role in (2,4);")


def downgrade():
    conn = op.get_bind()

    # Fetch validator and project manager team ID
    validator_team_id = [
        r[0]
        for r in conn.execute(
            "select id from teams where name = 'undefined-validators';"
        )
    ][0]
    pm_team_id = [
        r[0] for r in conn.execute("select id from teams where name = 'undefined-pms';")
    ][0]

    # Disassociate all projects from the team
    conn.execute("delete from project_teams where team_id=" + str(validator_team_id))

    # Get all the users in the undefined-validators
    # Set role = 4 in users for all the selected users
    validators = conn.execute(
        "select user_id from team_members where team_id=" + str(validator_team_id) + ";"
    )
    for validator in validators:
        conn.execute("update users set role = 4 where id=" + str(validator[0]) + ";")

    # Get all the users in the undefined-pms
    # Set role = 2 in users for all the selected users
    pms = conn.execute(
        "select user_id from team_members where team_id=" + str(pm_team_id) + ";"
    )
    for pm in pms:
        conn.execute("update users set role = 2 where id=" + str(pm[0]) + ";")

    # Remove all users from both the teams
    conn.execute(
        "delete from team_members where team_id in ("
        + str(validator_team_id)
        + ","
        + str(pm_team_id)
        + ");"
    )
    # Delete the teams and organisation
    conn.execute("delete from teams where name = 'undefined-validators';")
    conn.execute("delete from teams where name = 'undefined-pms';")
    conn.execute("delete from organisations where name = 'undefined';")
