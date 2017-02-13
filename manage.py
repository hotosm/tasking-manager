from flask_script import Manager
from server import bootstrap_app

application = bootstrap_app()  # Initialise the flask app.
manager = Manager(application)


if __name__ == '__main__':
    manager.run()
