from flask_migrate import MigrateCommand
from flask_script import Manager
from server import create_app, db

# Initialise the flask app object
manager = Manager(create_app)

# Enable db migrations to be run via the command line
manager.add_command('db', MigrateCommand)


@manager.command
def createdb(drop_first=False):
    # TODO - Remove this function, handy for early stage dev, but too dangerous to leave
    if drop_first:
        db.drop_all()
    db.create_all()


if __name__ == '__main__':
    manager.run()
