import asyncio
import sys
import os
import logging
import argparse
from types import SimpleNamespace
from typing import List

from databases import Database
from backend.services.users.user_service import UserService
from backend.models.postgis.user import User
from backend.config import settings

import httpx

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Defaults come from env or fall back to sensible values
DEFAULT_MAX_CONCURRENT_WORKERS = int(os.getenv("MAX_CONCURRENT_WORKERS", "50"))
DEFAULT_TASK_BATCH_SIZE = int(os.getenv("TASK_BATCH_SIZE", "5000"))
PROGRESS_PRINT_EVERY = int(os.getenv("PROGRESS_PRINT_EVERY", "1000"))

RETRIES = 2
RETRY_DELAY = 1.0


async def process_user(
    user_record,
    script_db: Database,
    failed_users,
    failed_lock,
    users_updated_counter,
    counter_lock,
    semaphore,
):
    """
    Process a single user using its own DB connection from the script-local pool.
    Calls UserService.check_and_update_mapper_level(user_id, conn).
    Retries on transient network/HTTP errors with simple fixed delay.
    """
    await semaphore.acquire()
    try:
        async with script_db.connection() as conn:
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


async def main(
    only_missing: bool,
    workers: int,
    batch_size: int,
    script_db_min: int,
    script_db_max: int,
):
    try:
        db_url = settings.SQLALCHEMY_DATABASE_URI.unicode_string()

        script_db = Database(db_url, min_size=script_db_min, max_size=script_db_max)

        logger.info(
            "Connecting to script-local DB pool (min=%d max=%d)...",
            script_db_min,
            script_db_max,
        )
        await script_db.connect()

        logger.info("Started updating mapper levels...")
        logger.info(
            "Using %d concurrent workers, task batch size %d", workers, batch_size
        )

        async with script_db.connection() as conn:
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
        semaphore = asyncio.Semaphore(workers)

        for start in range(0, total_users, batch_size):
            end = min(start + batch_size, total_users)
            batch = users[start:end]
            logger.info("Scheduling batch %d..%d (size=%d)", start + 1, end, len(batch))

            tasks = [
                asyncio.create_task(
                    process_user(
                        user_record,
                        script_db,
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
        logger.info("Disconnecting from script-local DB...")
        try:
            await script_db.disconnect()
        except Exception:
            logger.exception("Error while disconnecting from script-local DB (ignored)")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Refresh mapper levels / user stats")
    parser.add_argument(
        "--only-missing",
        action="store_true",
        help="Process only users that do not have an entry in user_stats",
    )
    parser.add_argument(
        "--workers",
        "-w",
        type=int,
        default=DEFAULT_MAX_CONCURRENT_WORKERS,
        help=f"Number of concurrent workers (default {DEFAULT_MAX_CONCURRENT_WORKERS})",
    )
    parser.add_argument(
        "--batch-size",
        "-b",
        type=int,
        default=DEFAULT_TASK_BATCH_SIZE,
        help=f"Number of users scheduled per batch (default {DEFAULT_TASK_BATCH_SIZE})",
    )
    parser.add_argument(
        "--script-db-min",
        type=int,
        default=4,
        help="Script-local DB pool minimum size (default 4)",
    )
    parser.add_argument(
        "--script-db-max",
        type=int,
        default=8,
        help="Script-local DB pool maximum size (default 8)",
    )

    args = parser.parse_args()

    # Basic validation
    if args.workers <= 0:
        parser.error("--workers must be a positive integer")
    if args.batch_size <= 0:
        parser.error("--batch-size must be a positive integer")
    if args.script_db_min <= 0 or args.script_db_max <= 0:
        parser.error("--script-db-min and --script-db-max must be positive integers")
    if args.script_db_min > args.script_db_max:
        parser.error("--script-db-min cannot be greater than --script-db-max")

    asyncio.run(
        main(
            only_missing=args.only_missing,
            workers=args.workers,
            batch_size=args.batch_size,
            script_db_min=args.script_db_min,
            script_db_max=args.script_db_max,
        )
    )
