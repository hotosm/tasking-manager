from server import db
from server.models.postgis.user import User
from server.models.postgis.utils import timestamp
from server.models.dtos.message_dto import ChatMessageDTO


class ProjectChat(db.Model):
    """ Contains all project info localized into supported languages """
    __tablename__ = 'project_chat'
    id = db.Column(db.BigInteger, primary_key=True)
    project_id = db.Column(db.Integer, db.ForeignKey('projects.id'), index=True, nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    time_stamp = db.Column(db.DateTime, nullable=False, default=timestamp)
    message = db.Column(db.String(250), nullable=False)

    # Relationships
    posted_by = db.relationship(User, foreign_keys=[user_id])

    @classmethod
    def create_from_dto(cls, dto: ChatMessageDTO):
        """ Creates a new ProjectInfo class from dto, used from project edit """
        new_message = cls()
        new_message.project_id = dto.project_id
        new_message.user_id = dto.user_id
        # TODO bleach input
        new_message.message = dto.message

        db.session.add(new_message)
        db.session.commit()
        return new_message
