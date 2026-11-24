import area from '@turf/area';
import bbox from '@turf/bbox';
import intersect from '@turf/intersect';

// An overlap smaller than this share of the smaller polygon is treated as a sliver
// (e.g. a task that only touches the priority area's edge) and is ignored.
export const SLIVER_TOLERANCE = 0.01;

const toFeature = (geometry) =>
  geometry && geometry.type === 'Feature'
    ? geometry
    : { type: 'Feature', properties: {}, geometry };

const bboxesOverlap = (a, b) => a[0] <= b[2] && b[0] <= a[2] && a[1] <= b[3] && b[1] <= a[3];

/**
 * Returns the ids of the tasks that overlap any of the priority areas by more than a sliver.
 * Works with Polygon and MultiPolygon geometries. Tasks or areas whose geometry can't be
 * processed (e.g. invalid rings) are skipped instead of throwing.
 *
 * @param {Object} tasks GeoJSON FeatureCollection of tasks with a `taskId` property
 * @param {Array} priorityAreas Polygon/MultiPolygon geometries (or features)
 * @param {number} tolerance share of the smaller polygon's area an overlap must exceed
 * @returns {number[]} task ids
 */
export function getTaskIdsInPriorityAreas(tasks, priorityAreas, tolerance = SLIVER_TOLERANCE) {
  if (!tasks?.features?.length || !priorityAreas?.length) return [];

  const areas = priorityAreas
    .map((geometry) => {
      try {
        const feature = toFeature(geometry);
        const areaSize = area(feature);
        return areaSize > 0 ? { feature, area: areaSize, bbox: bbox(feature) } : null;
      } catch (e) {
        return null;
      }
    })
    .filter(Boolean);

  const taskIds = [];
  tasks.features.forEach((task) => {
    try {
      const taskArea = area(task);
      if (!(taskArea > 0)) return;
      const taskBbox = bbox(task);
      const overlaps = areas.some((priorityArea) => {
        if (!bboxesOverlap(taskBbox, priorityArea.bbox)) return false;
        const overlap = intersect(task, priorityArea.feature);
        if (!overlap) return false;
        return area(overlap) > tolerance * Math.min(taskArea, priorityArea.area);
      });
      if (overlaps) taskIds.push(task.properties.taskId);
    } catch (e) {
      // invalid task geometry: leave the task out of the selection
    }
  });
  return taskIds;
}
