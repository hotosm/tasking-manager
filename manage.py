from flask_script import Manager
from server import create_app, db

# Initialise the flask app object
manager = Manager(create_app)


@manager.command
def createdb(drop_first=False):
    """
    Creates an empty Database from all SQLAlchemy models
    :param drop_first: CAUTION - set to True and all tables will be dropped prior to creation
    """
    if drop_first:
        db.drop_all()
    db.create_all()


if __name__ == '__main__':
    manager.run()
