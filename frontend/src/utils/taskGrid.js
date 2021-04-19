import intersect from '@turf/intersect';
import bboxPolygon from '@turf/bbox-polygon';
import bbox from '@turf/bbox';
import { polygon, multiPolygon, featureCollection } from '@turf/helpers';

// Maximum resolution of OSM
const MAXRESOLUTION = 156543.0339;

// X/Y axis offset
export const AXIS_OFFSET = (MAXRESOLUTION * 256) / 2;

export const degrees2meters = (lon, lat) => {
  const x = (lon * 20037508.34) / 180;
  let y = Math.log(Math.tan(((90 + lat) * Math.PI) / 360)) / (Math.PI / 180);
  y = (y * 20037508.34) / 180;

  return [x, y];
};

export const meters2degress = (x, y) => {
  const lon = (x * 180) / 20037508.34;
  //thanks magichim @ github for the correction
  const lat = (Math.atan(Math.exp((y * Math.PI) / 20037508.34)) * 360) / Math.PI - 90;

  return [lon, lat];
};

export const createTaskFeature_ = (step, x, y, zoomLevel) => {
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

export const createTaskGrid = (areaOfInterestExtent, zoomLevel) => {
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

export const makeGrid = (geom, zoom) => {
  let geomBbox = bbox(geom);

  const minxy = degrees2meters(geomBbox[0], geomBbox[1]);
  const maxxy = degrees2meters(geomBbox[2], geomBbox[3]);

  geomBbox = [minxy[0], minxy[1], maxxy[0], maxxy[1]];

  const grid = createTaskGrid(geomBbox, zoom);

  return grid;
};

export const splitTaskGrid = (taskGrid, geom) => {
  let newTaskGrid = [];
  taskGrid.features.forEach((f) => {
    let poly = polygon(f.geometry.coordinates[0]);
    let contains = intersect(geom, poly);
    if (contains === null) {
      newTaskGrid.push(f);
    } else {
      const splitGrid = makeGrid(f, f.properties.zoom + 1);
      splitGrid.features.forEach((g) => {
        newTaskGrid.push(g);
      });
    }
  });

  return newTaskGrid;
};
