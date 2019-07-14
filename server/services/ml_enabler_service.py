import requests
import mercantile

from flask import current_app

from ml_enabler.utils.api import get_model_id


class MLEnablerService:
    @staticmethod
    def get_prediction_from_bbox(model_name: str, bbox: str, zoom: int = 18):
        """Sends requests to create a new prediction for a bounding box from a model id"""
        api_url = current_app.config["ML_ENABLER_URL"]
        model_id = get_model_id(api_url, model_name)
        url = f"{api_url}/model/{model_id}/tiles"
        params = dict(bbox=bbox, zoom=zoom)
        response = requests.get(url, params=params)
        data = response.json()
        if not data.get("error"):
            main_response = {
                "status": "ok",
                "prediction_ids": [],
                "error": "",
                "diff_total": 0,
            }
            osm_total = 0
            pred_total = 0

            for k in data.keys():
                main_response["prediction_ids"].append(k)
                new_list = []
                for pred in data[k]:
                    tile = mercantile.quadkey_to_tile(pred["quadkey"])
                    bbox = mercantile.xy_bounds(tile)
                    pred["bbox"] = (bbox.left, bbox.bottom, bbox.right, bbox.top)
                    pred["zoom"] = tile.z
                    new_list.append(pred)

                    # we ignore negativae values
                    if pred["ml_prediction"] > pred["osm_building_area"]:
                        pred_total += pred["ml_prediction"]
                        osm_total += pred["osm_building_area"]

                data[k] = new_list
            main_response["predictions"] = data
            main_response["diff_total"] = pred_total - osm_total
        else:
            main_response = {"status": "error", "error": data.get("error")}

        return main_response

    @staticmethod
    def get_all_models():
        """ Get all models on ml-enabler"""
        url = f'{current_app.config["ML_ENABLER_URL"]}/model/all'
        response = requests.get(url)
        response.raise_for_status()
        return response.json()
