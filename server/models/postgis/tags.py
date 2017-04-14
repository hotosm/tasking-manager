from server import db


class Tags(db.Model):
    """ Describes an individual mapping Task """
    __tablename__ = "tags"

    id = db.Column(db.Integer, primary_key=True)
    organisations = db.Column(db.String, unique=True)
    campaigns = db.Column(db.String, unique=True)

    @staticmethod
    def upsert_organistion_tag(organisation_tag: str) -> str:
        """ Insert organisation tag if it doesn't exists otherwise return matching tag """
        org_tag = Tags.query.filter_by(organisations=organisation_tag.lower()).one_or_none()

        if org_tag is not None:
            return org_tag

        tag = Tags()
        tag.organisations = organisation_tag.lower()
        db.session.add(tag)
        db.session.commit()
        return organisation_tag.lower()

    @staticmethod
    def upsert_campaign_tag(campaign_tag: str) -> str:
        """ Insert campaign tag if doesn't exist otherwise return matching tag"""
        camp_tag = Tags.query.filter_by(campaigns=campaign_tag.lower()).one_or_none()

        if camp_tag is not None:
            return camp_tag

        tag = Tags()
        tag.campaigns = campaign_tag.lower()
        db.session.add(tag)
        db.session.commit()
        return campaign_tag.lower()
