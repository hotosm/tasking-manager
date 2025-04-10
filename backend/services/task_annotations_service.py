import datetime
import json

from databases import Database


class TaskAnnotationsService:
    @staticmethod
    async def add_or_update_annotation(
        annotation, project_id, annotation_type, db: Database
    ):
        """Takes a JSON of tasks and creates or updates annotations in the database."""

        task_id = annotation["taskId"]
        source = annotation.get("annotationSource")
        markdown = annotation.get("annotationMarkdown")
        properties = json.dumps(annotation["properties"])
        updated_timestamp = datetime.datetime.utcnow()

        query = """
            SELECT id FROM task_annotations
            WHERE task_id = :task_id AND project_id = :project_id AND annotation_type = :annotation_type
        """
        existing_annotation = await db.fetch_one(
            query,
            values={
                "task_id": task_id,
                "project_id": project_id,
                "annotation_type": annotation_type,
            },
        )

        if existing_annotation:
            update_query = """
                UPDATE task_annotations
                SET properties = :properties, updated_timestamp = :updated_timestamp
                WHERE id = :id
            """
            await db.execute(
                update_query,
                values={
                    "properties": properties,
                    "updated_timestamp": updated_timestamp,
                    "id": existing_annotation["id"],
                },
            )
        else:
            insert_query = """
                INSERT INTO task_annotations
                (task_id, project_id, annotation_type, properties, annotation_source,
                annotation_markdown, updated_timestamp)
                VALUES (:task_id, :project_id, :annotation_type, :properties, :source, :markdown, :updated_timestamp)
            """
            await db.execute(
                insert_query,
                values={
                    "task_id": task_id,
                    "project_id": project_id,
                    "annotation_type": annotation_type,
                    "properties": properties,
                    "source": source,
                    "markdown": markdown,
                    "updated_timestamp": updated_timestamp,
                },
            )
