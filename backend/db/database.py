from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker

from backend.pagination import CustomQuery
from backend.config import settings

engine = create_engine(settings.SQLALCHEMY_DATABASE_URI)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine, query_cls=CustomQuery)
session = SessionLocal()

Base = declarative_base()
TMMetadata = Base.metadata


def get_db():
    """Create SQLAlchemy DB session."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
