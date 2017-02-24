from flask import current_app, jsonify
from flask_restful import Resource
from flask_swagger import swagger


class SwaggerDocsAPI(Resource):
    """
    This Resource provides a simple endpoint for flask-swagger to generate the API docs,
    https://github.com/gangverk/flask-swagger
    """

    def get(self):
        """
        Generates Swagger UI readable YAML.  No need to document this API, as it's internal to the app
        :return: Swagger UI JSON object
        """
        swag = swagger(current_app)
        swag['info']['title'] = "HOT Tasking Manager API"
        swag['info']['description'] = "API endpoints for the HOT tasking manager"
        swag['info']['version'] = "0.0.1"

        return jsonify(swag)
