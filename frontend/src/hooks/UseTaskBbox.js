import { useMemo } from 'react';
import bbox from '@turf/bbox';

export const useTaskBbox = (taskId, geojson) => {
  const getTaskBBox = useMemo(() => {
    if (geojson && geojson.features) {
      const filteredTasks = geojson.features.filter((task) => task.properties.taskId === taskId);
      if (filteredTasks && filteredTasks.length && filteredTasks[0].geometry)
        return bbox(filteredTasks[0].geometry);
    }
  }, [taskId, geojson]);
  return getTaskBBox;
};
