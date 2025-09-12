import asyncio
import sys
import os
import logging
import argparse
from types import SimpleNamespace
from typing import List

from backend.db import db_connection
from backend.services.users.user_service import UserService
from backend.models.postgis.user import User

import httpx

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

MAX_CONCURRENT_WORKERS = int(os.getenv("MAX_CONCURRENT_WORKERS", "50"))
PROGRESS_PRINT_EVERY = int(os.getenv("PROGRESS_PRINT_EVERY", "1000"))
TASK_BATCH_SIZE = int(os.getenv("TASK_BATCH_SIZE", "5000"))

RETRIES = 2
RETRY_DELAY = 1.0


async def process_user(
    user_record,
    failed_users,
    failed_lock,
    users_updated_counter,
    counter_lock,
    semaphore,
):
    """
    Process a single user using its own DB connection from the pool.
    Calls UserService.check_and_update_mapper_level(user_id, conn).
    Retries on transient network/HTTP errors with simple fixed delay.
    """
    await semaphore.acquire()
    try:
        async with db_connection.database.connection() as conn:
            attempt = 0
            while True:
                attempt += 1
                try:
                    await UserService.check_and_update_mapper_level(
                        user_record.id, conn
                    )
                    break
                except (
                    httpx.ReadTimeout,
                    httpx.TransportError,
                    httpx.HTTPError,
                ) as exc:
                    if attempt >= RETRIES:
                        async with failed_lock:
                            failed_users.append(user_record.id)
                        logger.exception(
                            "Failed to update stats/mapper level for user %s after %d attempts",
                            user_record.id,
                            attempt,
                        )
                        break
                    else:
                        logger.warning(
                            "Transient error for user %s (attempt %d/%d): %s — retrying in %.1fs",
                            user_record.id,
                            attempt,
                            RETRIES,
                            exc.__class__.__name__,
                            RETRY_DELAY,
                        )
                        await asyncio.sleep(RETRY_DELAY)
                        continue
                except Exception:
                    async with failed_lock:
                        failed_users.append(user_record.id)
                    logger.exception(
                        "Failed to update stats/mapper level for user %s",
                        user_record.id,
                    )
                    break
    finally:
        async with counter_lock:
            users_updated_counter[0] += 1
            updated = users_updated_counter[0]
            if updated % PROGRESS_PRINT_EVERY == 0:
                logger.info(f"{updated} users updated")
        semaphore.release()


async def _fetch_users_only_missing(conn) -> List[SimpleNamespace]:
    """
    Return lightweight objects (id, username) for users missing user_stats entries.
    """
    users = await conn.fetch_all(
        query="""
        SELECT u.id, u.username
        FROM users u
        WHERE NOT EXISTS (
            SELECT 1 FROM user_stats s WHERE s.user_id = u.id
        )
        ORDER BY u.id
        """
    )
    return users


async def main(only_missing: bool):
    try:
        logger.info("Connecting to database...")
        await db_connection.connect()

        logger.info("Started updating mapper levels...")

        async with db_connection.database.connection() as conn:
            if only_missing:
                users = await _fetch_users_only_missing(conn)
            else:
                users = await User.get_all_users_not_paginated(conn)

        total_users = len(users)
        logger.info("Fetched %d users to process", total_users)

        failed_users = []
        failed_lock = asyncio.Lock()
        users_updated_counter = [0]
        counter_lock = asyncio.Lock()
        semaphore = asyncio.Semaphore(MAX_CONCURRENT_WORKERS)

        for start in range(0, total_users, TASK_BATCH_SIZE):
            end = min(start + TASK_BATCH_SIZE, total_users)
            batch = users[start:end]
            logger.info("Scheduling batch %d..%d (size=%d)", start + 1, end, len(batch))

            tasks = [
                asyncio.create_task(
                    process_user(
                        user_record,
                        failed_users,
                        failed_lock,
                        users_updated_counter,
                        counter_lock,
                        semaphore,
                    )
                )
                for user_record in batch
            ]

            await asyncio.gather(*tasks)

        users_updated = users_updated_counter[0]
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
    parser = argparse.ArgumentParser(description="Refresh mapper levels / user stats")
    parser.add_argument(
        "--only-missing",
        action="store_true",
        help="Process only users that do not have an entry in user_stats",
    )
    args = parser.parse_args()

    asyncio.run(main(only_missing=args.only_missing))
