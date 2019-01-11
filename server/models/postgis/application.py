from server import db


class Application(db.Model):
    """ Describes an application that is authorized to access the TM """
    __tablename__ = "application"

    id = db.Column(db.BigInteger, primary_key=True, index=True)
    userid = db.Column(db.BigInteger, db.ForeignKey('users.id', name='fk_users'), nullable=False)
    app_key = db.Column()
    

    def generate_application_key(self):
        """
        Creates a key for use with an application.
        """
        return uuid

    def create(self):
        db.session.add(self)
        db.session.commit()

    def save(self):
        db.session.commit()

    def delete(self):
        db.session.delete(self)
        db.session.commit()

    def as_dto(self):
        app_dto = AppDTO()
        return app_dto
