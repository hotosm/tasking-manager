import base64

from flask_migrate import MigrateCommand
from flask_script import Manager

from server import create_app
from server.services.users.authentication_service import AuthenticationService
from server.services.users.user_service import UserService

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


@manager.command
def refresh_levels():
    print('Started updating mapper levels...')
    users_updated = UserService.refresh_mapper_level()
    print(f'Updated {users_updated} user mapper levels')


if __name__ == '__main__':
    manager.run()
