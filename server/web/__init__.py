from flask import Blueprint

swagger = Blueprint('swagger', __name__, static_folder='static/swagger-ui', url_prefix='/api-docs')
main = Blueprint('main', __name__, static_folder='static/dist', template_folder="templates")

from . import controller
