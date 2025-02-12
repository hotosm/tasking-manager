import datetime
import xml.etree.ElementTree as ET

# from flask import current_app
from geoalchemy2 import shape

from backend.exceptions import NotFound
from backend.models.dtos.mapping_dto import (
    ExtendLockTimeDTO,
    TaskDTO,
    MappedTaskDTO,
    LockTaskDTO,
    StopMappingTaskDTO,
    TaskCommentDTO,
)
from backend.models.postgis.statuses import MappingNotAllowed
from backend.models.postgis.task import Task, TaskStatus, TaskHistory, TaskAction
from backend.models.postgis.utils import UserLicenseError
from backend.services.messaging.message_service import MessageService
from backend.services.project_service import ProjectService
from backend.services.stats_service import StatsService
from databases import Database


class MappingServiceError(Exception):
    """Custom Exception to notify callers an error occurred when handling mapping"""

    # Log the error here.
    pass

    # def __init__(self, message):
    #     if current_app:
    #         current_app.logger.debug(message)


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
    def _is_task_undoable(logged_in_user_id: int, task: Task) -> bool:
        """Determines if the current task status can be undone by the logged in user"""
        # Test to see if user can undo status on this task
        if logged_in_user_id and TaskStatus(task.task_status) not in [
            TaskStatus.LOCKED_FOR_MAPPING,
            TaskStatus.LOCKED_FOR_VALIDATION,
            TaskStatus.READY,
        ]:
            last_action = TaskHistory.get_last_action(task.project_id, task.id)

            # User requesting task made the last change, so they are allowed to undo it.
            is_user_permitted, _ = ProjectService.is_user_permitted_to_validate(
                task.project_id, logged_in_user_id
            )
            if last_action.user_id == int(logged_in_user_id) or is_user_permitted:
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
            # TODO Handle error exceptions..
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
    def unlock_task_after_mapping(mapped_task: MappedTaskDTO) -> TaskDTO:
        """Unlocks the task and sets the task history appropriately"""
        task = MappingService.get_task_locked_by_user(
            mapped_task.project_id, mapped_task.task_id, mapped_task.user_id
        )

        new_state = TaskStatus[mapped_task.status.upper()]

        if new_state not in [
            TaskStatus.MAPPED,
            TaskStatus.BADIMAGERY,
            TaskStatus.READY,
        ]:
            raise MappingServiceError(
                "InvalidUnlockState- Can only set status to MAPPED, BADIMAGERY, READY after mapping"
            )

        # Update stats around the change of state
        last_state = TaskHistory.get_last_status(
            mapped_task.project_id, mapped_task.task_id
        )
        StatsService.update_stats_after_task_state_change(
            mapped_task.project_id, mapped_task.user_id, last_state, new_state
        )

        if mapped_task.comment:
            # Parses comment to see if any users have been @'d
            MessageService.send_message_after_comment(
                mapped_task.user_id,
                mapped_task.comment,
                task.id,
                mapped_task.project_id,
            )

        task.unlock_task(mapped_task.user_id, new_state, mapped_task.comment)
        ProjectService.send_email_on_project_progress(mapped_task.project_id)
        return task.as_dto_with_instructions(mapped_task.preferred_locale)

    @staticmethod
    def stop_mapping_task(stop_task: StopMappingTaskDTO) -> TaskDTO:
        """Unlocks the task and revert the task status to the last one"""
        task = MappingService.get_task_locked_by_user(
            stop_task.project_id, stop_task.task_id, stop_task.user_id
        )

        if stop_task.comment:
            # Parses comment to see if any users have been @'d
            MessageService.send_message_after_comment(
                stop_task.user_id, stop_task.comment, task.id, stop_task.project_id
            )

        task.reset_lock(stop_task.user_id, stop_task.comment)
        return task.as_dto_with_instructions(stop_task.preferred_locale)

    @staticmethod
    def get_task_locked_by_user(project_id: int, task_id: int, user_id: int) -> Task:
        """
        Returns task specified by project id and task id if found and locked for mapping by user
        :raises: MappingServiceError
        """
        task = MappingService.get_task(task_id, project_id)
        if task is None:
            raise NotFound(
                sub_code="TASK_NOT_FOUND", project_id=project_id, task_id=task_id
            )
        current_state = TaskStatus(task.task_status)
        if current_state != TaskStatus.LOCKED_FOR_MAPPING:
            raise MappingServiceError(
                "LockBeforeUnlocking- Status must be LOCKED_FOR_MAPPING to unlock"
            )
        if task.locked_by != user_id:
            raise MappingServiceError(
                "TaskNotOwned- Attempting to unlock a task owned by another user"
            )
        return task

    @staticmethod
    async def add_task_comment(task_comment: TaskCommentDTO) -> TaskDTO:
        """Adds the comment to the task history"""
        # Check if project exists
        await ProjectService.exists(task_comment.project_id)

        task = Task.get(task_comment.task_id, task_comment.project_id)
        if task is None:
            raise NotFound(
                sub_code="TASK_NOT_FOUND",
                project_id=task_comment.project_id,
                task_id=task_comment.task_id,
            )

        task.set_task_history(
            TaskAction.COMMENT, task_comment.user_id, task_comment.comment
        )
        # Parse comment to see if any users have been @'d
        MessageService.send_message_after_comment(
            task_comment.user_id, task_comment.comment, task.id, task_comment.project_id
        )
        task.update()
        return task.as_dto_with_instructions(task_comment.preferred_locale)

    @staticmethod
    def generate_gpx(project_id: int, task_ids_str: str, timestamp=None):
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
        ET.SubElement(
            trk, "name"
        ).text = f"Task for project {project_id}. Do not edit outside of this area!"

        # Construct trkseg elements
        if task_ids_str is not None:
            task_ids = list(map(int, task_ids_str.split(",")))
            tasks = Task.get_tasks(project_id, task_ids)
            if not tasks or len(tasks) == 0:
                raise NotFound(
                    sub_code="TASKS_NOT_FOUND", project_id=project_id, task_ids=task_ids
                )
        else:
            tasks = Task.get_all_tasks(project_id)
            if not tasks or len(tasks) == 0:
                raise NotFound(sub_code="TASKS_NOT_FOUND", project_id=project_id)

        for task in tasks:
            task_geom = shape.to_shape(task.geometry)
            for poly in task_geom.geoms:
                trkseg = ET.SubElement(trk, "trkseg")
                for point in poly.exterior.coords:
                    ET.SubElement(
                        trkseg,
                        "trkpt",
                        attrib=dict(lon=str(point[0]), lat=str(point[1])),
                    )

                    # Append wpt elements to end of doc
                    wpt = ET.Element(
                        "wpt", attrib=dict(lon=str(point[0]), lat=str(point[1]))
                    )
                    root.append(wpt)

        xml_gpx = ET.tostring(root, encoding="utf8")
        return xml_gpx

    @staticmethod
    def generate_osm_xml(project_id: int, task_ids_str: str) -> str:
        """Generate xml response suitable for loading into JOSM.  A sample output file is in
        /backend/helpers/testfiles/osm-sample.xml"""
        # Note XML created with upload No to ensure it will be rejected by OSM if uploaded by mistake
        root = ET.Element(
            "osm",
            attrib=dict(version="0.6", upload="never", creator="HOT Tasking Manager"),
        )

        if task_ids_str:
            task_ids = list(map(int, task_ids_str.split(",")))
            tasks = Task.get_tasks(project_id, task_ids)
            if not tasks or len(tasks) == 0:
                raise NotFound(
                    sub_code="TASKS_NOT_FOUND", project_id=project_id, task_ids=task_ids
                )
        else:
            tasks = Task.get_all_tasks(project_id)
            if not tasks or len(tasks) == 0:
                raise NotFound(sub_code="TASKS_NOT_FOUND", project_id=project_id)

        fake_id = -1  # We use fake-ids to ensure XML will not be validated by OSM
        for task in tasks:
            task_geom = shape.to_shape(task.geometry)
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
    def undo_mapping(
        project_id: int, task_id: int, user_id: int, preferred_locale: str = "en"
    ) -> TaskDTO:
        """Allows a user to Undo the task state they updated"""
        task = MappingService.get_task(task_id, project_id)
        if not MappingService._is_task_undoable(user_id, task):
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
            undo_state = TaskHistory.get_last_status(project_id, task_id, True)

        # Refer to last action for user of it.
        last_action = TaskHistory.get_last_action(project_id, task_id)

        StatsService.update_stats_after_task_state_change(
            project_id, last_action.user_id, current_state, undo_state, "undo"
        )

        task.unlock_task(
            user_id,
            undo_state,
            f"Undo state from {current_state.name} to {undo_state.name}",
            True,
        )
        # Reset the user who mapped/validated the task
        if current_state.name == "MAPPED":
            task.mapped_by = None
        elif current_state.name == "VALIDATED":
            task.validated_by = None
        task.update()
        return task.as_dto_with_instructions(preferred_locale)

    @staticmethod
    def map_all_tasks(project_id: int, user_id: int):
        """Marks all tasks on a project as mapped"""
        tasks_to_map = Task.query.filter(
            Task.project_id == project_id,
            Task.task_status.notin_(
                [
                    TaskStatus.BADIMAGERY.value,
                    TaskStatus.MAPPED.value,
                    TaskStatus.VALIDATED.value,
                ]
            ),
        ).all()

        for task in tasks_to_map:
            if TaskStatus(task.task_status) not in [
                TaskStatus.LOCKED_FOR_MAPPING,
                TaskStatus.LOCKED_FOR_VALIDATION,
            ]:
                # Only lock tasks that are not already locked to avoid double lock issue
                task.lock_task_for_mapping(user_id)

            task.unlock_task(user_id, new_state=TaskStatus.MAPPED)

        # Set counters to fully mapped
        project = ProjectService.get_project_by_id(project_id)
        project.tasks_mapped = (
            project.total_tasks - project.tasks_bad_imagery - project.tasks_validated
        )
        project.save()

    @staticmethod
    def reset_all_badimagery(project_id: int, user_id: int):
        """Marks all bad imagery tasks ready for mapping"""
        badimagery_tasks = Task.query.filter(
            Task.task_status == TaskStatus.BADIMAGERY.value,
            Task.project_id == project_id,
        ).all()

        for task in badimagery_tasks:
            task.lock_task_for_mapping(user_id)
            task.unlock_task(user_id, new_state=TaskStatus.READY)

        # Reset bad imagery counter
        project = ProjectService.get_project_by_id(project_id)
        project.tasks_bad_imagery = 0
        project.save()

    @staticmethod
    def lock_time_can_be_extended(project_id, task_id, user_id):
        task = Task.get(task_id, project_id)
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
    def extend_task_lock_time(extend_dto: ExtendLockTimeDTO):
        """
        Extends expiry time of locked tasks
        :raises ValidatorServiceError
        """
        # Loop supplied tasks to check they can all be locked for validation
        tasks_to_extend = []
        for task_id in extend_dto.task_ids:
            MappingService.lock_time_can_be_extended(
                extend_dto.project_id, task_id, extend_dto.user_id
            )
            tasks_to_extend.append(task_id)

        # # Lock all tasks for validation
        for task_id in tasks_to_extend:
            task = Task.get(task_id, extend_dto.project_id)
            action = TaskAction.EXTENDED_FOR_MAPPING
            if task.task_status == TaskStatus.LOCKED_FOR_VALIDATION:
                action = TaskAction.EXTENDED_FOR_VALIDATION

            TaskHistory.update_task_locked_with_duration(
                task_id,
                extend_dto.project_id,
                TaskStatus(task.task_status),
                extend_dto.user_id,
            )
            task.set_task_history(action, extend_dto.user_id)
            task.update()
