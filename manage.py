import base64
from flask_migrate import MigrateCommand
from flask_script import Manager
from server import create_app
from server.services.authentication_service import AuthenticationService

# Initialise the flask app object
application = create_app()
manager = Manager(application)

# Enable db migrations to be run via the command line
manager.add_command('db', MigrateCommand)


@manager.option('-u', '--user_id', help='Test User ID')
def gen_token(user_id):
    """ Helper method for generating valid base64 encoded session tokens """
    token = AuthenticationService.generate_session_token_for_user(user_id)
    print(f'Raw token is: {token}')
    b64_token = base64.b64encode(token.encode())
    print(f'Your base64 encoded session token: {b64_token}')


if __name__ == '__main__':
    manager.run()
