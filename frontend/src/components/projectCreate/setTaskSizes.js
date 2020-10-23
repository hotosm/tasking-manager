import React, { useLayoutEffect, useCallback } from 'react';
import area from '@turf/area';
import bbox from '@turf/bbox';
import intersect from '@turf/intersect';
import transformScale from '@turf/transform-scale';
import bboxPolygon from '@turf/bbox-polygon';
import { polygon, multiPolygon, featureCollection } from '@turf/helpers';
import { FormattedMessage } from 'react-intl';

import messages from './messages';
import { Button } from '../button';
import { UndoIcon } from '../svgIcons';
import { addLayer } from './index';

// Maximum resolution of OSM
const MAXRESOLUTION = 156543.0339;

// X/Y axis offset
const AXIS_OFFSET = (MAXRESOLUTION * 256) / 2;

const degrees2meters = (lon, lat) => {
  const x = (lon * 20037508.34) / 180;
  let y = Math.log(Math.tan(((90 + lat) * Math.PI) / 360)) / (Math.PI / 180);
  y = (y * 20037508.34) / 180;

  return [x, y];
};

const meters2degress = (x, y) => {
  const lon = (x * 180) / 20037508.34;
  //thanks magichim @ github for the correction
  const lat = (Math.atan(Math.exp((y * Math.PI) / 20037508.34)) * 360) / Math.PI - 90;

  return [lon, lat];
};

const createTaskFeature_ = (step, x, y, zoomLevel) => {
  const xmin = x * step - AXIS_OFFSET;
  const ymin = y * step - AXIS_OFFSET;
  const xmax = (x + 1) * step - AXIS_OFFSET;
  const ymax = (y + 1) * step - AXIS_OFFSET;

  const minlnglat = meters2degress(xmin, ymin);
  const maxlnglat = meters2degress(xmax, ymax);

  const properties = {
    x: x,
    y: y,
    zoom: zoomLevel,
    isSquare: true,
  };
  const stepBbox = [minlnglat[0], minlnglat[1], maxlnglat[0], maxlnglat[1]];
  const poly = bboxPolygon(stepBbox);

  return multiPolygon([poly.geometry.coordinates], properties);
};

const createTaskGrid = (areaOfInterestExtent, zoomLevel) => {
  const xmin = Math.ceil(areaOfInterestExtent[0]);
  const ymin = Math.ceil(areaOfInterestExtent[1]);
  const xmax = Math.floor(areaOfInterestExtent[2]);
  const ymax = Math.floor(areaOfInterestExtent[3]);

  // task size (in meters) at the required zoom level
  const step = AXIS_OFFSET / Math.pow(2, zoomLevel - 1);

  // Calculate the min and max task indices at the required zoom level to cover the whole area of interest
  const xminstep = parseInt(Math.floor((xmin + AXIS_OFFSET) / step));
  const xmaxstep = parseInt(Math.ceil((xmax + AXIS_OFFSET) / step));
  const yminstep = parseInt(Math.floor((ymin + AXIS_OFFSET) / step));
  const ymaxstep = parseInt(Math.ceil((ymax + AXIS_OFFSET) / step));

  let taskFeatures = [];
  // Generate an array of task features
  for (let x = xminstep; x < xmaxstep; x++) {
    for (let y = yminstep; y < ymaxstep; y++) {
      let taskFeature = createTaskFeature_(step, x, y, zoomLevel);
      taskFeatures.push(taskFeature);
    }
  }

  return featureCollection(taskFeatures);
};

export const makeGrid = (geom, zoom, mask) => {
  let geomBbox = bbox(geom);

  const minxy = degrees2meters(geomBbox[0], geomBbox[1]);
  const maxxy = degrees2meters(geomBbox[2], geomBbox[3]);

  geomBbox = [minxy[0], minxy[1], maxxy[0], maxxy[1]];

  const grid = createTaskGrid(geomBbox, zoom);

  return grid;
};

const splitTaskGrid = (taskGrid, geom) => {
  let newTaskGrid = [];
  taskGrid.features.forEach((f) => {
    let poly = polygon(f.geometry.coordinates[0]);
    let contains = intersect(geom, poly);
    if (contains === null) {
      newTaskGrid.push(f);
    } else {
      const splitGrid = makeGrid(f, f.properties.zoom + 1, {});
      splitGrid.features.forEach((g) => {
        newTaskGrid.push(g);
      });
    }
  });

  return newTaskGrid;
};

