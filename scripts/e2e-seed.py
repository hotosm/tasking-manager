"""Seed script for E2E tests against a real backend.

Run inside the backend container started with the E2E compose override:
    docker compose --env-file tasking-manager.env \
        -f docker-compose.yml -f docker-compose.e2e.yml \
        exec tm-backend python scripts/e2e-seed.py

Or from host with the Python environment set up and DB exposed:
    POSTGRES_ENDPOINT=127.0.0.1 POSTGRES_PORT=5434 python scripts/e2e-seed.py
"""

import asyncio
import json
import os
from datetime import datetime

from databases import Database
from sqlalchemy.ext.asyncio import create_async_engine
from sqlalchemy.sql import text

# Ensure repo root is on path when running from scripts/ directory.
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from backend.config import settings
from backend.services.users.authentication_service import AuthenticationService
from tests.api.helpers.test_helpers import (
    create_canned_organisation,
    create_canned_project,
    create_canned_user,
    get_or_create_levels,
    return_canned_organisation,
    return_canned_user,
    update_project_with_info,
)

SEED_FILE = os.path.join(
    os.path.dirname(__file__), "..", "frontend", "e2e", ".e2e-seed.json"
)

E2E_MAPPER_ID = 9999001
E2E_VALIDATOR_ID = 9999002
E2E_ADMIN_ID = 9999003
E2E_ORG_ID = 23  # Reuse the same id used by create_canned_organisation helpers.


async def upsert_user(db, username, user_id, role=0):
    """Idempotently create/update a test user."""
    await db.execute(
        """
        INSERT INTO users (
            id, username, role, mapping_level, tasks_mapped, tasks_validated, tasks_invalidated,
            email_address, is_email_verified, is_expert, default_editor, mentions_notifications,
            projects_comments_notifications, projects_notifications, tasks_notifications,
            task_validation_notification, task_invalidation_notification,
            tasks_comments_notifications, teams_announcement_notifications, date_registered,
            last_validation_date
        )
        VALUES (
            :id, :username, :role, :mapping_level, :tasks_mapped, :tasks_validated, :tasks_invalidated,
            :email_address, :is_email_verified, :is_expert, :default_editor, :mentions_notifications,
            :projects_comments_notifications, :projects_notifications, :tasks_notifications,
            :task_validation_notification, :task_invalidation_notification,
            :tasks_comments_notifications, :teams_announcement_notifications, :date_registered,
            :last_validation_date
        )
        ON CONFLICT (id) DO UPDATE SET
            username = EXCLUDED.username,
            role = EXCLUDED.role,
            mapping_level = EXCLUDED.mapping_level,
            email_address = EXCLUDED.email_address,
            is_email_verified = EXCLUDED.is_email_verified,
            date_registered = EXCLUDED.date_registered
        """,
        {
            "id": user_id,
            "username": username,
            "role": role,
            "mapping_level": 1,
            "tasks_mapped": 0,
            "tasks_validated": 0,
            "tasks_invalidated": 0,
            "email_address": f"{username}@example.com",
            "is_email_verified": True,
            "is_expert": False,
            "default_editor": "ID",
            "mentions_notifications": True,
            "projects_comments_notifications": False,
            "projects_notifications": True,
            "tasks_notifications": True,
            "task_validation_notification": True,
            "task_invalidation_notification": True,
            "tasks_comments_notifications": False,
            "teams_announcement_notifications": True,
            "date_registered": datetime.utcnow(),
            "last_validation_date": None,
        },
    )


async def upsert_organisation(db, org_id, name, slug):
    await db.execute(
        """
        INSERT INTO organisations (id, name, slug, type)
        VALUES (:id, :name, :slug, :type)
        ON CONFLICT (id) DO UPDATE SET
            name = EXCLUDED.name,
            slug = EXCLUDED.slug
        """,
        {"id": org_id, "name": name, "slug": slug, "type": 1},
    )


