from backend import db


class ReleaseVersion(db.Model):
    """Describes an current release version of TM (i.e. github.com/hotosm/tasking-manager)"""

    __tablename__ = "release_version"
    tag_name = db.Column(db.String(64), nullable=False, primary_key=True)
    published_at = db.Column(db.DateTime, nullable=False)

    def update(self):
        db.session.commit()

    def save(self):
        db.session.add(self)
        db.session.commit()

    @staticmethod
    def get():
        return ReleaseVersion.query.first()
