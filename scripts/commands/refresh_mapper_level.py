import asyncio
import sys
import os
from backend.db import db_connection
from backend.models.postgis.mapping_badge import MappingBadge
from backend.models.postgis.mapping_level import MappingLevel
from backend.services.users.user_service import UserService
from backend.models.postgis.user import User, UserNextLevel
import logging

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


async def main():
    try:
        logger.info("Connecting to database...")
        await db_connection.connect()
        db = db_connection.database

        logger.info("Started updating mapper levels...")
        users = await User.get_all_users_not_paginated(db)
        total_users = len(users)
        failed_users = []
        users_updated = 0

        for user in users:
            try:
                await UserService.check_and_update_mapper_level(user.id, db)
            except Exception:
                failed_users.append(user.id)
                logger.exception(
                    "Failed to update stats/mapper level for user %s",
                    user.id,
                )
                continue

            users_updated += 1
            if users_updated % 1000 == 0:
                logger.info(f"{users_updated} users updated of {total_users}")

        logger.info(f"Finished. Updated {users_updated} user mapper levels.")
        logger.info(f"Failed stats update for these users: {failed_users}.")

    except Exception:
        logger.exception("Error while refreshing mapper levels")
        raise
    finally:
        logger.info("Disconnecting from database...")
        try:
            await db_connection.disconnect()
        except Exception:
            logger.exception("Error while disconnecting from DB (ignored)")


if __name__ == "__main__":
    asyncio.run(main())
