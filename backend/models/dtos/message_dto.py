from backend.models.dtos.stats_dto import Pagination
from pydantic import BaseModel, Field
from datetime import datetime
from typing import List, Optional


class MessageDTO(BaseModel):
    """DTO used to define a message that will be sent to a user"""

    message_id: Optional[int] = Field(None, alias="messageId")
    subject: str = Field(min_length=1, alias="subject")
    message: str = Field(min_length=1, alias="message")
    from_user_id: int = Field(alias="fromUserId")
    from_username: Optional[str] = Field("", alias="fromUsername")
    display_picture_url: Optional[str] = Field("", alias="displayPictureUrl")
    project_id: Optional[int] = Field(None, alias="projectId")
    project_title: Optional[str] = Field(None, alias="projectTitle")
    task_id: Optional[int] = Field(None, alias="taskId")
    message_type: Optional[str] = Field(None, alias="messageType")
    sent_date: Optional[datetime] = Field(None, alias="sentDate")
    read: Optional[bool] = None

    class Config:
        populate_by_name = True


class MessagesDTO(BaseModel):
    """DTO used to return all user messages"""

    def __init__(self):
        """DTO constructor initialise all arrays to empty"""
        super().__init__()
        self.user_messages = []

    pagination: Optional[Pagination] = None
    user_messages: Optional[List[MessageDTO]] = Field([], alias="userMessages")

    class Config:
        populate_by_name = True


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
