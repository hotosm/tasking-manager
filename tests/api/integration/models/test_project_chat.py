from datetime import datetime

import pytest

from backend.models.dtos.message_dto import ChatMessageDTO
from backend.models.postgis.project_chat import ProjectChat


class FakeChatDB:
    """BD falsa para cubrir project_chat.py sin depender de datos reales."""

    def __init__(self):
        self.executed_queries = []
        self.fetch_all_calls = []
        self.fetch_val_calls = []
        self.fetch_one_calls = []
        self.message_id = 777

    async def execute(self, query=None, values=None, **kwargs):
        query = query or kwargs.get("query")
        values = values or kwargs.get("values")
        self.executed_queries.append((str(query), values))

        if "INSERT INTO project_chat" in str(query):
            return self.message_id

        return "executed"

    async def fetch_one(self, query=None, values=None, **kwargs):
        query = query or kwargs.get("query")
        values = values or kwargs.get("values")
        self.fetch_one_calls.append((str(query), values))

        return {
            "id": self.message_id,
            "project_id": 10,
            "user_id": 20,
            "timestamp": datetime(2026, 7, 9, 10, 0, 0),
            "time_stamp": datetime(2026, 7, 9, 10, 0, 0),
            "message": "<p><strong>Hello</strong> coverage</p>",
            "username": "coverage_user",
            "picture_url": "https://example.com/avatar.png",
        }

    async def fetch_all(self, query=None, values=None, **kwargs):
        query = query or kwargs.get("query")
        values = values or kwargs.get("values")
        self.fetch_all_calls.append((str(query), values))

        return [
            {
                "id": 1,
                "project_id": 10,
                "user_id": 20,
                "timestamp": datetime(2026, 7, 9, 10, 0, 0),
                "time_stamp": datetime(2026, 7, 9, 10, 0, 0),
                "message": "<p><strong>Hello</strong> coverage</p>",
                "username": "coverage_user",
                "picture_url": "https://example.com/avatar.png",
            }
        ]

    async def fetch_val(self, query=None, values=None, **kwargs):
        query = query or kwargs.get("query")
        values = values or kwargs.get("values")
        self.fetch_val_calls.append((str(query), values))
        return 1


@pytest.mark.anyio
class TestProjectChatCoverage:
    async def test_create_from_dto_sanitizes_markdown_and_saves_message(self):
        fake_db = FakeChatDB()

        dto = ChatMessageDTO(
            project_id=10,
            user_id=20,
            timestamp=datetime(2026, 7, 9, 10, 0, 0),
            username="coverage_user",
            message="**Hello** <script>alert('x')</script>",
        )

        message = await ProjectChat.create_from_dto(dto, fake_db)

        assert message.id == 777
        assert message.username == "coverage_user"
        assert message.message == "<p><strong>Hello</strong> coverage</p>"

        inserted_values = fake_db.executed_queries[0][1]

        assert inserted_values["project_id"] == 10
        assert inserted_values["user_id"] == 20
        assert "<script>" not in inserted_values["message"]
        assert "<strong>Hello</strong>" in inserted_values["message"]

    async def test_get_messages_returns_paginated_chat_dto(self):
        fake_db = FakeChatDB()

        result = await ProjectChat.get_messages(
            project_id=10,
            page=1,
            db=fake_db,
        )

        assert result.pagination.page == 1
        assert result.pagination.total == 1
        assert len(result.chat) == 1
        assert result.chat[0].message == "<p><strong>Hello</strong> coverage</p>"
        assert result.chat[0].username == "coverage_user"

    async def test_get_messages_uses_custom_page_and_offset(self):
        fake_db = FakeChatDB()

        result = await ProjectChat.get_messages(
            project_id=10,
            page=2,
            db=fake_db,
        )

        assert result.pagination.page == 2
        assert len(result.chat) == 1

        query, values = fake_db.fetch_all_calls[0]
        assert values["limit"] == 20
        assert values["offset"] == 20