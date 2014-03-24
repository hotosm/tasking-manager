from sqlalchemy import create_engine
from osmtm.models import Base

db_url = 'postgresql://www-data:@localhost/osmtm_tests'

engine = create_engine(db_url)
Base.metadata.drop_all(engine)
Base.metadata.create_all(engine)
