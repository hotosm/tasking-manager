import bleach
from markdown import markdown

from backend import db
from backend.models.dtos.banner_dto import BannerDTO


class Banner(db.Model):
    """Model for Banners"""

    __tablename__ = "banner"

    # Columns
    id = db.Column(db.Integer, primary_key=True)
    message = db.Column(db.String(255), nullable=False)
    visible = db.Column(db.Boolean, default=False, nullable=False)

    def create(self):
        """Creates and saves the current model to the DB"""
        db.session.add(self)
        db.session.commit()

    def update(self):
        """Updates the current model in the DB"""
        db.session.commit()

    def update_from_dto(self, dto: BannerDTO):
        """Updates the current model in the DB"""
        self.message = dto.message
        self.visible = dto.visible
        db.session.commit()

    def as_dto(self):
        """Returns a dto for the banner"""
        banner_dto = BannerDTO()
        banner_dto.message = self.message
        banner_dto.visible = self.visible
        return banner_dto

    @staticmethod
    def get():
        """Returns a banner and creates one if it doesn't exist"""
        banner = Banner.query.first()
        if banner is None:
            banner = Banner()
            banner.message = "Welcome to the API"
            banner.visible = True
            banner.create()
        return banner

    @staticmethod
    def to_html(mark_down_text):
        """
        Converts markdown text to html
        :param mark_down_text: The markdown text to convert
        :return: The html text
        """
        # Use bleach to remove any potential mischief
        allowed_tags = [
            "a",
            "b",
            "i",
            "h3",
            "h4",
            "h5",
            "h6",
            "p",
            "pre",
            "strong",
        ]
        allowed_atrributes = {"a": ["href", "rel"]}
        clean_message = bleach.clean(
            markdown(mark_down_text, output_format="html"),
            tags=allowed_tags,
            attributes=allowed_atrributes,
            strip=True,
        )
        clean_message = bleach.linkify(clean_message)
        return clean_message
