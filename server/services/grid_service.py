import json
import geojson
from geoalchemy2 import functions


class GridService:
    @staticmethod
    def trim_tasks_to_aoi(aoi, tasks, clip):
        return tasks
