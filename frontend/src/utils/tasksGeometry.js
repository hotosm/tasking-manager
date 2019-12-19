import * as turf from '@turf/turf';

export function getCentroidAndZoomFromSelectedTasks(tasks, selectedTaskIds) {
  const selectedTasksGeom = turf.featureCollection(
    tasks.features.filter(task => selectedTaskIds.includes(task.properties.taskId))
  );
  const selectedTasksCentroid = turf.centroid(selectedTasksGeom).geometry.coordinates;
  let zoomLevel = 15;
  if (selectedTaskIds.length === 1) {
    zoomLevel = selectedTasksGeom.features[0].properties.taskZoom;
  }
  return [selectedTasksCentroid, zoomLevel];
}
