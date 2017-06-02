from server import db
from server.models.dtos.message_dto import MessageDTO, MessagesDTO
from server.models.postgis.user import User
from server.models.postgis.utils import timestamp
from server.models.postgis.utils import NotFound


class Message(db.Model):
    """ Describes an individual Message a user can send """
    __tablename__ = "messages"

    id = db.Column(db.Integer, primary_key=True)
    message = db.Column(db.String)
    subject = db.Column(db.String)
    from_user_id = db.Column(db.BigInteger, db.ForeignKey('users.id'))
    to_user_id = db.Column(db.BigInteger, db.ForeignKey('users.id'), index=True)
    date = db.Column(db.DateTime, default=timestamp)
    read = db.Column(db.Boolean, default=False)

    # Relationships
    from_user = db.relationship(User, foreign_keys=[from_user_id])
    to_user = db.relationship(User, foreign_keys=[to_user_id], backref='messages')

    @classmethod
    def from_dto(cls, to_user_id: int, dto: MessageDTO):
        """ Creates new message from DTO """
        message = cls()
        message.subject = dto.subject
        message.message = dto.message
        message.from_user_id = dto.from_user_id
        message.to_user_id = to_user_id

        return message

    def as_dto(self) -> MessageDTO:
        """ Casts message object to DTO """
        dto = MessageDTO()
        dto.message_id = self.id
        dto.message = self.message
        dto.sent_date = self.date
        dto.read = self.read
        dto.subject = self.subject
        if self.from_user_id:
            dto.from_username = self.from_user.username

        return dto

    def add_message(self):
        """ Add message into current transaction - DO NOT COMMIT HERE AS MESSAGES ARE PART OF LARGER TRANSACTIONS"""
        db.session.add(self)

    def save(self):
        """ Save """
        db.session.add(self)
        db.session.commit()

    @staticmethod
    def get_all_contributors(project_id: int):
        """ Get all contributors to a project """
        query = '''SELECT mapped_by as contributors from tasks where project_id = {0} and  mapped_by is not null
                   UNION
                   SELECT validated_by from tasks where tasks.project_id = {0} and validated_by is not null'''.format(project_id)

        contributors = db.engine.execute(query)
        return contributors

    def mark_as_read(self):
        """ Mark the message in scope as Read """
        self.read = True
        db.session.commit()

    @staticmethod
    def get_unread_message_count(user_id: int):
        """ Get count of unread messages for user """
        return Message.query.filter(Message.to_user_id == user_id, Message.read == False).count()

    @staticmethod
    def get_all_messages(user_id: int) -> MessagesDTO:
        """ Gets all messages to the user """
        user_messages = Message.query.filter(Message.to_user_id == user_id).all()

        if len(user_messages) == 0:
            raise NotFound()

        messages_dto = MessagesDTO()
        for message in user_messages:
            messages_dto.user_messages.append(message.as_dto())

        return messages_dto

    def delete(self):
        """ Deletes the current model from the DB """
        db.session.delete(self)
        db.session.commit()
