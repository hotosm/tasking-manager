import { featureCollection } from '@turf/helpers';
import bbox from '@turf/bbox';
import { viewport } from '@placemarkio/geo-viewport';

export function getCentroidAndZoomFromSelectedTasks(tasks, selectedTaskIds, windowSize) {
  return viewport(getSelectedTasksBBox(tasks, selectedTaskIds), windowSize);
}

export function getSelectedTasksBBox(tasks, selectedTaskIds) {
  const selectedTasksGeom = selectedTaskIds
    ? featureCollection(
        tasks.features.filter((task) => selectedTaskIds.includes(task.properties.taskId)),
      )
    : tasks;
  return bbox(selectedTasksGeom);
}
