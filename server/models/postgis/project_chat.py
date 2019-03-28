import bleach
from flask import current_app
from server import db
from server.models.postgis.user import User
from server.models.postgis.utils import timestamp, NotFound
from server.models.dtos.message_dto import ChatMessageDTO, ProjectChatDTO, Pagination


class ProjectChat(db.Model):
    """ Contains all project info localized into supported languages """
    __tablename__ = 'project_chat'
    id = db.Column(db.BigInteger, primary_key=True)
    project_id = db.Column(db.Integer, db.ForeignKey('projects.id'), index=True, nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    time_stamp = db.Column(db.DateTime, nullable=False, default=timestamp)
    message = db.Column(db.String, nullable=False)

    # Relationships
    posted_by = db.relationship(User, foreign_keys=[user_id])

    @classmethod
    def create_from_dto(cls, dto: ChatMessageDTO):
        """ Creates a new ProjectInfo class from dto, used from project edit """
        current_app.logger.debug('Create chat message from DTO')
        new_message = cls()
        new_message.project_id = dto.project_id
        new_message.user_id = dto.user_id

        # Use bleach to remove any potential mischief
        clean_message = bleach.clean(dto.message)
        clean_message = bleach.linkify(clean_message)
        new_message.message = clean_message

        db.session.add(new_message)
        return new_message

    @staticmethod
    def get_messages(project_id: int, page: int) -> ProjectChatDTO:
        """ Get all messages on the project """

        project_messages = ProjectChat.query.filter_by(project_id=project_id).order_by(
            ProjectChat.time_stamp.desc()).paginate(
            page, 50, True)

        if project_messages.total == 0:
            raise NotFound()

        dto = ProjectChatDTO()
        for message in project_messages.items:
            chat_dto = ChatMessageDTO()
            chat_dto.message = message.message
            chat_dto.username = message.posted_by.username
            chat_dto.timestamp = message.time_stamp

            dto.chat.append(chat_dto)

        dto.pagination = Pagination(project_messages)

        return dto
