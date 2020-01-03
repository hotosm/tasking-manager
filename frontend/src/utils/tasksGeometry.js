import { featureCollection, bbox } from '@turf/turf';
import { viewport } from '@mapbox/geo-viewport';

export function getCentroidAndZoomFromSelectedTasks(tasks, selectedTaskIds, windowSize) {
  return viewport(getSelectedTasksBBox(tasks, selectedTaskIds), windowSize);
}

export function getSelectedTasksBBox(tasks, selectedTaskIds) {
  const selectedTasksGeom = featureCollection(
    tasks.features.filter(task => selectedTaskIds.includes(task.properties.taskId)),
  );
  return bbox(selectedTasksGeom);
}
