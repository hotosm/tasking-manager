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
        Generates Swagger UI readable JSON
        ---
        tags:
          - docs
        definitions:
            - schema:
                id: GeoJsonMultiPolygon
                properties:
                    type:
                        type: string
                        default: MultiPolygon
                    coordinates:
                        type: array
                        items:
                            type: number
                            default: [[[-4.0237,56.0904],[-3.9111,56.1715],[-3.8122,56.0980],[-4.0237,56.0904]]]
            - schema:
                id: GeoJsonMultiPolygonWithProperties
                properties:
                    type:
                        type: string
                        default: MultiPolygon
                    coordinates:
                        type: array
                        items:
                            type: number
                            default: [[[-4.0237,56.0904],[-3.9111,56.1715],[-3.8122,56.0980],[-4.0237,56.0904]]]
                    properties:
                        type: object
                        properties:
                            x:
                                type: integer
                                default: 2402
                            y:
                                type: integer
                                default: 1736
                            zoom:
                                type: integer
                                default: 12
        """
        swag = swagger(current_app)
        swag['info']['title'] = "HOT Tasking Manager API"
        swag['info']['description'] = "API endpoints for the HOT tasking manager"
        swag['info']['version'] = "0.0.1"

        return jsonify(swag)
