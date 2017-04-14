from server import db


class Tags(db.Model):
    """ Describes an individual mapping Task """
    __tablename__ = "tags"

    id = db.Column(db.Integer, primary_key=True)
    organisations = db.Column(db.String, unique=True)
    campaigns = db.Column(db.String, unique=True)

