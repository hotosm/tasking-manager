from backend.models.dtos.stats_dto import Pagination
from pydantic import BaseModel, Field
from datetime import datetime
from typing import List, Optional


class MessageDTO(BaseModel):
    """DTO used to define a message that will be sent to a user"""

    message_id: int = Field(serialization_alias="messageId")
    subject: str
    message: str
    from_user_id: Optional[int] = Field(None, serialization_alias="fromUserId")
    from_username: Optional[str] = Field("", serialization_alias="fromUsername")
    display_picture_url: Optional[str] = Field("", serialization_alias="displayPictureUrl")
    project_id: Optional[int] = Field(None, serialization_alias="projectId")
    project_title: Optional[str] = Field(None, serialization_alias="projectTitle")
    task_id: Optional[int] = Field(None, serialization_alias="taskId")
    message_type: Optional[str] = Field(serialization_alias="messageType")
    sent_date: datetime = Field(None, serialization_alias="sentDate")
    read: bool = False


class MessagesDTO(BaseModel):
    """DTO used to return all user messages"""

    def __init__(self):
        """DTO constructor initialise all arrays to empty"""
        super().__init__()
        self.user_messages = []

    pagination: Pagination
    user_messages: List[MessageDTO] = Field(alias="userMessages")


class ChatMessageDTO(BaseModel):
    """DTO describing an individual project chat message"""

    id: Optional[int] = Field(None, alias="id", serialize_when_none=False)
    message: str = Field(required=True)
    user_id: int = Field(required=True, serialize_when_none=False)
    project_id: int = Field(required=True, serialize_when_none=False)
    picture_url: str = Field(default=None, alias="pictureUrl")
    timestamp: datetime
    username: str

    class Config:
        populate_by_name = True


class ProjectChatDTO(BaseModel):
    """DTO describing all chat messages on one project"""

    def __init__(self):
        """DTO constructor initialise all arrays to empty"""
        super().__init__()
        self.chat = []

    chat: Optional[List[ChatMessageDTO]] = None
    pagination: Optional[Pagination] = None
