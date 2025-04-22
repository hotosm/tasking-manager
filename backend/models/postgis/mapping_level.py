from sqlalchemy import Integer, String, Column, ForeignKey

from backend.db import Base


class MappingLevel(Base):
    """Allows to sort users by their mapping experience"""

    __tablename__ = "mapping_levels"

    id = Column(Integer, primary_key=True)
    name = Column(String, nullable=False)
    image_path = Column(String, nullable=True)
    approvals_required = Column(Integer, nullable=False, default=0)
    color = Column(String, nullable=True)
    ordering = Column(Integer, nullable=False)
