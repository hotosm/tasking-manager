from flask_script import Manager, Command
from server import create_app, db

#application = create_app()  # Initialise the flask app.
manager = Manager(create_app)


@manager.command
def createdb(drop_first=False):
    """Creates the database."""
    if drop_first:
        db.drop_all()
    db.create_all()


if __name__ == '__main__':
    manager.run()
