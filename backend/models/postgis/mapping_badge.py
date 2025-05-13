from sqlalchemy import Integer, String, Column, ForeignKey, Boolean

from backend.db import Base


class MappingBadge(Base):
    """Represents achievements by users that can be later used to grant mapping
    levels"""

    __tablename__ = "mapping_badges"

    id = Column(Integer, primary_key=True)
    name = Column(String, nullable=False)
    description = Column(String, nullable=False)
    image_path = Column(String, nullable=True)
    requirements = Column(JSON, nullable=False)
    is_enabled = Column(Boolean, nullable=False, default=True)
