from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel, Field

from backend.models.dtos.stats_dto import Pagination


class MessageDTO(BaseModel):
    """DTO used to define a message that will be sent to a user"""

    message_id: Optional[int] = Field(None, alias="messageId")
    subject: Optional[str] = Field(min_length=1, alias="subject")
    message: Optional[str] = Field(min_length=1, alias="message")
    from_user_id: Optional[int] = Field(alias="fromUserId")
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

        json_encoders = {datetime: lambda v: v.isoformat() + "Z" if v else None}


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

    id: Optional[int] = Field(None, alias="id")
    message: str = Field(required=True)
    user_id: int = Field(required=True)
    project_id: int = Field(required=True)
    picture_url: str = Field(default=None, alias="pictureUrl")
    timestamp: datetime
    username: str

    class Config:
        populate_by_name = True

    #     json_encoders = {
    #         datetime: lambda v: v.isoformat() + "Z" if v else None
    #     }


class ListChatMessageDTO(BaseModel):
    """DTO describing an individual project chat message"""

    id: Optional[int] = Field(None, alias="id")
    message: str = Field(required=True)
    picture_url: str = Field(default=None, alias="pictureUrl")
    timestamp: datetime
    username: str

    class Config:
        populate_by_name = True

        json_encoders = {datetime: lambda v: v.isoformat() + "Z" if v else None}


class ProjectChatDTO(BaseModel):
    """DTO describing all chat messages on one project"""

    def __init__(self):
        """DTO constructor initialise all arrays to empty"""
        super().__init__()
        self.chat = []

    chat: Optional[List[ListChatMessageDTO]] = None
    pagination: Optional[Pagination] = None
