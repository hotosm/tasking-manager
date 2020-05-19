import React, { useState, useEffect } from 'react';
import intersect from '@turf/intersect';
import { polygon, multiPolygon, featureCollection } from '@turf/helpers';
import { FormattedMessage } from 'react-intl';

import messages from './messages';
import { addLayer } from './index';
import { Button } from '../button';

const clipProject = (clip, metadata, map, updateMetadata) => {
  const taskGrid = metadata.tempTaskGrid;

  let intersect_array = [];
  // Evaluate for each polygon in the features array.
  metadata.geom.features.forEach((g) => {
    let geom = g.geometry;
    if (geom.type === 'MultiPolygon') {
      geom = polygon(geom.coordinates[0]);
    }

    taskGrid.features.forEach((f) => {
      let poly = polygon(f.geometry.coordinates[0]);
      let contains = intersect(geom, poly);
      if (contains === null) {
        return;
      }

      let feature = f;
      if (clip === true) {
        if (contains.geometry.type === 'Polygon') {
          feature = multiPolygon([contains.geometry.coordinates], f.properties);
        } else {
          feature = contains;
          feature.properties = f.properties;
          feature.properties.isSquare = false;
        }
      }
      intersect_array.push(feature);
    });
  });

  const grid = featureCollection(intersect_array);
  updateMetadata({ ...metadata, tasksNo: grid.features.length, taskGrid: grid });
};

export default function TrimProject({ metadata, mapObj, updateMetadata }) {
  useEffect(() => {
    addLayer('grid', metadata.taskGrid, mapObj.map);
  }, [metadata, mapObj]);

  const [clipStatus, setClipStatus] = useState(false);

  return (
    <>
      <h3 className="f3 fw6 mt2 mb3 barlow-condensed blue-dark">
        <FormattedMessage {...messages.step3} />
      </h3>
      <div>
        <p>
          <FormattedMessage {...messages.trimTasksDescriptionLine1} />
        </p>
        <p>
          <FormattedMessage {...messages.trimTasksDescriptionLine2} />
        </p>
        <input
          type="checkbox"
          className="v-mid"
          defaultChecked={clipStatus}
          onChange={() => setClipStatus(!clipStatus)}
        />
        <span className="pl2 v-mid">
          <FormattedMessage {...messages.trimToAOI} />
        </span>
        <div className="pt2">
          <Button
            onClick={() => clipProject(clipStatus, metadata, mapObj.map, updateMetadata)}
            className="white bg-blue-dark"
          >
            <FormattedMessage {...messages.trim} />
          </Button>
        </div>
      </div>
    </>
  );
}
