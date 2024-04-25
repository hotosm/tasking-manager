import bleach
from markdown import markdown

from sqlalchemy import Column, Integer, String, Boolean
from backend.models.dtos.banner_dto import BannerDTO
from backend.db import Base, get_session
session = get_session()

class Banner(Base):
    """Model for Banners"""

    __tablename__ = "banner"

    # Columns
    id = Column(Integer, primary_key=True)
    message = Column(String(255), nullable=False)
    visible = Column(Boolean, default=False, nullable=False)

    def create(self):
        """Creates and saves the current model to the DB"""
        session.add(self)
        session.commit()

    def update(self):
        """Updates the current model in the DB"""
        session.commit()

    def update_from_dto(self, dto: BannerDTO):
        """Updates the current model in the DB"""
        self.message = dto.message
        self.visible = dto.visible
        session.commit()

    def as_dto(self):
        """Returns a dto for the banner"""
        banner_dto = BannerDTO()
        banner_dto.message = self.message
        banner_dto.visible = self.visible
        return banner_dto

    @staticmethod
    def get():
        """Returns a banner and creates one if it doesn't exist"""
        banner = session.query(Banner).first()
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
