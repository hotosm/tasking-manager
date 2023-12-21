import json 
import requests
import os

mapping_types_reverse = {
    1 : ["highway", "roads"],
    2 : ["building", "buildings"],
    3 : ["waterway", "waterways"],
    4 : ["landuse", "landUse"],
    5 : ["other", "other"]
}

output_types = ["geojson", "shp", "kml"]

raw_data_api = os.environ.get('RAW_DATA_API', "https://api-prod.raw-data.hotosm.org/v1/snapshot/")
rawdata_api_auth_token = os.environ.get('RAWDATA_API_AUTH_TOKEN', "")
active_projects_api_base_url = os.environ.get('ACTIVE_PROJECTS_API_BASE_URL', "")

headers = {
    "Content-Type": "application/json",
    "Access-Token": rawdata_api_auth_token
}

def generate_payload(project_id: int, mapping_type: str, output_type: str, bbox_geometry: str) -> dict:
    """
    Generate a payload data dictionary for the given project, mapping type, output type, and bounding box geometry.

    Args:
        project_id (int): The ID of the project.
        mapping_type (str): The type of mapping.
        output_type (str): The type of output.
        bbox_geometry (str): The bounding box geometry.

    Returns:
        dict: The payload data dictionary.
    """
    payload_data = {
        "bindZip": "true",
        "centroid": "false",
        "fileName": f"hotosm_project_{project_id}_{mapping_type[1]}",
        "outputType": output_type,
        "uuid": "false",
        "useStWithin": "true",
        "filters": {
            "tags": {
                "all_geometry": {
                    "join_or": {
                        mapping_type[0]: [],
                    }
                }
            },
            "attributes": {
                "all_geometry": [
                    "name",
                    ""
                ]
            }
        },
        "geometry": bbox_geometry
    }
    return payload_data

def lambda_handler(event, context):
    """
    This function retrieves active projects from Tasking Manager API and generates payloads for each project.
    The payloads are then used to call the Raw Data API.
    """

    time_interval = 24
    active_projects_api = f"{active_projects_api_base_url}/api/v2/projects/queries/active/?interval={time_interval}"
    active_projects_api_response = requests.get(active_projects_api)
    
    if active_projects_api_response.status_code == 200:
        active_projects = active_projects_api_response.json()
        
        for feature in active_projects['features']:
            geometry = feature['geometry']
            project_id = feature['properties'].get('project_id')
            mapping_types = feature['properties'].get('mapping_types')
            
            if mapping_types is not None:
                for mapping_type in mapping_types:
                    for output_type in output_types:
                        mapping_type_value = mapping_types_reverse.get(mapping_type, None)
                        if mapping_type_value is not None:
                            payload = generate_payload(project_id, mapping_type_value, output_type, geometry)
                            payload_json = json.dumps(payload)
                            response = requests.post(raw_data_api, headers=headers, data=payload_json)
                            print(response.json())

# Commented for Lambda use, For CLI Use Uncomment.
if __name__ == "__main__":
    lambda_handler(event, context)