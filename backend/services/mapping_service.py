import datetime
import xml.etree.ElementTree as ET

from databases import Database
from fastapi import BackgroundTasks

from geoalchemy2 import WKBElement
from geoalchemy2.shape import to_shape
from loguru import logger

from backend.exceptions import NotFound
from backend.models.dtos.mapping_dto import (
    ExtendLockTimeDTO,
    LockTaskDTO,
    MappedTaskDTO,
    StopMappingTaskDTO,
    TaskCommentDTO,
    TaskDTO,
)
from backend.models.postgis.statuses import MappingNotAllowed
from backend.models.postgis.task import Task, TaskAction, TaskHistory, TaskStatus
from backend.models.postgis.utils import UserLicenseError
from backend.services.messaging.message_service import MessageService
from backend.services.project_service import ProjectService
from backend.services.stats_service import StatsService


class MappingServiceError(Exception):
    """Custom Exception to notify callers an error occurred when handling mapping"""

    def __init__(self, message):
        logger.debug(message)


class MappingService:
    @staticmethod
    async def get_task(task_id: int, project_id: int, db: Database) -> Task:
        """
        Get task from DB
        :raises: NotFound
        """
        task = await Task.get(task_id, project_id, db)
        if not task:
            raise NotFound(
                sub_code="TASK_NOT_FOUND", project_id=project_id, task_id=task_id
            )
        return task

    @staticmethod
    async def get_task_as_dto(
        task_id: int,
        project_id: int,
        db,
        preferred_local: str = "en",
    ) -> TaskDTO:
        """Get task as DTO for transmission over API"""
        task = await Task.exists(task_id, project_id, db)
        if not task:
            raise NotFound(
                sub_code="TASK_NOT_FOUND", project_id=project_id, task_id=task_id
            )
        task_dto = await Task.as_dto_with_instructions(
            task_id, project_id, db, preferred_local
        )
        return task_dto

    @staticmethod
    async def _is_task_undoable(
        logged_in_user_id: int, task: dict, db: Database
    ) -> bool:
        """Determines if the current task status can be undone by the logged in user"""
        if logged_in_user_id and TaskStatus(task.task_status) not in [
            TaskStatus.LOCKED_FOR_MAPPING,
            TaskStatus.LOCKED_FOR_VALIDATION,
            TaskStatus.READY,
        ]:
            last_action = await TaskHistory.get_last_action(
                task.project_id, task.id, db
            )
            # User requesting task made the last change, so they are allowed to undo it.
            is_user_permitted, _ = await ProjectService.is_user_permitted_to_validate(
                task.project_id, logged_in_user_id, db
            )
            if last_action.user_id == logged_in_user_id or is_user_permitted:
                return True
        return False

    @staticmethod
    async def lock_task_for_mapping(
        lock_task_dto: LockTaskDTO, db: Database
    ) -> TaskDTO:
        """
        Sets the task_locked status to locked so no other user can work on it
        :param lock_task_dto: DTO with data needed to lock the task
        :raises TaskServiceError
        :return: Updated task, or None if not found
        """

        task = await MappingService.get_task(
            lock_task_dto.task_id, lock_task_dto.project_id, db
        )

        if task.locked_by != lock_task_dto.user_id:
            if not Task.is_mappable(task):
                raise MappingServiceError(
                    "InvalidTaskState- Task in invalid state for mapping"
                )
            user_can_map, error_reason = await ProjectService.is_user_permitted_to_map(
                lock_task_dto.project_id, lock_task_dto.user_id, db
            )
            if not user_can_map:
                if error_reason == MappingNotAllowed.USER_NOT_ACCEPTED_LICENSE:
                    raise UserLicenseError("User must accept license to map this task")
                elif error_reason == MappingNotAllowed.USER_NOT_ON_ALLOWED_LIST:
                    raise MappingServiceError(
                        "UserNotAllowed- User not on allowed list"
                    )
                elif error_reason == MappingNotAllowed.PROJECT_NOT_PUBLISHED:
                    raise MappingServiceError(
                        "ProjectNotPublished- Project is not published"
                    )
                elif error_reason == MappingNotAllowed.USER_ALREADY_HAS_TASK_LOCKED:
                    raise MappingServiceError(
                        "UserAlreadyHasTaskLocked- User already has task locked"
                    )
                else:
                    raise MappingServiceError(
                        f"{error_reason}- Mapping not allowed because: {error_reason}"
                    )

        await Task.lock_task_for_mapping(
            lock_task_dto.task_id, lock_task_dto.project_id, lock_task_dto.user_id, db
        )
        return await Task.as_dto_with_instructions(
            lock_task_dto.task_id,
            lock_task_dto.project_id,
            db,
            lock_task_dto.preferred_locale,
        )

    @staticmethod
    async def unlock_task_after_mapping(
        mapped_task: MappedTaskDTO,
        db: Database,
        background_tasks: BackgroundTasks,
    ) -> TaskDTO:
        """Unlocks the task and sets the task history appropriately"""
        # Fetch the task locked by the user
        task = await MappingService.get_task_locked_by_user(
            mapped_task.project_id, mapped_task.task_id, mapped_task.user_id, db
        )
        # Validate the new state
        new_state = TaskStatus[mapped_task.status.upper()]
        if new_state not in [
            TaskStatus.MAPPED,
            TaskStatus.BADIMAGERY,
            TaskStatus.READY,
        ]:
            raise MappingServiceError(
                "InvalidUnlockState - Can only set status to MAPPED, BADIMAGERY, READY after mapping"
            )
        last_state = await TaskHistory.get_last_status(
            mapped_task.project_id, mapped_task.task_id, db
        )
        await StatsService.update_stats_after_task_state_change(
            mapped_task.project_id, mapped_task.user_id, last_state, new_state, db
        )
        if mapped_task.comment:
            await MessageService.send_message_after_comment(
                mapped_task.user_id,
                mapped_task.comment,
                task.id,
                mapped_task.project_id,
                db,
            )
        # Unlock the task and change its state
        await Task.unlock_task(
            task_id=mapped_task.task_id,
            project_id=mapped_task.project_id,
            user_id=mapped_task.user_id,
            new_state=new_state,
            db=db,
            comment=mapped_task.comment,
        )
        # Send email on project progress
        background_tasks.add_task(
            ProjectService.send_email_on_project_progress, mapped_task.project_id
        )

        return await Task.as_dto_with_instructions(
            task_id=mapped_task.task_id,
            project_id=mapped_task.project_id,
            db=db,
            preferred_locale=mapped_task.preferred_locale,
        )

    @staticmethod
    async def stop_mapping_task(stop_task: StopMappingTaskDTO, db: Database) -> TaskDTO:
        """Unlocks the task and revert the task status to the last one"""
        task = await MappingService.get_task_locked_by_user(
            stop_task.project_id, stop_task.task_id, stop_task.user_id, db
        )

        if stop_task.comment:
            # Parses comment to see if any users have been @'d
            await MessageService.send_message_after_comment(
                stop_task.user_id, stop_task.comment, task.id, stop_task.project_id, db
            )
        await Task.reset_lock(
            task.id,
            stop_task.project_id,
            task.task_status,
            stop_task.user_id,
            stop_task.comment,
            db,
        )
        return await Task.as_dto_with_instructions(
            task.id, stop_task.project_id, db, stop_task.preferred_locale
        )

    @staticmethod
    async def get_task_locked_by_user(
        project_id: int, task_id: int, user_id: int, db: Database
    ):
        """Returns task specified by project id and task id if found and locked for mapping by user"""
        query = """
            SELECT * FROM tasks
            WHERE id = :task_id AND project_id = :project_id
        """
        task = await db.fetch_one(
            query, values={"task_id": task_id, "project_id": project_id}
        )
        if task is None:
            raise NotFound(
                status_code=404,
                sub_code="TASK_NOT_FOUND",
                project_id=project_id,
                task_id=task_id,
            )

        if task.task_status != TaskStatus.LOCKED_FOR_MAPPING.value:
            raise MappingServiceError(
                "LockBeforeUnlocking- Status must be LOCKED_FOR_MAPPING to unlock"
            )

        if task.locked_by != user_id:
            raise MappingServiceError(
                "TaskNotOwned- Attempting to unlock a task owned by another user"
            )

        return task

    @staticmethod
    async def add_task_comment(task_comment: TaskCommentDTO, db: Database) -> TaskDTO:
        """Adds the comment to the task history"""
        # Check if project exists
        await ProjectService.exists(task_comment.project_id, db)

        task = await Task.get(task_comment.task_id, task_comment.project_id, db)
        if task is None:
            raise NotFound(
                sub_code="TASK_NOT_FOUND",
                project_id=task_comment.project_id,
                task_id=task_comment.task_id,
            )

        await Task.set_task_history(
            task_id=task_comment.task_id,
            project_id=task_comment.project_id,
            user_id=task_comment.user_id,
            action=TaskAction.COMMENT,
            db=db,
            comment=task_comment.comment,
        )
        # Parse comment to see if any users have been @'d
        await MessageService.send_message_after_comment(
            task_comment.user_id,
            task_comment.comment,
            task.id,
            task_comment.project_id,
            db,
        )
        return await Task.as_dto_with_instructions(
            task_comment.task_id,
            task_comment.project_id,
            db,
            task_comment.preferred_locale,
        )

    @staticmethod
    async def generate_gpx(
        project_id: int, task_ids_str: str, db: Database, timestamp=None
    ):
        """
        Creates a GPX file for supplied tasks.  Timestamp is for unit testing only.
        You can use the following URL to test locally:
        http://www.openstreetmap.org/edit?editor=id&#map=11/31.50362930069913/34.628906243797054&comment=CHANGSET_COMMENT&gpx=http://localhost:5000/api/v2/projects/{project_id}/tasks/queries/gpx%3Ftasks=2
        """

        if timestamp is None:
            timestamp = datetime.datetime.utcnow()

        root = ET.Element(
            "gpx",
            attrib=dict(
                version="1.1",
                creator="HOT Tasking Manager",
                xmlns="http://www.topografix.com/GPX/1/1",
            ),
        )

        # Create GPX Metadata element
        metadata = ET.Element("metadata")
        link = ET.SubElement(
            metadata,
            "link",
            attrib=dict(href="https://github.com/hotosm/tasking-manager"),
        )
        ET.SubElement(link, "text").text = "HOT Tasking Manager"
        ET.SubElement(metadata, "time").text = timestamp.isoformat()
        root.append(metadata)

        # Create trk element
        trk = ET.Element("trk")
        root.append(trk)
        ET.SubElement(trk, "name").text = (
            f"Task for project {project_id}. Do not edit outside of this area!"
        )

        # Construct trkseg elements
        if task_ids_str is not None:
            task_ids = list(map(int, task_ids_str.split(",")))
            tasks = await Task.get_tasks(project_id, task_ids, db)
            if not tasks or len(tasks) == 0:
                raise NotFound(
                    sub_code="TASKS_NOT_FOUND", project_id=project_id, task_ids=task_ids
                )
        else:
            tasks = await Task.get_all_tasks(project_id, db)
            if not tasks or len(tasks) == 0:
                raise NotFound(sub_code="TASKS_NOT_FOUND", project_id=project_id)

        for task in tasks:
            # task_geom = shape.to_shape(task.geometry)
            if isinstance(task["geometry"], (bytes, str)):
                task_geom = to_shape(WKBElement(task["geometry"], srid=4326))
            else:
                raise ValueError("Invalid geometry format")
            for poly in task_geom.geoms:
                trkseg = ET.SubElement(trk, "trkseg")
                for point in poly.exterior.coords:
                    ET.SubElement(
                        trkseg,
                        "trkpt",
                        attrib=dict(lon=str(point[0]), lat=str(point[1])),
                    )
                    wpt = ET.Element(
                        "wpt", attrib=dict(lon=str(point[0]), lat=str(point[1]))
                    )
                    root.append(wpt)

        xml_gpx = ET.tostring(root, encoding="utf8")
        return xml_gpx

    @staticmethod
    async def generate_osm_xml(project_id: int, task_ids_str: str, db: Database) -> str:
        """Generate xml response suitable for loading into JOSM.  A sample output file is in
        /backend/helpers/testfiles/osm-sample.xml"""
        # Note XML created with upload No to ensure it will be rejected by OSM if uploaded by mistake
        root = ET.Element(
            "osm",
            attrib=dict(version="0.6", upload="never", creator="HOT Tasking Manager"),
        )
        if task_ids_str:
            task_ids = list(map(int, task_ids_str.split(",")))
            tasks = await Task.get_tasks(project_id, task_ids, db)
            if not tasks or len(tasks) == 0:
                raise NotFound(
                    sub_code="TASKS_NOT_FOUND", project_id=project_id, task_ids=task_ids
                )
        else:
            tasks = await Task.get_all_tasks(project_id, db)
            if not tasks or len(tasks) == 0:
                raise NotFound(sub_code="TASKS_NOT_FOUND", project_id=project_id)

        fake_id = -1  # We use fake-ids to ensure XML will not be validated by OSM
        for task in tasks:
            if isinstance(task["geometry"], (bytes, str)):
                task_geom = to_shape(WKBElement(task["geometry"], srid=4326))
            else:
                raise ValueError("Invalid geometry format")
            way = ET.SubElement(
                root,
                "way",
                attrib=dict(id=str((task.id * -1)), action="modify", visible="true"),
            )
            for poly in task_geom.geoms:
                for point in poly.exterior.coords:
                    ET.SubElement(
                        root,
                        "node",
                        attrib=dict(
                            action="modify",
                            visible="true",
                            id=str(fake_id),
                            lon=str(point[0]),
                            lat=str(point[1]),
                        ),
                    )
                    ET.SubElement(way, "nd", attrib=dict(ref=str(fake_id)))
                    fake_id -= 1

        xml_gpx = ET.tostring(root, encoding="utf8")
        return xml_gpx

    @staticmethod
    async def undo_mapping(
        project_id: int,
        task_id: int,
        user_id: int,
        db: Database,
        preferred_locale: str = "en",
    ) -> TaskDTO:
        """Allows a user to Undo the task state they updated"""
        task = await MappingService.get_task(task_id, project_id, db)
        if not await MappingService._is_task_undoable(user_id, task, db):
            raise MappingServiceError(
                "UndoPermissionError- Undo not allowed for this user"
            )
        current_state = TaskStatus(task.task_status)
        # Set the state to the previous state in the workflow
        if current_state == TaskStatus.VALIDATED:
            undo_state = TaskStatus.MAPPED
        elif current_state == TaskStatus.BADIMAGERY:
            undo_state = TaskStatus.READY
        elif current_state == TaskStatus.MAPPED:
            undo_state = TaskStatus.READY
        else:
            undo_state = await TaskHistory.get_last_status(
                project_id, task_id, db, True
            )

        # Refer to last action for user of it.
        last_action = await TaskHistory.get_last_action(project_id, task_id, db)

        await StatsService.update_stats_after_task_state_change(
            project_id, last_action.user_id, current_state, undo_state, db, "undo"
        )
        await Task.unlock_task(
            task_id=task_id,
            project_id=project_id,
            user_id=user_id,
            new_state=undo_state,
            db=db,
            comment=f"Undo state from {current_state.name} to {undo_state.name}",
            undo=True,
        )
        return await Task.as_dto_with_instructions(
            task_id, project_id, db, preferred_locale
        )

    @staticmethod
    async def map_all_tasks(project_id: int, user_id: int, db: Database):
        """Marks all tasks on a project as mapped using raw SQL queries"""

        query = """
            SELECT id, task_status
            FROM tasks
            WHERE project_id = :project_id
            AND task_status NOT IN (:bad_imagery, :mapped, :validated)
        """
        tasks_to_map = await db.fetch_all(
            query=query,
            values={
                "project_id": project_id,
                "bad_imagery": TaskStatus.BADIMAGERY.value,
                "mapped": TaskStatus.MAPPED.value,
                "validated": TaskStatus.VALIDATED.value,
            },
        )

        for task in tasks_to_map:
            task_id = task["id"]
            current_status = TaskStatus(task["task_status"])

            # Lock the task for mapping if it's not already locked
            if current_status not in [
                TaskStatus.LOCKED_FOR_MAPPING,
                TaskStatus.LOCKED_FOR_VALIDATION,
            ]:
                await Task.lock_task_for_mapping(task_id, project_id, user_id, db)

            # Unlock the task and set its status to MAPPED
            await Task.unlock_task(
                task_id=task_id,
                project_id=project_id,
                user_id=user_id,
                new_state=TaskStatus.MAPPED,
                db=db,
            )

        project_update_query = """
            UPDATE projects
            SET tasks_mapped = (total_tasks - tasks_bad_imagery - tasks_validated)
            WHERE id = :project_id
        """
        await db.execute(query=project_update_query, values={"project_id": project_id})

    @staticmethod
    async def reset_all_badimagery(project_id: int, user_id: int, db: Database):
        """Marks all bad imagery tasks as ready for mapping and resets the bad imagery counter"""

        # Fetch all tasks with status BADIMAGERY for the given project
        badimagery_query = """
            SELECT id FROM tasks
            WHERE task_status = :task_status AND project_id = :project_id
        """
        badimagery_tasks = await db.fetch_all(
            query=badimagery_query,
            values={
                "task_status": TaskStatus.BADIMAGERY.value,
                "project_id": project_id,
            },
        )
        for task in badimagery_tasks:
            task_id = task["id"]
            await Task.lock_task_for_mapping(task_id, project_id, user_id, db)
            await Task.unlock_task(task_id, project_id, user_id, TaskStatus.READY, db)

        # Reset bad imagery counter in the project
        reset_query = """
            UPDATE projects
            SET tasks_bad_imagery = 0
            WHERE id = :project_id
        """
        await db.execute(query=reset_query, values={"project_id": project_id})

    @staticmethod
    async def lock_time_can_be_extended(
        project_id: int, task_id: int, user_id: int, db: Database
    ):
        task = await Task.get(task_id, project_id, db)
        if task is None:
            raise NotFound(
                sub_code="TASK_NOT_FOUND", project_id=project_id, task_id=task_id
            )

        if TaskStatus(task.task_status) not in [
            TaskStatus.LOCKED_FOR_MAPPING,
            TaskStatus.LOCKED_FOR_VALIDATION,
        ]:
            raise MappingServiceError(
                f"TaskStatusNotLocked- Task {task_id} status is not LOCKED_FOR_MAPPING or LOCKED_FOR_VALIDATION."
            )
        if task.locked_by != user_id:
            raise MappingServiceError(
                "LockedByAnotherUser- Task is locked by another user."
            )

    @staticmethod
    async def extend_task_lock_time(extend_dto: ExtendLockTimeDTO, db: Database):
        """
        Extends expiry time of locked tasks.
        :raises ValidatorServiceError
        """
        # Validate each task before extending lock time
        for task_id in extend_dto.task_ids:
            await MappingService.lock_time_can_be_extended(
                extend_dto.project_id, task_id, extend_dto.user_id, db
            )

        # Extend lock time for validated tasks
        for task_id in extend_dto.task_ids:
            task = await Task.get(task_id, extend_dto.project_id, db)
            action = (
                TaskAction.EXTENDED_FOR_MAPPING
                if task["task_status"] == TaskStatus.LOCKED_FOR_MAPPING
                else TaskAction.EXTENDED_FOR_VALIDATION
            )

            # Update the duration of the lock/extension before creating new history
            last_history = TaskHistory.get_last_action(task.project_id, task.id)
            # To reset a lock the last action must have been either lock or extension
            last_action = TaskAction[last_history["result"][0]["action"]]
            await TaskHistory.update_task_locked_with_duration(
                task_id,
                extend_dto.project_id,
                last_action,
                extend_dto.user_id,
                db,
            )
            await Task.set_task_history(
                task_id, extend_dto.project_id, extend_dto.user_id, action, db
            )
