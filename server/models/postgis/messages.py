from server import db
from server.models.postgis.utils import timestamp


class Messages(db.Model):
    """ Describes an individual mapping Task """
    __tablename__ = "messages"

    id = db.Column(db.Integer, primary_key=True)
    message = db.Column(db.String)
    subject = db.Column(db.String)
    from_user_id = db.Column(db.BigInteger, db.ForeignKey('users.id'))
    to_user_id = db.Column(db.BigInteger, db.ForeignKey('users.id'))
    date = db.Column(db.DateTime, default=timestamp)
    read = db.Column(db.Boolean)
