import asyncio
import sys
import os
import argparse
from backend.db import db_connection
from backend.services.users.user_service import UserService
from backend.services.users.osm_service import OSMService, OSMServiceError
from backend.models.postgis.user import MappingLevel
from backend.config import settings
import logging

# Add backend to sys.path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


# The script verifies if the user is advanced or not and demotes to the respective level if not.
async def fix_advanced_users(exclude_ids=None):
    await db_connection.connect()
    db = db_connection.database

    advanced_users = await db.fetch_all(
        "SELECT id, username FROM users WHERE mapping_level = :level",
        {"level": MappingLevel.ADVANCED.value},
    )
    logger.info(f"Found {len(advanced_users)} advanced users")

    downgraded_users = []

    for user in advanced_users:
        logger.info(f"----- Processing for user: {user.username}-{user.id} -----")
        user_id = user.id

        if exclude_ids and user_id in exclude_ids:
            logger.info(f"Skipping user {user.username} (ID: {user_id}) [Excluded]")
            continue

        try:
            osm_details = OSMService.get_osm_details_for_user(user_id)
            changeset_count = osm_details.changeset_count

            if changeset_count >= settings.MAPPER_LEVEL_ADVANCED:
                logger.info(
                    f"[{user.username}-{user_id}] OK as ADVANCED ({changeset_count} changesets)"
                )
                continue  # Still qualifies as ADVANCED

            # Determine correct level
            if changeset_count >= settings.MAPPER_LEVEL_INTERMEDIATE:
                new_level = MappingLevel.INTERMEDIATE
            else:
                new_level = MappingLevel.BEGINNER

            await db.execute(
                """
                UPDATE users
                SET mapping_level = :new_level
                WHERE id = :user_id
                """,
                {"new_level": new_level.value, "user_id": user_id},
            )
            logger.warning(
                f"[{user.username}-{user_id}] Downgraded to {new_level.name} ({changeset_count} changesets)"
            )
            downgraded_users.append((user.username, user_id, new_level.name))

        except OSMServiceError:
            logger.error(f"[{user_id}] Failed to fetch OSM details. Skipping.")
        except Exception as e:
            logger.exception(f"[{user_id}] Unexpected error: {e}")

    await db_connection.disconnect()

    if downgraded_users:
        logger.info("\n--- Downgraded Users ---")
        for username, user_id, new_level in downgraded_users:
            print(f"{username} (ID: {user_id}) → {new_level}")
    else:
        logger.info("\nNo users were downgraded.")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Fix incorrectly advanced mappers.")
    parser.add_argument(
        "--exclude",
        help="Comma-separated list of user IDs to exclude",
        default="",
    )
    args = parser.parse_args()
    exclude_ids = (
        list(map(int, args.exclude.split(","))) if args.exclude.strip() else []
    )
    asyncio.run(fix_advanced_users(exclude_ids=exclude_ids))
