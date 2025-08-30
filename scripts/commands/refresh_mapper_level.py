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
        users_updated = 0
        total_users = len(users)
        failed_usernames = []

        for user in users:
            try:
                user = await UserService.get_user_by_id(user.id, db)
                user_level = await MappingLevel.get_by_id(user.mapping_level, db)
                try:
                    stats = await UserService.get_and_save_stats(user.id, db)
                except Exception:
                    failed_usernames.append(user.username)
                    logger.exception(
                        "Failed to update stats for user %s — continuing with next user",
                        user.id,
                    )
                    continue

                try:
                    async with db.transaction():
                        badges = await MappingBadge.available_badges_for_user(
                            user.id, db
                        )
                        assignable_ids = []
                        for badge in badges:
                            if badge.all_requirements_satisfied(stats):
                                assignable_ids.append(badge.id)
                        await user.assign_badges(assignable_ids, db)

                        next_level = await MappingLevel.get_next(
                            user_level.ordering, db
                        )

                        if await MappingLevel.all_badges_satisfied(
                            next_level.id, user.id, db
                        ):
                            if next_level.approvals_required == 0:
                                await user.set_mapping_level(next_level, db)
                            else:
                                await UserNextLevel.nominate(user.id, next_level.id, db)
                except Exception:
                    logger.exception(
                        "Failed to update mapper level for user %s — stats updated, but skipping badges/level",
                        user.id,
                    )

            except Exception:
                failed_usernames.append(user.username)
                logger.exception(
                    "Failed to fetch stats and update mapper level for user %s — continuing with next user",
                    user.id,
                )
                continue

            users_updated += 1
            if users_updated % 1000 == 0:
                print(f"{users_updated} users updated of {total_users}")

        logger.info(f"Finished. Updated {users_updated} user mapper levels.")
        logger.info(f"Failed stats update for these users: {failed_usernames}.")

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
