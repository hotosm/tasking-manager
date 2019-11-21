import React, { useState, useEffect } from 'react';
import * as turf from '@turf/turf';
import { layerJson } from './setTaskSizes';

const clipProject = (clip, metadata, map, updateMetadata) => {
  const taskGrid = metadata.tempTaskGrid;
  const geom = metadata.geom.features[0].geometry;
  let intersect_array = [];

  taskGrid.features.forEach(f => {
    let poly = turf.polygon(f.geometry.coordinates[0]);
    let contains = turf.intersect(geom, poly);
    if (contains === null) {
      return;
    }

    let feature = f;
    if (clip === true) {
      feature = turf.multiPolygon([contains.geometry.coordinates], f.properties);
    }
    intersect_array.push(feature);
  });

  const grid = turf.featureCollection(intersect_array);
  updateMetadata({ ...metadata, tasksNo: grid.features.length, taskGrid: grid });
};

export default function TrimProject({ metadata, mapObj, updateMetadata }) {
  useEffect(() => {
    if (mapObj.map.getLayer('grid')) {
      mapObj.map.removeLayer('grid');
    }
    if (mapObj.map.getSource('grid')) {
      mapObj.map.removeSource('grid');
    }
    mapObj.map.addLayer(layerJson(metadata.taskGrid));
  }, [metadata, mapObj]);

  const [clipStatus, setClipStatus] = useState(false);

  const buttonStyle = 'mt2 f5 ph4-l pv2-l white bg-blue-dark';

  return (
    <>
      <h3 className="f3 fw6 mt2 mb3 barlow-condensed blue-dark">Step 4: Trim Project</h3>
      <div>
        <p>
          Trim the task grid to the area of interest (optional). You can keep task squares complete,
          or clip them to the AOI.This could take some time.
        </p>

        <div>
          <input
            type="checkbox"
            defaultChecked={clipStatus}
            onChange={() => setClipStatus(!clipStatus)}
          />
          &nbsp; Clip tasks to Area of Interest
        </div>
        <div>
          <button
            type="button"
            onClick={() => clipProject(clipStatus, metadata, mapObj.map, updateMetadata)}
            className={buttonStyle}
          >
            Trim
          </button>
        </div>
      </div>
    </>
  );
}
