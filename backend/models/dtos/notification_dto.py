from datetime import datetime

from pydantic import BaseModel, Field


class NotificationDTO(BaseModel):
    """DTO used to define a notification count that will be sent to a user"""

    user_id: int = Field(alias="userId")
    date: datetime = Field(alias="date")
    unread_count: int = Field(alias="unreadCount")
