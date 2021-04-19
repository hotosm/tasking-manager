import {
  createTaskGrid,
  makeGrid,
  splitTaskGrid,
  createTaskFeature_,
  AXIS_OFFSET,
} from '../taskGrid';
import { AOI } from './snippets/AOI';
import {
  taskGrid,
  geomToSplit,
  newSplitTaskGrid,
  taskGridAtZoomLevel13,
} from './snippets/taskGrid';

describe('createTaskFeature function', () => {
  let step = AXIS_OFFSET / Math.pow(2, 11 - 1); //19567.8792375

  it('creates tasks at zoom level 11', () => {
    let result = createTaskFeature_(step, 0, 0, 11);
    expect(result.type).toBe('Feature');
    expect(result.properties['isSquare']).toBe(true);
    expect(result.properties['x']).toBe(0);
    expect(result.properties['y']).toBe(0);
    expect(result.properties['zoom']).toBe(11);
    expect(result.geometry.type).toBe('MultiPolygon');
  });
});

describe('createTaskGrid function', () => {
  let areaOfInterestExtent = [
    2039794.9535485709,
    1484921.8447037777,
    2040126.9768901384,
    1485231.175802575,
  ];

  it('creates a task grid from the bbox at zoom level 11', () => {
    let result = createTaskGrid(areaOfInterestExtent, 11);
    expect(result).toStrictEqual(taskGrid);
  });

  it('creates a new task grid from the bbox at zoom level 13', () => {
    let result = createTaskGrid(areaOfInterestExtent, 13);
    expect(result).toStrictEqual(taskGridAtZoomLevel13);
  });
});

describe('makeGrid function', () => {
  it('creates a task grid from AOI for zoom level 11', () => {
    const result = makeGrid(AOI, 11);
    expect(result).toEqual(taskGrid);
    expect(result.features.length).toBe(1);
    result.features.forEach((g) => {
      expect(g.properties.zoom).toBe(11);
    });
  });

  it('creates a different task grid from AOI for different zoom levels ', () => {
    // zoom level 13
    let result = makeGrid(AOI, 13);
    expect(result.features.length).toBe(2);
    result.features.forEach((g) => {
      expect(g.properties.zoom).toBe(13);
    });
    // zoom level 17
    result = makeGrid(AOI, 17);
    expect(result.features.length).toBe(4);
    result.features.forEach((g) => {
      expect(g.properties.zoom).toBe(17);
    });
    // zoom level 18
    result = makeGrid(AOI, 18);
    expect(result.features.length).toBe(12);
    result.features.forEach((g) => {
      expect(g.properties.zoom).toBe(18);
    });
  });
});

describe('SplitTaskGrid function', () => {
  it('splits a one-task grid into a 4-tasks grid', () => {
    let result = splitTaskGrid(taskGrid, geomToSplit);
    expect(result).toStrictEqual(newSplitTaskGrid);
    expect(result.length).toBe(4);
  });
});
