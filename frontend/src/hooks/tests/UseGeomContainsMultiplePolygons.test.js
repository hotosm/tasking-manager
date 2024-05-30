import { renderHook } from '@testing-library/react';

import { useContainsMultiplePolygons } from '../UseGeomContainsMultiplePolygons';

describe('test if useContainsMultiplePolygons', () => {
  it('returns true with an array of polygons', () => {
    const { result } = renderHook(() => useContainsMultiplePolygons(arrayOfPolygons));
    expect(result.current.containsMultiplePolygons).toBeTruthy();
  });
  it('returns true with a MultiPolygon', () => {
    const { result } = renderHook(() => useContainsMultiplePolygons(multiPolygon));
    expect(result.current.containsMultiplePolygons).toBeTruthy();
  });
  it('returns false with only one Polygon', () => {
    const { result } = renderHook(() => useContainsMultiplePolygons(polygon));
    expect(result.current.containsMultiplePolygons).toBeFalsy();
  });
  it('returns false with an empty geom', () => {
    const { result } = renderHook(() => useContainsMultiplePolygons({}));
    expect(result.current.containsMultiplePolygons).toBeFalsy();
  });
  it('returns false if geom is null', () => {
    const { result } = renderHook(() => useContainsMultiplePolygons(null));
    expect(result.current.containsMultiplePolygons).toBeFalsy();
  });
  it('returns false with an empty geom features', () => {
    const { result } = renderHook(() => useContainsMultiplePolygons({ features: [] }));
    expect(result.current.containsMultiplePolygons).toBeFalsy();
  });
});

const arrayOfPolygons = {
  type: 'FeatureCollection',
  features: [
    {
      type: 'Feature',
      properties: {},
      geometry: {
        type: 'Polygon',
        coordinates: [
          [
            [-18.84326, 64.828209],
            [-18.82987, 64.828209],
            [-18.82987, 64.834487],
            [-18.84326, 64.834487],
            [-18.84326, 64.828209],
          ],
        ],
      },
    },
    {
      type: 'Feature',
      properties: {},
      geometry: {
        type: 'Polygon',
        coordinates: [
          [
            [-18.82404, 64.824704],
            [-18.81408, 64.824704],
            [-18.81408, 64.829377],
            [-18.82404, 64.829377],
            [-18.82404, 64.824704],
          ],
        ],
      },
    },
  ],
};

const polygon = {
  type: 'FeatureCollection',
  features: [
    {
      type: 'Feature',
      properties: {},
      geometry: {
        type: 'Polygon',
        coordinates: [
          [
            [-18.84326, 64.828209],
            [-18.82987, 64.828209],
            [-18.82987, 64.834487],
            [-18.84326, 64.834487],
            [-18.84326, 64.828209],
          ],
        ],
      },
    },
  ],
};

const multiPolygon = {
  type: 'FeatureCollection',
  features: [
    {
      type: 'Feature',
      properties: {},
      geometry: {
        type: 'MultiPolygon',
        coordinates: [
          [
            [
              [102.0, 2.0],
              [103.0, 2.0],
              [103.0, 3.0],
              [102.0, 3.0],
              [102.0, 2.0],
            ],
          ],
          [
            [
              [100.0, 0.0],
              [101.0, 0.0],
              [101.0, 1.0],
              [100.0, 1.0],
              [100.0, 0.0],
            ],
            [
              [100.2, 0.2],
              [100.8, 0.2],
              [100.8, 0.8],
              [100.2, 0.8],
              [100.2, 0.2],
            ],
          ],
        ],
      },
    },
  ],
};
