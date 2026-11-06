import '@testing-library/jest-dom';
import { render } from '@testing-library/react';
import maplibregl from 'maplibre-gl';

import { ProjectsMap } from '../projectsMap';

jest.mock('../../../utils/isWebglSupported', () => ({
  __esModule: true,
  default: () => true,
}));

const someProjects = {
  type: 'FeatureCollection',
  features: [
    {
      type: 'Feature',
      geometry: { type: 'Point', coordinates: [0, 0] },
      properties: { projectId: 1 },
    },
  ],
};
const noProjects = { type: 'FeatureCollection', features: [] };

test('an empty search result clears the markers left by the previous search', () => {
  // a minimal stand-in for the maplibre map: records the 'projects' source
  const sources = {};
  const map = {
    addControl: () => map,
    addImage: jest.fn(),
    addLayer: jest.fn(),
    addSource: jest.fn((name) => {
      sources[name] = { setData: jest.fn() };
    }),
    getSource: (name) => sources[name],
    isStyleLoaded: () => true,
    getCanvas: () => ({ style: {} }),
    on: jest.fn(),
    remove: jest.fn(),
  };
  maplibregl.Map = function () {
    return map;
  };
  maplibregl.AttributionControl = function () {};

  const { rerender } = render(<ProjectsMap mapResults={someProjects} setQuery={jest.fn()} />);
  expect(map.addSource).toHaveBeenCalledWith(
    'projects',
    expect.objectContaining({ data: someProjects }),
  );

  rerender(<ProjectsMap mapResults={noProjects} setQuery={jest.fn()} />);
  expect(sources.projects.setData).toHaveBeenLastCalledWith(noProjects);
});