async def clean_existing_project(db, project_name):
    """Remove a previous E2E project by name to keep seed idempotent."""
    rows = await db.fetch_all(
        """
        SELECT p.id
        FROM projects p
        JOIN project_info pi ON p.id = pi.project_id
        WHERE pi.name = :name
        """,
        {"name": project_name},
    )
    for row in rows:
        project_id = row["id"]
        await db.execute(
            "DELETE FROM task_history WHERE project_id = :project_id",
            {"project_id": project_id},
        )
        await db.execute(
            "DELETE FROM project_chat WHERE project_id = :project_id",
            {"project_id": project_id},
        )
        await db.execute(
            "DELETE FROM project_priority_areas WHERE project_id = :project_id",
            {"project_id": project_id},
        )
        await db.execute(
            "DELETE FROM tasks WHERE project_id = :project_id",
            {"project_id": project_id},
        )
        await db.execute(
            "DELETE FROM project_info WHERE project_id = :project_id",
            {"project_id": project_id},
        )
        await db.execute(
            "DELETE FROM projects WHERE id = :project_id",
            {"project_id": project_id},
        )


async def seed():
    db_url = settings.SQLALCHEMY_DATABASE_URI.unicode_string()
    engine = create_async_engine(db_url)
    db = Database(db_url, min_size=1, max_size=5)
    await db.connect()

    try:
        await get_or_create_levels(db)

        # Idempotently create test users.
        await upsert_user(db, "e2e_mapper", E2E_MAPPER_ID, role=0)
        await upsert_user(db, "e2e_validator", E2E_VALIDATOR_ID, role=0)
        await upsert_user(db, "e2e_admin", E2E_ADMIN_ID, role=1)

        # Idempotently create the organisation used by the canned helpers.
        await upsert_organisation(db, E2E_ORG_ID, "E2E Organisation", "e2e-org")

        # Clean and recreate the E2E project so repeated runs are stable.
        project_name = "E2E Mapping Project"
        await clean_existing_project(db, project_name)

        # create_canned_project returns the project object without its id set.
        project, author, project_id = await create_canned_project(db, name=project_name)
        project.id = project_id

        # Publish the project and make it publicly mappable/validatable.
        await db.execute(
            """
            UPDATE projects
            SET status = 1,
                mapping_permission = 0,
                validation_permission = 0,
                mapping_permission_level_id = 1,
                validation_permission_level_id = 1,
                private = false
            WHERE id = :project_id
            """,
            {"project_id": project_id},
        )
        await db.execute(
            """
            UPDATE project_info
            SET short_description = :short_description,
                description = :description,
                instructions = :instructions
            WHERE project_id = :project_id
            """,
            {
                "project_id": project_id,
                "short_description": "E2E short description",
                "description": "E2E description",
                "instructions": "E2E instructions",
            },
        )
        # Make sure tasks are in the expected states after publishing.
        await db.execute(
            """
            UPDATE tasks
            SET task_status = CASE
                WHEN id = 1 THEN 2
                WHEN id = 2 THEN 0
                WHEN id = 3 THEN 6
                WHEN id = 4 THEN 4
            END,
            locked_by = NULL,
            mapped_by = CASE
                WHEN id IN (1, 3, 4) THEN :author_id
                ELSE mapped_by
            END
            WHERE project_id = :project_id
            """,
            {"project_id": project_id, "author_id": author.id},
        )

        # Generate raw session tokens for the seeded users.
        data = {
            "mapper": {
                "id": E2E_MAPPER_ID,
                "username": "e2e_mapper",
                "token": AuthenticationService.generate_session_token_for_user(
                    E2E_MAPPER_ID
                ),
            },
            "validator": {
                "id": E2E_VALIDATOR_ID,
                "username": "e2e_validator",
                "token": AuthenticationService.generate_session_token_for_user(
                    E2E_VALIDATOR_ID
                ),
            },
            "admin": {
                "id": E2E_ADMIN_ID,
                "username": "e2e_admin",
                "token": AuthenticationService.generate_session_token_for_user(
                    E2E_ADMIN_ID
                ),
            },
            "project": {"id": project_id, "name": project_name},
            "organisation": {"id": E2E_ORG_ID, "name": "E2E Organisation"},
        }

        os.makedirs(os.path.dirname(SEED_FILE), exist_ok=True)
        with open(SEED_FILE, "w") as f:
            json.dump(data, f, indent=2)

        print(f"Seed written to {SEED_FILE}")
        print(json.dumps(data, indent=2))
    finally:
        await db.disconnect()
        await engine.dispose()


if __name__ == "__main__":
    asyncio.run(seed())