export default function SetTaskSizes({ metadata, mapObj, updateMetadata }) {
  const splitHandler = useCallback(
    (event) => {
      const taskGrid = mapObj.map.getSource('grid')._data;

      if (metadata.tempTaskGrid === null) {
        updateMetadata({ ...metadata, tempTaskGrid: taskGrid });
      }
      // Make the geom smaller to avoid borders.
      const geom = transformScale(event.features[0].geometry, 0.5);
      const newTaskGrid = splitTaskGrid(taskGrid, geom);

      updateMetadata({
        ...metadata,
        taskGrid: featureCollection(newTaskGrid),
        tasksNo: featureCollection(newTaskGrid).features.length,
      });
    },
    [updateMetadata, metadata, mapObj.map],
  );

  const splitBbox = () => {
    mapObj.map.on('mouseenter', 'grid', (event) => {
      mapObj.map.getCanvas().style.cursor = 'pointer';
    });
    mapObj.map.on('mouseleave', 'grid', (event) => {
      mapObj.map.getCanvas().style.cursor = '';
    });
    mapObj.map.on('click', 'grid', splitHandler);
  };

  const splitPolygon = () => {
    mapObj.map.on('mouseenter', 'grid', (event) => {
      mapObj.map.getCanvas().style.cursor = 'crosshair';
    });
    mapObj.map.on('mouseleave', 'grid', (event) => {
      mapObj.map.getCanvas().style.cursor = '';
    });
    mapObj.map.once('draw.create', (event) => {
      const taskGrid = mapObj.map.getSource('grid')._data;
      if (metadata.tempTaskGrid === null) {
        updateMetadata({ ...metadata, tempTaskGrid: taskGrid });
      }

      const id = event.features[0].id;
      mapObj.draw.delete(id);

      const geom = event.features[0].geometry;
      const newTaskGrid = splitTaskGrid(taskGrid, geom, metadata.zoomLevel);

      updateMetadata({
        ...metadata,
        taskGrid: featureCollection(newTaskGrid),
        tasksNo: featureCollection(newTaskGrid).features.length,
      });
    });

    mapObj.draw.changeMode('draw_polygon');
  };

  const resetGrid = () => {
    updateMetadata({ ...metadata, taskGrid: metadata.tempTaskGrid });
  };

  const smallerSize = useCallback(() => {
    const zoomLevel = metadata.zoomLevel + 1;
    const squareGrid = makeGrid(metadata.geom, zoomLevel, {});
    updateMetadata({
      ...metadata,
      zoomLevel: zoomLevel,
      tempTaskGrid: squareGrid,
      taskGrid: squareGrid,
      tasksNo: squareGrid.features.length,
    });
  }, [metadata, updateMetadata]);

  const largerSize = useCallback(() => {
    const zoomLevel = metadata.zoomLevel - 1;
    const squareGrid = makeGrid(metadata.geom, zoomLevel, {});
    if (zoomLevel > 0) {
      updateMetadata({
        ...metadata,
        zoomLevel: zoomLevel,
        tempTaskGrid: squareGrid,
        taskGrid: squareGrid,
        tasksNo: squareGrid.features.length,
      });
    }
  }, [metadata, updateMetadata]);

  useLayoutEffect(() => {
    addLayer('grid', metadata.taskGrid, mapObj.map);
    return () => {
      mapObj.map.off('click', 'grid', splitHandler);
    };
  }, [metadata, mapObj, smallerSize, largerSize, splitHandler]);

  const buttonStyle = 'white bg-blue-dark';

  return (
    <>
      <h3 className="f3 fw6 mt2 mb3 barlow-condensed blue-dark">
        <FormattedMessage {...messages.step2} />
      </h3>
      <div>
        <div>
          <p>
            <FormattedMessage {...messages.taskSizes} />
          </p>
          <div role="group">
            <Button onClick={smallerSize} className={`${buttonStyle} mr2`}>
              <FormattedMessage {...messages.smaller} />
            </Button>
            <Button onClick={largerSize} className={buttonStyle}>
              <FormattedMessage {...messages.larger} />
            </Button>
          </div>
        </div>
        <div className="pt3">
          <p>
            <FormattedMessage {...messages.splitTaskDescription} />
          </p>
          <div role="group">
            <Button className={`${buttonStyle} mr2`} onClick={splitBbox}>
              <FormattedMessage {...messages.splitByClicking} />
            </Button>
            <Button className={buttonStyle} onClick={splitPolygon}>
              <FormattedMessage {...messages.splitByDrawing} />
            </Button>
            <Button className="bg-white blue-dark db mt2" onClick={resetGrid}>
              <UndoIcon className="w1 h1 mr2 v-mid pb1" />
              <FormattedMessage {...messages.reset} />
            </Button>
          </div>
        </div>
        <p>
          <FormattedMessage {...messages.taskNumberMessage} values={{ n: metadata.tasksNo || 0 }} />
        </p>
        <p>
          <FormattedMessage
            {...messages.taskAreaMessage}
            values={{
              area: (area(metadata.taskGrid.features[0]) / 1e6).toFixed(2) || 0,
              sq: <sup>2</sup>,
            }}
          />
        </p>
      </div>
    </>
  );
}
